export type Card = {
  id: string;
  name: string;
  set_code: string;
  collector_number: string;
  image_url: string | null;
  rarity: string | null;
  metadata: Record<string, any> | null;
  sort_key: string | null;
  public_code: string | null;
  riftbound_id: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  display_name: string;
  contact_info: string;
  trading_locations: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileHaveCard = {
  id: string;
  profile_id: string;
  card_id: string;
  quantity: number;
  created_at: string;
};

export type ProfileWantCard = {
  id: string;
  profile_id: string;
  card_id: string;
  quantity: number;
  created_at: string;
};

export type ProfileWithCards = Profile & {
  have_cards: (Card & { profile_have_card_id: string })[];
  want_cards: (Card & { profile_want_card_id: string })[];
};

