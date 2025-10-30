// Lightweight Kenyan data validators used by multiple screens

export const isValidKenyanPhone = (phone) => /^(\+254|0)[17]\d{8}$/.test(String(phone || '').trim());
export const isValidKRAPin = (pin) => /^[AP]\d{9}[A-Z]$/.test(String(pin || '').trim());
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
export const isValidRegNumber = (reg) => /^K[A-Z]{2}\s?\d{3}[A-Z]$/.test(String(reg || '').trim());

export default {
  isValidKenyanPhone,
  isValidKRAPin,
  isValidEmail,
  isValidRegNumber,
};