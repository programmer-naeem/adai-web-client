/**
 * SMS segment counting (BR-8.9).
 * Unicode (Bangla): 70 chars single, 67 per segment when concatenated.
 * GSM-7 English: 160 / 153.
 */

const GSM7 =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

export function isGsm7(text: string): boolean {
  for (const char of text) {
    if (!GSM7.includes(char)) return false;
  }
  return true;
}

export function smsSegments(text: string): { segments: number; encoding: "gsm7" | "ucs2"; length: number } {
  const length = [...text].length;
  if (length === 0) return { segments: 0, encoding: "ucs2", length: 0 };
  if (isGsm7(text)) {
    const segments = length <= 160 ? 1 : Math.ceil(length / 153);
    return { segments, encoding: "gsm7", length };
  }
  const segments = length <= 70 ? 1 : Math.ceil(length / 67);
  return { segments, encoding: "ucs2", length };
}

export const SMS_PAISA_PER_SEGMENT = 50;
export const WHATSAPP_PAISA_PER_MESSAGE = 80;

export function messageCostPaisa(channel: "Sms" | "WhatsApp", text: string): number {
  if (channel === "WhatsApp") return WHATSAPP_PAISA_PER_MESSAGE;
  const { segments } = smsSegments(text);
  return segments * SMS_PAISA_PER_SEGMENT;
}
