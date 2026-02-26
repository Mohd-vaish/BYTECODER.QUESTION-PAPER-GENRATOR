export function validate(payload) {
  if (!payload.subject) return "Subject required";
  if (!payload.difficulty) return "Difficulty required";
  if (!payload.count || payload.count < 1) return "Valid count required";
  if (!payload.types || payload.types.length === 0) return "Select at least one type";
  const d = payload.distribution || {};
  if ((d.mcq || d.short || d.long) && [d.mcq, d.short, d.long].some(v => v < 0)) return "Distribution counts must be positive";
  return "";
}
