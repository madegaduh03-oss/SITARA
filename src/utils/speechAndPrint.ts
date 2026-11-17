import { QueueItem, Settings } from '../types/sitara';

/**
 * Converts digits like "01", "05", "12", "24" into natural Indonesian spoken form
 * e.g. "01" -> "kosong satu", "10" -> "sepuluh", "15" -> "lima belas"
 */
export function queueNumberToIndonesianSpeech(queueNum: string): string {
  const digits = ['kosong', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
  const cleaned = queueNum.trim();

  // If leading zero like "01", "09", read digit-by-digit ("kosong satu") per PRD spec
  if (cleaned.length === 2 && cleaned.startsWith('0')) {
    const d1 = parseInt(cleaned[0], 10);
    const d2 = parseInt(cleaned[1], 10);
    return `${digits[d1]} ${digits[d2]}`;
  }

  const num = parseInt(cleaned, 10);
  if (Number.isNaN(num)) return cleaned;

  if (num < 10) return digits[num];
  if (num === 10) return 'sepuluh';
  if (num === 11) return 'sebelas';
  if (num < 20) return `${digits[num - 10]} belas`;
  if (num < 100) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return ones === 0 ? `${digits[tens]} puluh` : `${digits[tens]} puluh ${digits[ones]}`;
  }

  return cleaned.split('').map((c) => digits[parseInt(c, 10)] ?? c).join(' ');
}

export function counterNameToIndonesianSpeech(counterName: string): string {
  const match = counterName.match(/\d+/);
  if (!match) return counterName;
  const num = parseInt(match[0], 10);
  const words = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh'];
  return `loket ${words[num] ?? num}`;
}

/**
 * Plays a pleasant 3-note civic chime using Web Audio API (no external audio files needed)
 */
export function playChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }

      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const notes = [587.33, 739.99, 880.0]; // D5 - F#5 - A5 major chime
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);

        gain.gain.setValueAtTime(0.001, now + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.22, now + idx * 0.18 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.58);
      });

      window.setTimeout(() => {
        ctx.close().catch(() => {});
        resolve();
      }, 900);
    } catch {
      resolve();
    }
  });
}

/**
 * Speaks the Indonesian queue announcement using Web Speech API (id-ID)
 * Format: "Nomor antrean kosong satu, silakan menuju ke loket satu"
 */
export async function announceQueueCall(queueNumber: string, counterName: string): Promise<string> {
  const spokenNumber = queueNumberToIndonesianSpeech(queueNumber);
  const spokenCounter = counterNameToIndonesianSpeech(counterName);
  const phrase = `Nomor antrean ${spokenNumber}, silakan menuju ke ${spokenCounter}`;

  await playChime();

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'id-ID';
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find((v) => v.lang.toLowerCase().startsWith('id'));
      if (idVoice) {
        utterance.voice = idVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors in unsupported environments
    }
  }

  return phrase;
}

/**
 * Encodes a 58mm thermal receipt into ESC/POS commands and sends via Web Bluetooth API
 */
export async function printThermalViaBluetooth(
  ticket: QueueItem,
  serviceName: string,
  settings: Settings
): Promise<{ success: boolean; message: string }> {
  const nav = navigator as Navigator & {
    bluetooth?: {
      requestDevice: (options: {
        filters?: Array<{ services?: string[] }>;
        acceptAllDevices?: boolean;
        optionalServices?: string[];
      }) => Promise<{
        name?: string;
        gatt?: {
          connect: () => Promise<{
            getPrimaryService: (uuid: string) => Promise<{
              getCharacteristics: () => Promise<
                Array<{
                  properties: { write?: boolean; writeWithoutResponse?: boolean };
                  writeValue: (data: BufferSource) => Promise<void>;
                  writeValueWithoutResponse?: (data: BufferSource) => Promise<void>;
                }>
              >;
            }>;
          }>;
        };
      }>;
    };
  };

  if (!nav.bluetooth) {
    return {
      success: false,
      message: 'Web Bluetooth tidak didukung di browser ini. Gunakan tombol Cetak Browser (58mm) sebagai alternatif.',
    };
  }

  try {
    const THERMAL_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [THERMAL_SERVICE_UUID, '49535343-fe7d-4ae5-8fa9-9fafd205e455'],
    });

    if (!device.gatt) {
      throw new Error('Perangkat Bluetooth tidak mendukung koneksi GATT.');
    }

    const server = await device.gatt.connect();
    let service;
    try {
      service = await server.getPrimaryService(THERMAL_SERVICE_UUID);
    } catch {
      service = await server.getPrimaryService('49535343-fe7d-4ae5-8fa9-9fafd205e455');
    }

    const characteristics = await service.getCharacteristics();
    const writable = characteristics.find(
      (c) => c.properties.write || c.properties.writeWithoutResponse
    );

    if (!writable) {
      throw new Error('Karakteristik tulis printer thermal tidak ditemukan.');
    }

    const escPosBytes = buildEscPosReceiptBytes(ticket, serviceName, settings);
    // Send in 100-byte MTU-safe chunks
    const chunkSize = 100;
    for (let i = 0; i < escPosBytes.length; i += chunkSize) {
      const chunk = escPosBytes.slice(i, i + chunkSize);
      if (writable.writeValueWithoutResponse && writable.properties.writeWithoutResponse) {
        await writable.writeValueWithoutResponse(chunk);
      } else {
        await writable.writeValue(chunk);
      }
    }

    return {
      success: true,
      message: `Struk nomor ${ticket.queue_number} berhasil dikirim ke printer ${device.name || 'Bluetooth 58mm'}.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Koneksi Bluetooth dibatalkan.';
    return {
      success: false,
      message: `Gagal mencetak via Bluetooth (${msg}). Silakan gunakan tombol Cetak Browser.`,
    };
  }
}

export function buildEscPosReceiptBytes(
  ticket: QueueItem,
  serviceName: string,
  settings: Settings
): Uint8Array {
  const encoder = new TextEncoder();
  const bytes: number[] = [];
  const push = (...arr: number[]) => bytes.push(...arr);
  const pushText = (text: string) => {
    encoder.encode(text).forEach((b) => bytes.push(b));
  };

  // ESC @ (Initialize printer)
  push(0x1b, 0x40);
  // ESC a 1 (Center align)
  push(0x1b, 0x61, 0x01);
  // Bold on
  push(0x1b, 0x45, 0x01);
  pushText(`${settings.header_text.toUpperCase()}\n`);
  // Bold off
  push(0x1b, 0x45, 0x00);
  pushText(`${settings.subheader_text}\n`);
  pushText('--------------------------------\n');
  pushText('NOMOR ANTREAN ANDA\n\n');

  // GS ! 0x33 (Quadruple size for giant queue number)
  push(0x1d, 0x21, 0x33);
  push(0x1b, 0x45, 0x01);
  pushText(`${ticket.queue_number}\n`);
  // Reset text size
  push(0x1d, 0x21, 0x00);
  push(0x1b, 0x45, 0x00);

  pushText('\n');
  pushText(`Layanan: ${serviceName}\n`);
  pushText(`Tanggal: ${ticket.queue_date}\n`);
  pushText(`Waktu  : ${ticket.created_at.split('T')[1] || ''}\n`);
  pushText('--------------------------------\n');
  pushText('Mohon tunggu hingga nomor Anda\n');
  pushText('dipanggil di layar monitor.\n');
  pushText('Terima kasih atas kunjungan Anda\n\n\n');

  // GS V 66 0 (Feed and partial cut)
  push(0x1d, 0x56, 0x42, 0x00);

  return new Uint8Array(bytes);
}
