/**
 * Privacy Enforcement Utilities:
 * Ensures customer personal data, phone numbers, and direct identity
 * are completely masked and shielded from business persons.
 */

export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return "+91 ••••• •••••";
  const cleaned = phone.trim();
  if (cleaned.length <= 4) return "•••• " + cleaned;

  // Preserve country code if present, mask middle digits, reveal last 3
  const last3 = cleaned.slice(-3);
  const first2 = cleaned.slice(0, 3);
  return `${first2} ••••• ••${last3}`;
}

export function generateMaskedCallerId(phone?: string | null): string {
  const last3 = phone ? phone.trim().slice(-3) : "000";
  return `PROXY-PB-${Date.now().toString().slice(-4)}-XX${last3}`;
}

export function getMaskedCustomerName(name?: string | null, id?: string): string {
  const safeId = (id || "USER").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
  if (!name || name.trim().length === 0) {
    return `Customer #${safeId}`;
  }
  const initial = name.trim()[0].toUpperCase();
  return `Customer ${initial}. #${safeId}`;
}

