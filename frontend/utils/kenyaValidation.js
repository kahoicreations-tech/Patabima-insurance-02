// Minimal Kenya-specific validators used by multiple screens

export const isValidKRAPin = (pin) => {
  if (!pin) return false;
  // KRA PIN Format: A or P, 9 digits, then a letter e.g., A123456789Z
  const kraRegex = /^[AP]\d{9}[A-Z]$/i;
  return kraRegex.test(String(pin).trim());
};

export const isValidKenyanPhone = (phone) => {
  if (!phone) return false;
  // Accept +2547XXXXXXXX or 07XXXXXXXX
  const regex = /^(\+254|0)[17]\d{8}$/;
  return regex.test(String(phone).trim());
};

export const isValidEmail = (email) => {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(String(email).trim());
};

export const isValidPlate = (reg) => {
  if (!reg) return false;
  // Common modern format e.g., KCA 123A (allow optional space)
  const regex = /^K[A-Z]{2}\s?\d{3}[A-Z]$/i;
  return regex.test(String(reg).trim());
};

export const sanitizePhone = (phone) => {
  if (!phone) return '';
  const s = String(phone).trim();
  if (s.startsWith('+254')) return s;
  if (s.startsWith('0')) return '+254' + s.slice(1);
  return s;
};

export default {
  isValidKRAPin,
  isValidKenyanPhone,
  isValidEmail,
  isValidPlate,
  sanitizePhone,
};