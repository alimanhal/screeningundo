export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          user_id: string;
        };
        Insert: {
          user_id: string;
        };
        Update: {
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_users_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          id: number;
          match_number: number;
          stage: "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
          home_team: string | null;
          away_team: string | null;
          kickoff_utc: string;
          stadium: string;
          city: string;
        };
        Insert: {
          id?: number;
          match_number: number;
          stage: "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
          home_team?: string | null;
          away_team?: string | null;
          kickoff_utc: string;
          stadium: string;
          city: string;
        };
        Update: {
          id?: number;
          match_number?: number;
          stage?: "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
          home_team?: string | null;
          away_team?: string | null;
          kickoff_utc?: string;
          stadium?: string;
          city?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_away_team_fkey";
            columns: ["away_team"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "matches_home_team_fkey";
            columns: ["home_team"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["code"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          favorite_team: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          favorite_team?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          favorite_team?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_favorite_team_fkey";
            columns: ["favorite_team"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          venue_id: string;
          user_id: string;
          reason: "outdated" | "wrong_info" | "closed" | "inappropriate" | "other";
          details: string;
          status: "open" | "resolved";
          created_at: string;
        };
        Insert: {
          id: string;
          venue_id: string;
          user_id: string;
          reason: "outdated" | "wrong_info" | "closed" | "inappropriate" | "other";
          details?: string;
          status?: "open" | "resolved";
          created_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
          user_id?: string;
          reason?: "outdated" | "wrong_info" | "closed" | "inappropriate" | "other";
          details?: string;
          status?: "open" | "resolved";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          code: string;
          name: string;
          group_letter: string;
          flag_emoji: string;
        };
        Insert: {
          code: string;
          name: string;
          group_letter: string;
          flag_emoji: string;
        };
        Update: {
          code?: string;
          name?: string;
          group_letter?: string;
          flag_emoji?: string;
        };
        Relationships: [];
      };
      venue_matches: {
        Row: {
          venue_id: string;
          match_id: number;
        };
        Insert: {
          venue_id: string;
          match_id: number;
        };
        Update: {
          venue_id?: string;
          match_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "venue_matches_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "venue_matches_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      venues: {
        Row: {
          id: string;
          name: string;
          description: string;
          address: string;
          city: string;
          country: string;
          lat: number;
          lng: number;
          venue_type: "fan_zone" | "pub_bar" | "restaurant" | "public_square" | "other";
          capacity_estimate: number | null;
          is_free_entry: boolean;
          indoor_outdoor: "indoor" | "outdoor" | "both";
          big_screen: boolean;
          food_available: boolean;
          family_friendly: boolean;
          screens_all_matches: boolean;
          photo_url: string | null;
          status: "pending" | "approved" | "rejected";
          approved_by: string | null;
          approved_at: string | null;
          rejected_by: string | null;
          rejected_at: string | null;
          rejection_note: string | null;
          hidden_reason: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          address: string;
          city: string;
          country: string;
          lat: number;
          lng: number;
          venue_type: "fan_zone" | "pub_bar" | "restaurant" | "public_square" | "other";
          capacity_estimate?: number | null;
          is_free_entry?: boolean;
          indoor_outdoor: "indoor" | "outdoor" | "both";
          big_screen?: boolean;
          food_available?: boolean;
          family_friendly?: boolean;
          screens_all_matches?: boolean;
          photo_url?: string | null;
          status?: "pending" | "approved" | "rejected";
          approved_by?: string | null;
          approved_at?: string | null;
          rejected_by?: string | null;
          rejected_at?: string | null;
          rejection_note?: string | null;
          hidden_reason?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          address?: string;
          city?: string;
          country?: string;
          lat?: number;
          lng?: number;
          venue_type?: "fan_zone" | "pub_bar" | "restaurant" | "public_square" | "other";
          capacity_estimate?: number | null;
          is_free_entry?: boolean;
          indoor_outdoor?: "indoor" | "outdoor" | "both";
          big_screen?: boolean;
          food_available?: boolean;
          family_friendly?: boolean;
          screens_all_matches?: boolean;
          photo_url?: string | null;
          status?: "pending" | "approved" | "rejected";
          approved_by?: string | null;
          approved_at?: string | null;
          rejected_by?: string | null;
          rejected_at?: string | null;
          rejection_note?: string | null;
          hidden_reason?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "venues_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          venue_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          venue_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          venue_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
