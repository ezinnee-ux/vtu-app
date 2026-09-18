/**
 * Helpers & Utilities for Nigerian VTU Application
 */

/**
 * Format numeric value as Nigerian Naira currency
 */
export function formatNaira(amount: number, showDecimals = false): string {
  if (isNaN(amount)) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

/**
 * Generate unique transaction reference
 * Format: VTU-YYYYMMDD-XXXXXXXX
 */
export function generateReference(prefix = "VTU"): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${dateStr}-${randomStr}`;
}

/**
 * Normalizes phone numbers to standard 11-digit format (080...)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9+]/g, "").trim();

  // If starts with +234
  if (cleaned.startsWith("+234")) {
    cleaned = "0" + cleaned.substring(4);
  } else if (cleaned.startsWith("234")) {
    cleaned = "0" + cleaned.substring(3);
  }

  return cleaned;
}

/**
 * Validates standard Nigerian mobile phone numbers (11 digits, valid prefix)
 */
export function validateNigerianPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  const regex = /^(070|080|081|090|091)[0-9]{8}$/;
  return regex.test(normalized);
}

/**
 * Detect Nigerian Network Operator from phone number prefix
 */
export function detectNetworkFromPhone(phone: string): "mtn" | "airtel" | "glo" | "9mobile" | null {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length < 4) return null;

  const prefix = normalized.substring(0, 4);

  // MTN prefixes
  const mtnPrefixes = [
    "0803", "0806", "0810", "0813", "0814", "0816",
    "0703", "0706", "0704", "0903", "0906", "0913", "0916"
  ];
  if (mtnPrefixes.includes(prefix)) return "mtn";

  // Airtel prefixes
  const airtelPrefixes = [
    "0802", "0808", "0812", "0701", "0708",
    "0902", "0907", "0901", "0904", "0912"
  ];
  if (airtelPrefixes.includes(prefix)) return "airtel";

  // Glo prefixes
  const gloPrefixes = [
    "0805", "0807", "0811", "0815", "0705",
    "0905", "0915"
  ];
  if (gloPrefixes.includes(prefix)) return "glo";

  // 9mobile (formerly Etisalat) prefixes
  const etisalatPrefixes = [
    "0809", "0817", "0818", "0909", "0908"
  ];
  if (etisalatPrefixes.includes(prefix)) return "9mobile";

  return null;
}

/**
 * Network details metadata
 */
export const NETWORK_METADATA = {
  mtn: {
    name: "MTN Nigeria",
    code: "mtn",
    color: "#FFCC00",
    textColor: "#000000",
    bgClass: "bg-yellow-400",
    borderClass: "border-yellow-500",
    tag: "Instant 4G/5G",
    badge: "MTN",
  },
  airtel: {
    name: "Airtel Nigeria",
    code: "airtel",
    color: "#E60000",
    textColor: "#FFFFFF",
    bgClass: "bg-red-600",
    borderClass: "border-red-600",
    tag: "Smartphone Network",
    badge: "AIRTEL",
  },
  glo: {
    name: "Glo Nigeria",
    code: "glo",
    color: "#269537",
    textColor: "#FFFFFF",
    bgClass: "bg-green-600",
    borderClass: "border-green-600",
    tag: "Grandmasters of Data",
    badge: "GLO",
  },
  "9mobile": {
    name: "9mobile Nigeria",
    code: "9mobile",
    color: "#8DC63F",
    textColor: "#FFFFFF",
    bgClass: "bg-lime-600",
    borderClass: "border-lime-600",
    tag: "Morecliq Superfast",
    badge: "9MOBILE",
  },
};
