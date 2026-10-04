import type { WeddingProfile } from "./types";

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(family|clan|house|and)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string): string[] {
  return normalizeName(value).split(" ").filter((part) => part.length >= 3);
}

/** Buddy or guest profiles that belong to this family name. */
export function findLinkedProfiles(
  familyName: string,
  profiles: WeddingProfile[] | null | undefined,
): WeddingProfile[] {
  const people = (profiles || []).filter((p) => p.role === "buddy" || p.role === "guest");
  const family = normalizeName(familyName);
  if (!family || people.length === 0) return [];

  const familyTokens = tokens(familyName);
  return people.filter((profile) => {
    const theirs = normalizeName(profile.name);
    if (!theirs) return false;
    if (theirs === family || family.includes(theirs) || theirs.includes(family)) return true;
    const profileTokens = tokens(profile.name);
    return profileTokens.some((token) => familyTokens.includes(token));
  });
}
