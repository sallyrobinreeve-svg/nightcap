export type TimelineStepType = "pres" | "club" | "bar" | "afters" | "other";

export type Visibility = "private" | "friends" | "public";

export type EntryPrompts = Record<string, string | number | boolean | undefined>;

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string;
  user_id: string;
  date_of_night: string;
  rating: number | null;
  prompts: EntryPrompts;
  video_url: string | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  timeline_steps?: TimelineStep[];
  photos?: Photo[];
}

export interface TimelineStep {
  id: string;
  entry_id: string;
  type: TimelineStepType;
  emoji: string | null;
  location_name: string | null;
  time_at: string | null;
  notes: string | null;
  photo_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface Photo {
  id: string;
  entry_id: string;
  type: "outfit" | "favourite" | "step";
  url: string;
  timeline_step_id: string | null;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export interface Comment {
  id: string;
  entry_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export type ReactionType = "fire" | "heart" | "laugh" | "wild";

export interface Reaction {
  id: string;
  entry_id: string;
  user_id: string;
  type: ReactionType;
  created_at: string;
}

export interface EntryTag {
  id: string;
  entry_id: string;
  user_id: string;
  created_at: string;
  profile?: Profile;
}

export interface UserStats {
  user_id: string;
  total_entries: number;
  avg_rating: number | null;
  total_rated_entries: number;
  kiss_count: number;
  missions_completed: number;
  top_club_name: string | null;
  top_club_visits: number;
  updated_at: string;
}
