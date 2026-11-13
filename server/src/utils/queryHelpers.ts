export function buildCaseVariants(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const lower = trimmed.toLowerCase();
  const upper = trimmed.toUpperCase();
  const title = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  return Array.from(new Set([trimmed, lower, upper, title]));
}
