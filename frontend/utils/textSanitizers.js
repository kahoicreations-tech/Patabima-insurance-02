// Utility sanitizers for display text

// Remove any bracketed notes like "(field tonnage)" or "(Number of passengers)"
export function stripBracketNotes(input) {
  if (!input || typeof input !== 'string') return input;
  return input.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

// Uppercase normalize for matching
export function normalizeName(input) {
  return (stripBracketNotes(input || '') || '').toUpperCase();
}
