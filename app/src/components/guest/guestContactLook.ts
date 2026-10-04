export function guestDisplayName(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Family";
  return trimmed.replace(/\s+(family|clan|house)\s*$/i, "").trim() || trimmed;
}

export function guestContactInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

export function guestContactTone(seed: string): string {
  const tones = [
    "bg-[#f3e0e4] text-primary",
    "bg-[#f5edd8] text-[#8a6a12]",
    "bg-[#e8efe8] text-[#2f5d3a]",
    "bg-[#f0e2d4] text-[#8a4f28]",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 97;
  return tones[hash % tones.length];
}
