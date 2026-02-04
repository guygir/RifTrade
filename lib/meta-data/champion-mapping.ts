// Champion name to card ID mapping
// This maps Riftbound champion names to their primary card IDs for RiftMana filtering

export const CHAMPION_NAME_TO_CARD_ID: Record<string, string> = {
  // Format: "Champion Name": "card-id"
  // Using base/primary versions of each champion
  "Ahri": "ogn-066",
  "Annie": "ogs-001", 
  "Azir": "sfd-050",
  "Darius": "ogn-027",
  "Draven": "ogn-028",
  "Ezreal": "sfd-082",
  "Fiora": "ogn-232",
  "Garen": "ogs-007",
  "Irelia": "sfd-057",
  "Jax": "sfd-054",
  "Jinx": "ogn-030",
  "Kai'Sa": "ogn-039",
  "Lee Sin": "ogn-078",
  "Leona": "ogn-079",
  "Lucian": "sfd-028",
  "Lux": "ogs-006",
  "Miss Fortune": "ogn-162",
  "Ornn": "sfd-058",
  "Rek'Sai": "sfd-029",
  "Renata Glasc": "sfd-088",
  "Rumble": "sfd-026",
  "Sett": "ogn-164",
  "Sivir": "sfd-120",
  "Teemo": "ogn-197",
  "Viktor": "ogn-117",
  "Volibear": "ogn-041",
  "Yasuo": "ogn-076",
  "Master Yi": "ogn-247", // Using Kai'Sa's ID as placeholder - need to verify
};

/**
 * Get champion card ID for RiftMana filtering
 * Handles case-insensitive matching and common variations
 */
export function getChampionCardId(championName: string): string | undefined {
  const normalized = championName.toLowerCase().trim();
  
  // Direct match
  const directMatch = Object.entries(CHAMPION_NAME_TO_CARD_ID)
    .find(([name]) => name.toLowerCase() === normalized);
  
  if (directMatch) {
    return directMatch[1];
  }
  
  // Partial match (for names like "Kai'Sa" vs "Kaisa")
  const partialMatch = Object.entries(CHAMPION_NAME_TO_CARD_ID)
    .find(([name]) => {
      const cleanName = name.toLowerCase().replace(/['\s-]/g, '');
      const cleanSearch = normalized.replace(/['\s-]/g, '');
      return cleanName === cleanSearch;
    });
  
  return partialMatch?.[1];
}

// Made with Bob
