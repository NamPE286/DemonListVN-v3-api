export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_key: {
        Row: {
          created_at: string
          key: string
          uid: string
        }
        Insert: {
          created_at?: string
          key?: string
          uid: string
        }
        Update: {
          created_at?: string
          key?: string
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_api_key_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battle_pass_level_progress: {
        Row: {
          battle_pass_level_id: number
          completion_claimed: boolean
          created_at: string
          min_progress_claimed: boolean
          progress: number
          user_id: string
        }
        Insert: {
          battle_pass_level_id: number
          completion_claimed?: boolean
          created_at?: string
          min_progress_claimed?: boolean
          progress?: number
          user_id: string
        }
        Update: {
          battle_pass_level_id?: number
          completion_claimed?: boolean
          created_at?: string
          min_progress_claimed?: boolean
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_level_progress_battle_pass_level_id_fkey"
            columns: ["battle_pass_level_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_level_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battle_pass_levels: {
        Row: {
          created_at: string
          id: number
          level_id: number
          min_progress: number
          min_progress_xp: number
          season_id: number
          type: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: number
          level_id: number
          min_progress?: number
          min_progress_xp?: number
          season_id: number
          type?: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: number
          level_id?: number
          min_progress?: number
          min_progress_xp?: number
          season_id?: number
          type?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_levels_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_levels_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_pass_map_pack_level_progress: {
        Row: {
          battle_pass_map_pack_id: number
          created_at: string
          level_id: number
          progress: number
          user_id: string
        }
        Insert: {
          battle_pass_map_pack_id: number
          created_at?: string
          level_id: number
          progress?: number
          user_id: string
        }
        Update: {
          battle_pass_map_pack_id?: number
          created_at?: string
          level_id?: number
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_map_pack_level_progress_battle_pass_map_pack_id_fke"
            columns: ["battle_pass_map_pack_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_map_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_map_pack_level_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battle_pass_map_pack_progress: {
        Row: {
          battle_pass_map_pack_id: number
          claimed: boolean
          created_at: string
          progress: number
          user_id: string
        }
        Insert: {
          battle_pass_map_pack_id: number
          claimed?: boolean
          created_at?: string
          progress?: number
          user_id: string
        }
        Update: {
          battle_pass_map_pack_id?: number
          claimed?: boolean
          created_at?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_map_pack_progress_battle_pass_map_pack_id_fkey"
            columns: ["battle_pass_map_pack_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_map_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_map_pack_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battle_pass_map_packs: {
        Row: {
          created_at: string
          id: number
          map_pack_id: number
          order: number
          season_id: number
          unlock_week: number
        }
        Insert: {
          created_at?: string
          id?: number
          map_pack_id: number
          order?: number
          season_id: number
          unlock_week: number
        }
        Update: {
          created_at?: string
          id?: number
          map_pack_id?: number
          order?: number
          season_id?: number
          unlock_week?: number
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_map_packs_map_pack_id_fkey"
            columns: ["map_pack_id"]
            isOneToOne: false
            referencedRelation: "map_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_map_packs_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_pass_mission_claims: {
        Row: {
          created_at: string
          mission_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          mission_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          mission_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_mission_claims_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_mission_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battle_pass_mission_progress: {
        Row: {
          completed: boolean
          created_at: string
          mission_id: number
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          mission_id: number
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          mission_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_mission_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battle_pass_mission_rewards: {
        Row: {
          created_at: string
          expire_after: number | null
          id: number
          item_id: number
          mission_id: number
          quantity: number
        }
        Insert: {
          created_at?: string
          expire_after?: number | null
          id?: number
          item_id: number
          mission_id: number
          quantity?: number
        }
        Update: {
          created_at?: string
          expire_after?: number | null
          id?: number
          item_id?: number
          mission_id?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_mission_rewards_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_mission_rewards_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_pass_missions: {
        Row: {
          condition: Json
          created_at: string
          description: string | null
          id: number
          order: number
          refresh_type: string
          season_id: number
          title: string
          xp: number
        }
        Insert: {
          condition: Json
          created_at?: string
          description?: string | null
          id?: number
          order?: number
          refresh_type?: string
          season_id: number
          title: string
          xp: number
        }
        Update: {
          condition?: Json
          created_at?: string
          description?: string | null
          id?: number
          order?: number
          refresh_type?: string
          season_id?: number
          title?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_missions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_pass_progress: {
        Row: {
          created_at: string
          season_id: number
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          season_id: number
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          season_id?: number
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_progress_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battle_pass_reward_claims: {
        Row: {
          created_at: string
          reward_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          reward_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          reward_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_reward_claims_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_tier_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_reward_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battle_pass_seasons: {
        Row: {
          created_at: string
          description: string | null
          end: string
          id: number
          is_archived: boolean
          primary_color: string | null
          start: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end: string
          id?: number
          is_archived?: boolean
          primary_color?: string | null
          start: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end?: string
          id?: number
          is_archived?: boolean
          primary_color?: string | null
          start?: string
          title?: string
        }
        Relationships: []
      }
      battle_pass_tier_rewards: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_premium: boolean
          item_id: number
          quantity: number
          season_id: number
          tier: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_premium?: boolean
          item_id: number
          quantity?: number
          season_id: number
          tier: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_premium?: boolean
          item_id?: number
          quantity?: number
          season_id?: number
          tier?: number
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_tier_rewards_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_tier_rewards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_pass_xp_logs: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: number
          ref_id: number | null
          season_id: number
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: number
          ref_id?: number | null
          season_id: number
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: number
          ref_id?: number | null
          season_id?: number
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_xp_logs_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "battle_pass_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_pass_xp_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      cards: {
        Row: {
          activation_date: string | null
          content: string
          created_at: string
          id: string
          img: string
          name: string
          owner: string | null
          supporter_included: number
        }
        Insert: {
          activation_date?: string | null
          content?: string
          created_at?: string
          id?: string
          img?: string
          name?: string
          owner?: string | null
          supporter_included?: number
        }
        Update: {
          activation_date?: string | null
          content?: string
          created_at?: string
          id?: string
          img?: string
          name?: string
          owner?: string | null
          supporter_included?: number
        }
        Relationships: [
          {
            foreignKeyName: "cards_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      case_items: {
        Row: {
          case_id: number
          created_at: string
          expire_after: number | null
          id: number
          item_id: number
          rate: number | null
        }
        Insert: {
          case_id: number
          created_at?: string
          expire_after?: number | null
          id?: number
          item_id: number
          rate?: number | null
        }
        Update: {
          case_id?: number
          created_at?: string
          expire_after?: number | null
          id?: number
          item_id?: number
          rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "case_items_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      case_result: {
        Row: {
          case_id: number
          created_at: string
          id: number
          opener_id: string
          result_id: number | null
        }
        Insert: {
          case_id: number
          created_at?: string
          id?: number
          opener_id: string
          result_id?: number | null
        }
        Update: {
          case_id?: number
          created_at?: string
          id?: number
          opener_id?: string
          result_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "case_result_case_id_fkey1"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_result_opener_id_fkey"
            columns: ["opener_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "case_result_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "case_items"
            referencedColumns: ["id"]
          },
        ]
      }
      changelogs: {
        Row: {
          created_at: string
          id: number
          level_id: number
          new: Json
          old: Json | null
          published: boolean | null
        }
        Insert: {
          created_at?: string
          id?: number
          level_id: number
          new: Json
          old?: Json | null
          published?: boolean | null
        }
        Update: {
          created_at?: string
          id?: number
          level_id?: number
          new?: Json
          old?: Json | null
          published?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "changelogs_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_ban: {
        Row: {
          clan: number
          created_at: string
          userid: string
        }
        Insert: {
          clan: number
          created_at?: string
          userid: string
        }
        Update: {
          clan?: number
          created_at?: string
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_ban_clan_fkey"
            columns: ["clan"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_ban_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      clan_invitations: {
        Row: {
          clan: number
          created_at: string
          id: number
          to: string
        }
        Insert: {
          clan: number
          created_at?: string
          id?: number
          to: string
        }
        Update: {
          clan?: number
          created_at?: string
          id?: number
          to?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_invitations_clan_fkey"
            columns: ["clan"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_invitations_to_fkey"
            columns: ["to"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      clans: {
        Row: {
          boosted_until: string
          created_at: string
          home_content: string | null
          id: number
          image_version: number
          is_public: boolean
          member_count: number
          member_limit: number
          mode: string
          name: string
          owner: string
          rank: number | null
          rating: number
          tag: string
          tag_bg_color: string | null
          tag_text_color: string | null
        }
        Insert: {
          boosted_until?: string
          created_at?: string
          home_content?: string | null
          id?: number
          image_version?: number
          is_public?: boolean
          member_count?: number
          member_limit?: number
          mode?: string
          name: string
          owner?: string
          rank?: number | null
          rating?: number
          tag: string
          tag_bg_color?: string | null
          tag_text_color?: string | null
        }
        Update: {
          boosted_until?: string
          created_at?: string
          home_content?: string | null
          id?: number
          image_version?: number
          is_public?: boolean
          member_count?: number
          member_limit?: number
          mode?: string
          name?: string
          owner?: string
          rank?: number | null
          rating?: number
          tag?: string
          tag_bg_color?: string | null
          tag_text_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clans_owner_fkey"
            columns: ["owner"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      community_comments: {
        Row: {
          attached_level: Json | null
          content: string
          created_at: string
          hidden: boolean
          id: number
          likes_count: number
          post_id: number
          uid: string
        }
        Insert: {
          attached_level?: Json | null
          content: string
          created_at?: string
          hidden?: boolean
          id?: number
          likes_count?: number
          post_id: number
          uid: string
        }
        Update: {
          attached_level?: Json | null
          content?: string
          created_at?: string
          hidden?: boolean
          id?: number
          likes_count?: number
          post_id?: number
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      community_comments_admin: {
        Row: {
          comment_id: number
          hidden: boolean
          moderation_result: Json | null
          moderation_status: string
        }
        Insert: {
          comment_id: number
          hidden?: boolean
          moderation_result?: Json | null
          moderation_status?: string
        }
        Update: {
          comment_id?: number
          hidden?: boolean
          moderation_result?: Json | null
          moderation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_admin_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: true
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          comment_id: number | null
          created_at: string
          id: number
          post_id: number | null
          uid: string
        }
        Insert: {
          comment_id?: number | null
          created_at?: string
          id?: number
          post_id?: number | null
          uid: string
        }
        Update: {
          comment_id?: number | null
          created_at?: string
          id?: number
          post_id?: number | null
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_likes_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      community_post_views: {
        Row: {
          created_at: string
          id: number
          last_viewed_at: string
          post_id: number
          uid: string
          view_count: number
        }
        Insert: {
          created_at?: string
          id?: number
          last_viewed_at?: string
          post_id: number
          uid: string
          view_count?: number
        }
        Update: {
          created_at?: string
          id?: number
          last_viewed_at?: string
          post_id?: number
          uid?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_views_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      community_posts: {
        Row: {
          attached_level: Json | null
          attached_record: Json | null
          comments_count: number
          content: string
          created_at: string
          fts: unknown
          id: number
          image_url: string | null
          is_recommended: boolean | null
          likes_count: number
          pinned: boolean
          title: string
          type: string
          uid: string
          updated_at: string | null
          video_url: string | null
          views_count: number
        }
        Insert: {
          attached_level?: Json | null
          attached_record?: Json | null
          comments_count?: number
          content?: string
          created_at?: string
          fts?: unknown
          id?: number
          image_url?: string | null
          is_recommended?: boolean | null
          likes_count?: number
          pinned?: boolean
          title: string
          type?: string
          uid: string
          updated_at?: string | null
          video_url?: string | null
          views_count?: number
        }
        Update: {
          attached_level?: Json | null
          attached_record?: Json | null
          comments_count?: number
          content?: string
          created_at?: string
          fts?: unknown
          id?: number
          image_url?: string | null
          is_recommended?: boolean | null
          likes_count?: number
          pinned?: boolean
          title?: string
          type?: string
          uid?: string
          updated_at?: string | null
          video_url?: string | null
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      community_posts_admin: {
        Row: {
          hidden: boolean
          moderation_result: Json | null
          moderation_status: string
          post_id: number
        }
        Insert: {
          hidden?: boolean
          moderation_result?: Json | null
          moderation_status?: string
          post_id: number
        }
        Update: {
          hidden?: boolean
          moderation_result?: Json | null
          moderation_status?: string
          post_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_admin_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts_tags: {
        Row: {
          post_id: number
          tag_id: number
        }
        Insert: {
          post_id: number
          tag_id: number
        }
        Update: {
          post_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "post_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reports: {
        Row: {
          comment_id: number | null
          created_at: string
          description: string | null
          id: number
          post_id: number | null
          reason: string
          resolved: boolean
          uid: string
        }
        Insert: {
          comment_id?: number | null
          created_at?: string
          description?: string | null
          id?: number
          post_id?: number | null
          reason?: string
          resolved?: boolean
          uid: string
        }
        Update: {
          comment_id?: number | null
          created_at?: string
          description?: string | null
          id?: number
          post_id?: number | null
          reason?: string
          resolved?: boolean
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          deduct: number
          owner: string | null
          percent: number
          product_id: number | null
          quantity: number
          usage_left: number
          valid_until: string
        }
        Insert: {
          code?: string
          created_at?: string
          deduct?: number
          owner?: string | null
          percent?: number
          product_id?: number | null
          quantity?: number
          usage_left?: number
          valid_until: string
        }
        Update: {
          code?: string
          created_at?: string
          deduct?: number
          owner?: string | null
          percent?: number
          product_id?: number | null
          quantity?: number
          usage_left?: number
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "coupons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      death_count: {
        Row: {
          completed_time: string | null
          count: number[]
          level_id: number
          tag: string
          uid: string
        }
        Insert: {
          completed_time?: string | null
          count: number[]
          level_id?: number
          tag?: string
          uid: string
        }
        Update: {
          completed_time?: string | null
          count?: number[]
          level_id?: number
          tag?: string
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_death_count_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      event_level_unlock_conditions: {
        Row: {
          created_at: string
          event_level_id: number | null
          id: number
          require_event_level_id: number | null
        }
        Insert: {
          created_at?: string
          event_level_id?: number | null
          id?: number
          require_event_level_id?: number | null
        }
        Update: {
          created_at?: string
          event_level_id?: number | null
          id?: number
          require_event_level_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_level_unlock_conditions_event_level_id_fkey"
            columns: ["event_level_id"]
            isOneToOne: false
            referencedRelation: "event_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_level_unlock_conditions_require_event_level_id_fkey"
            columns: ["require_event_level_id"]
            isOneToOne: false
            referencedRelation: "event_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      event_levels: {
        Row: {
          event_id: number
          id: number
          level_id: number
          min_event_progress: number
          need_raw: boolean
          point: number
          required_level: number | null
          total_progress: number
          unlock_condition: Json | null
        }
        Insert: {
          event_id: number
          id?: number
          level_id: number
          min_event_progress?: number
          need_raw?: boolean
          point: number
          required_level?: number | null
          total_progress?: number
          unlock_condition?: Json | null
        }
        Update: {
          event_id?: number
          id?: number
          level_id?: number
          min_event_progress?: number
          need_raw?: boolean
          point?: number
          required_level?: number | null
          total_progress?: number
          unlock_condition?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "event_levels_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_levels_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      event_proofs: {
        Row: {
          accepted: boolean
          content: string
          created_at: string
          data: Json | null
          diff: number | null
          event_id: number
          userid: string
        }
        Insert: {
          accepted?: boolean
          content?: string
          created_at?: string
          data?: Json | null
          diff?: number | null
          event_id: number
          userid: string
        }
        Update: {
          accepted?: boolean
          content?: string
          created_at?: string
          data?: Json | null
          diff?: number | null
          event_id?: number
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_proofs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_proofs_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      event_quest_claims: {
        Row: {
          created_at: string
          quest_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          quest_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          quest_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_quest_claims_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "event_quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_quest_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      event_quest_rewards: {
        Row: {
          created_at: string
          expire_after: number | null
          id: number
          quest_id: number | null
          reward_id: number | null
        }
        Insert: {
          created_at?: string
          expire_after?: number | null
          id?: number
          quest_id?: number | null
          reward_id?: number | null
        }
        Update: {
          created_at?: string
          expire_after?: number | null
          id?: number
          quest_id?: number | null
          reward_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_quest_rewards_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "event_quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_quest_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      event_quests: {
        Row: {
          condition: Json
          created_at: string
          event_id: number
          id: number
          title: string | null
        }
        Insert: {
          condition: Json
          created_at?: string
          event_id: number
          id?: number
          title?: string | null
        }
        Update: {
          condition?: Json
          created_at?: string
          event_id?: number
          id?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_quests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_records: {
        Row: {
          accepted: boolean | null
          created_at: string
          level_id: number
          progress: number
          raw: string | null
          reject_reason: string | null
          user_id: string
          video_link: string
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string
          level_id: number
          progress: number
          raw?: string | null
          reject_reason?: string | null
          user_id: string
          video_link: string
        }
        Update: {
          accepted?: boolean | null
          created_at?: string
          level_id?: number
          progress?: number
          raw?: string | null
          reject_reason?: string | null
          user_id?: string
          video_link?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_records_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "event_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualifier_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      events: {
        Row: {
          content: string | null
          created_at: string
          data: Json | null
          description: string
          end: string | null
          exp: number | null
          freeze: string | null
          hidden: boolean
          id: number
          img_url: string | null
          is_calculated: boolean
          is_contest: boolean
          is_external: boolean
          is_ranked: boolean
          is_supporter_only: boolean
          min_exp: number
          need_proof: boolean
          priority: number
          redirect: string | null
          start: string
          title: string
          type: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          data?: Json | null
          description: string
          end?: string | null
          exp?: number | null
          freeze?: string | null
          hidden?: boolean
          id?: number
          img_url?: string | null
          is_calculated?: boolean
          is_contest?: boolean
          is_external?: boolean
          is_ranked?: boolean
          is_supporter_only?: boolean
          min_exp?: number
          need_proof?: boolean
          priority?: number
          redirect?: string | null
          start?: string
          title: string
          type?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          data?: Json | null
          description?: string
          end?: string | null
          exp?: number | null
          freeze?: string | null
          hidden?: boolean
          id?: number
          img_url?: string | null
          is_calculated?: boolean
          is_contest?: boolean
          is_external?: boolean
          is_ranked?: boolean
          is_supporter_only?: boolean
          min_exp?: number
          need_proof?: boolean
          priority?: number
          redirect?: string | null
          start?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      heatmap: {
        Row: {
          days: number[]
          uid: string
          year: number
        }
        Insert: {
          days: number[]
          uid: string
          year: number
        }
        Update: {
          days?: number[]
          uid?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_attempts_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      inventory: {
        Row: {
          consumed: boolean
          content: string | null
          created_at: string
          expire_at: string | null
          id: number
          item_id: number
          quantity: number
          redirect_to: string | null
          user_id: string
        }
        Insert: {
          consumed?: boolean
          content?: string | null
          created_at?: string
          expire_at?: string | null
          id?: number
          item_id: number
          quantity?: number
          redirect_to?: string | null
          user_id: string
        }
        Update: {
          consumed?: boolean
          content?: string | null
          created_at?: string
          expire_at?: string | null
          id?: number
          item_id?: number
          quantity?: number
          redirect_to?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_medal_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      item_transactions: {
        Row: {
          created_at: string
          data: Json | null
          diff: number
          id: number
          inventory_item_id: number
        }
        Insert: {
          created_at?: string
          data?: Json | null
          diff: number
          id?: number
          inventory_item_id: number
        }
        Update: {
          created_at?: string
          data?: Json | null
          diff?: number
          id?: number
          inventory_item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "stackable_item_transactions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          default_expire_after: number | null
          description: string | null
          id: number
          name: string
          product_id: number | null
          quantity: number
          rarity: number
          redirect: string | null
          stackable: boolean
          type: string
        }
        Insert: {
          default_expire_after?: number | null
          description?: string | null
          id?: number
          name?: string
          product_id?: number | null
          quantity?: number
          rarity?: number
          redirect?: string | null
          stackable?: boolean
          type?: string
        }
        Update: {
          default_expire_after?: number | null
          description?: string | null
          id?: number
          name?: string
          product_id?: number | null
          quantity?: number
          rarity?: number
          redirect?: string | null
          stackable?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      level_death_count: {
        Row: {
          count: number[]
          level_id: number
        }
        Insert: {
          count: number[]
          level_id?: number
        }
        Update: {
          count?: number[]
          level_id?: number
        }
        Relationships: []
      }
      level_gd_states: {
        Row: {
          is_daily: boolean | null
          is_weekly: boolean | null
          level_id: number
        }
        Insert: {
          is_daily?: boolean | null
          is_weekly?: boolean | null
          level_id: number
        }
        Update: {
          is_daily?: boolean | null
          is_weekly?: boolean | null
          level_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "level_gd_states_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: true
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      level_submissions: {
        Row: {
          accepted: boolean
          comment: string | null
          created_at: string
          level_id: number
          user_id: string
        }
        Insert: {
          accepted?: boolean
          comment?: string | null
          created_at?: string
          level_id: number
          user_id: string
        }
        Update: {
          accepted?: boolean
          comment?: string | null
          created_at?: string
          level_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_submissions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      level_tags: {
        Row: {
          color: string
          created_at: string
          id: number
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      levels: {
        Row: {
          accepted: boolean
          created_at: string
          creator: string | null
          creator_id: string | null
          difficulty: string | null
          dl_top: number | null
          fl_pt: number | null
          fl_top: number | null
          id: number
          insane_tier: number | null
          is_challenge: boolean
          is_non_list: boolean
          is_platformer: boolean
          main_level_id: number | null
          min_progress: number | null
          name: string | null
          rating: number | null
          video_id: string | null
        }
        Insert: {
          accepted?: boolean
          created_at?: string
          creator?: string | null
          creator_id?: string | null
          difficulty?: string | null
          dl_top?: number | null
          fl_pt?: number | null
          fl_top?: number | null
          id: number
          insane_tier?: number | null
          is_challenge?: boolean
          is_non_list?: boolean
          is_platformer?: boolean
          main_level_id?: number | null
          min_progress?: number | null
          name?: string | null
          rating?: number | null
          video_id?: string | null
        }
        Update: {
          accepted?: boolean
          created_at?: string
          creator?: string | null
          creator_id?: string | null
          difficulty?: string | null
          dl_top?: number | null
          fl_pt?: number | null
          fl_top?: number | null
          id?: number
          insane_tier?: number | null
          is_challenge?: boolean
          is_non_list?: boolean
          is_platformer?: boolean
          main_level_id?: number | null
          min_progress?: number | null
          name?: string | null
          rating?: number | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "levels_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "levels_main_level_id_fkey"
            columns: ["main_level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      levels_tags: {
        Row: {
          level_id: number
          tag_id: number
        }
        Insert: {
          level_id: number
          tag_id: number
        }
        Update: {
          level_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "levels_tags_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "levels_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "level_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      map_pack_levels: {
        Row: {
          created_at: string
          id: number
          level_id: number
          map_pack_id: number
          order: number
        }
        Insert: {
          created_at?: string
          id?: number
          level_id: number
          map_pack_id: number
          order?: number
        }
        Update: {
          created_at?: string
          id?: number
          level_id?: number
          map_pack_id?: number
          order?: number
        }
        Relationships: [
          {
            foreignKeyName: "map_pack_levels_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_pack_levels_map_pack_id_fkey"
            columns: ["map_pack_id"]
            isOneToOne: false
            referencedRelation: "map_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      map_packs: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string
          id: number
          name: string
          xp: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty: string
          id?: number
          name: string
          xp: number
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: number
          name?: string
          xp?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string | null
          id: number
          redirect: string | null
          status: number
          timestamp: string
          to: string
        }
        Insert: {
          content?: string | null
          id?: number
          redirect?: string | null
          status?: number
          timestamp?: string
          to: string
        }
        Update: {
          content?: string | null
          id?: number
          redirect?: string | null
          status?: number
          timestamp?: string
          to?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_to_fkey"
            columns: ["to"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: number
          order_id: number
          product_id: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: number
          order_id: number
          product_id: number
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: number
          order_id?: number
          product_id?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tracking: {
        Row: {
          content: string | null
          created_at: string
          delivering: boolean
          id: number
          link: string | null
          order_id: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          delivering?: boolean
          id?: number
          link?: string | null
          order_id: number
        }
        Update: {
          content?: string | null
          created_at?: string
          delivering?: boolean
          id?: number
          link?: string | null
          order_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_steps_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          amount: number
          coupon: string | null
          created_at: string
          currency: string
          data: Json | null
          delivered: boolean
          discount: number
          fee: number
          gift_to: string | null
          id: number
          payment_method: string
          phone: number | null
          product_id: number | null
          quantity: number | null
          recipient_name: string | null
          state: string
          target_clan_id: number | null
          user_id: string
        }
        Insert: {
          address?: string | null
          amount: number
          coupon?: string | null
          created_at?: string
          currency?: string
          data?: Json | null
          delivered?: boolean
          discount?: number
          fee?: number
          gift_to?: string | null
          id?: number
          payment_method?: string
          phone?: number | null
          product_id?: number | null
          quantity?: number | null
          recipient_name?: string | null
          state: string
          target_clan_id?: number | null
          user_id: string
        }
        Update: {
          address?: string | null
          amount?: number
          coupon?: string | null
          created_at?: string
          currency?: string
          data?: Json | null
          delivered?: boolean
          discount?: number
          fee?: number
          gift_to?: string | null
          id?: number
          payment_method?: string
          phone?: number | null
          product_id?: number | null
          quantity?: number | null
          recipient_name?: string | null
          state?: string
          target_clan_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_fkey"
            columns: ["coupon"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "orders_gift_to_fkey"
            columns: ["gift_to"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_target_clan_id_fkey"
            columns: ["target_clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      otp: {
        Row: {
          code: string
          created_at: string
          expired_at: string
          granted_by: string | null
          is_expired: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expired_at: string
          granted_by?: string | null
          is_expired?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expired_at?: string
          granted_by?: string | null
          is_expired?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "otp_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      player_convictions: {
        Row: {
          content: string
          created_at: string
          credit_reduce: number
          id: number
          is_hidden: boolean
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          credit_reduce?: number
          id?: number
          is_hidden?: boolean
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          credit_reduce?: number
          id?: number
          is_hidden?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_convictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      player_subscriptions: {
        Row: {
          created_at: string
          end: string | null
          id: number
          start: string
          subscription_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          end?: string | null
          id?: number
          start?: string
          subscription_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          end?: string | null
          id?: number
          start?: string
          subscription_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_subscriptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      players: {
        Row: {
          avatar_version: number
          banner_version: number
          bg_color: string | null
          border_color: string | null
          city: string | null
          cl_rating: number | null
          clan: number | null
          clrank: number | null
          discord: string | null
          discord_dm_channel_id: string | null
          dl_max_pt: number | null
          dlrank: number | null
          elo: number
          email: string | null
          exp: number
          extra_exp: number | null
          facebook: string | null
          fl_max_pt: number | null
          flrank: number | null
          id: number
          is_admin: boolean
          is_avatar_gif: boolean
          is_banned: boolean
          is_banner_gif: boolean
          is_hidden: boolean
          is_trusted: boolean
          match_count: number
          name: string | null
          name_locked: boolean
          overall_rank: number | null
          overview_data: Json | null
          pl_rating: number | null
          plrank: number | null
          pointercrate: string | null
          province: string | null
          rating: number | null
          record_count: number
          rename_cooldown: string
          review_cooldown: string | null
          supporter_until: string | null
          total_d_lpt: number | null
          total_f_lpt: number | null
          uid: string
          youtube: string | null
        }
        Insert: {
          avatar_version?: number
          banner_version?: number
          bg_color?: string | null
          border_color?: string | null
          city?: string | null
          cl_rating?: number | null
          clan?: number | null
          clrank?: number | null
          discord?: string | null
          discord_dm_channel_id?: string | null
          dl_max_pt?: number | null
          dlrank?: number | null
          elo?: number
          email?: string | null
          exp?: number
          extra_exp?: number | null
          facebook?: string | null
          fl_max_pt?: number | null
          flrank?: number | null
          id?: number
          is_admin?: boolean
          is_avatar_gif?: boolean
          is_banned?: boolean
          is_banner_gif?: boolean
          is_hidden?: boolean
          is_trusted?: boolean
          match_count?: number
          name?: string | null
          name_locked?: boolean
          overall_rank?: number | null
          overview_data?: Json | null
          pl_rating?: number | null
          plrank?: number | null
          pointercrate?: string | null
          province?: string | null
          rating?: number | null
          record_count?: number
          rename_cooldown?: string
          review_cooldown?: string | null
          supporter_until?: string | null
          total_d_lpt?: number | null
          total_f_lpt?: number | null
          uid?: string
          youtube?: string | null
        }
        Update: {
          avatar_version?: number
          banner_version?: number
          bg_color?: string | null
          border_color?: string | null
          city?: string | null
          cl_rating?: number | null
          clan?: number | null
          clrank?: number | null
          discord?: string | null
          discord_dm_channel_id?: string | null
          dl_max_pt?: number | null
          dlrank?: number | null
          elo?: number
          email?: string | null
          exp?: number
          extra_exp?: number | null
          facebook?: string | null
          fl_max_pt?: number | null
          flrank?: number | null
          id?: number
          is_admin?: boolean
          is_avatar_gif?: boolean
          is_banned?: boolean
          is_banner_gif?: boolean
          is_hidden?: boolean
          is_trusted?: boolean
          match_count?: number
          name?: string | null
          name_locked?: boolean
          overall_rank?: number | null
          overview_data?: Json | null
          pl_rating?: number | null
          plrank?: number | null
          pointercrate?: string | null
          province?: string | null
          rating?: number | null
          record_count?: number
          rename_cooldown?: string
          review_cooldown?: string | null
          supporter_until?: string | null
          total_d_lpt?: number | null
          total_f_lpt?: number | null
          uid?: string
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_clan_fkey"
            columns: ["clan"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      players_achievement: {
        Row: {
          achievementid: number
          id: number
          timestamp: number | null
          userid: string
        }
        Insert: {
          achievementid: number
          id?: number
          timestamp?: number | null
          userid: string
        }
        Update: {
          achievementid?: number
          id?: number
          timestamp?: number | null
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_achievement_achievementid_fkey"
            columns: ["achievementid"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_achievement_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      post_tags: {
        Row: {
          admin_only: boolean
          color: string
          created_at: string
          id: number
          name: string
        }
        Insert: {
          admin_only?: boolean
          color?: string
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          admin_only?: boolean
          color?: string
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          banner_text_color: string
          created_at: string
          description: string | null
          featured: boolean
          hidden: boolean
          id: number
          img_count: number | null
          max_quantity: number | null
          name: string
          price: number
          redirect: string | null
          stock: number | null
        }
        Insert: {
          banner_text_color?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          hidden?: boolean
          id?: number
          img_count?: number | null
          max_quantity?: number | null
          name: string
          price: number
          redirect?: string | null
          stock?: number | null
        }
        Update: {
          banner_text_color?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          hidden?: boolean
          id?: number
          img_count?: number | null
          max_quantity?: number | null
          name?: string
          price?: number
          redirect?: string | null
          stock?: number | null
        }
        Relationships: []
      }
      pvp_players: {
        Row: {
          joined_at: string | null
          player: string
          room: number
        }
        Insert: {
          joined_at?: string | null
          player: string
          room: number
        }
        Update: {
          joined_at?: string | null
          player?: string
          room?: number
        }
        Relationships: [
          {
            foreignKeyName: "pvp_players_player_fkey"
            columns: ["player"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "pvp_players_room_fkey"
            columns: ["room"]
            isOneToOne: false
            referencedRelation: "pvp_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      pvp_rooms: {
        Row: {
          average_rating: number
          created_at: string
          host: string | null
          id: number
          is_public: boolean
          name: string
          player_count: number
        }
        Insert: {
          average_rating?: number
          created_at?: string
          host?: string | null
          id?: number
          is_public?: boolean
          name: string
          player_count?: number
        }
        Update: {
          average_rating?: number
          created_at?: string
          host?: string | null
          id?: number
          is_public?: boolean
          name?: string
          player_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "pvp_room_host_fkey"
            columns: ["host"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      records: {
        Row: {
          cl_pt: number | null
          comment: string | null
          dl_pt: number | null
          fl_pt: number | null
          is_checked: boolean | null
          levelid: number
          mobile: boolean
          need_mod: boolean
          no: number | null
          pl_pt: number | null
          prioritized_by: number
          progress: number
          queue_no: number | null
          raw: string | null
          refresh_rate: number | null
          reviewer: string | null
          reviewer_comment: string | null
          suggested_rating: number | null
          timestamp: number | null
          userid: string
          variant_id: number | null
          video_link: string | null
        }
        Insert: {
          cl_pt?: number | null
          comment?: string | null
          dl_pt?: number | null
          fl_pt?: number | null
          is_checked?: boolean | null
          levelid: number
          mobile?: boolean
          need_mod?: boolean
          no?: number | null
          pl_pt?: number | null
          prioritized_by?: number
          progress?: number
          queue_no?: number | null
          raw?: string | null
          refresh_rate?: number | null
          reviewer?: string | null
          reviewer_comment?: string | null
          suggested_rating?: number | null
          timestamp?: number | null
          userid: string
          variant_id?: number | null
          video_link?: string | null
        }
        Update: {
          cl_pt?: number | null
          comment?: string | null
          dl_pt?: number | null
          fl_pt?: number | null
          is_checked?: boolean | null
          levelid?: number
          mobile?: boolean
          need_mod?: boolean
          no?: number | null
          pl_pt?: number | null
          prioritized_by?: number
          progress?: number
          queue_no?: number | null
          raw?: string | null
          refresh_rate?: number | null
          reviewer?: string | null
          reviewer_comment?: string | null
          suggested_rating?: number | null
          timestamp?: number | null
          userid?: string
          variant_id?: number | null
          video_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_records_levelid_fkey"
            columns: ["levelid"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_records_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "records_reviewer_fkey"
            columns: ["reviewer"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "records_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      rules: {
        Row: {
          content: string
          lang: string
          type: string
        }
        Insert: {
          content: string
          lang: string
          type: string
        }
        Update: {
          content?: string
          lang?: string
          type?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          price: number
          ref_id: number | null
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          price: number
          ref_id?: number | null
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          price?: number
          ref_id?: number | null
          type?: string
        }
        Relationships: []
      }
      user_social: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          name: string | null
          platform: string
          userid: string
        }
        Insert: {
          created_at?: string
          id: string
          is_visible?: boolean
          name?: string | null
          platform: string
          userid: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          name?: string | null
          platform?: string
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_social_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      wiki: {
        Row: {
          created_at: string
          description: string | null
          image: string | null
          locale: string
          modified_at: string
          path: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          image?: string | null
          locale?: string
          modified_at?: string
          path: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          image?: string | null
          locale?: string
          modified_at?: string
          path?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      wikiTree: {
        Row: {
          count: number | null
          created_at: string | null
          level: number | null
          parent: string | null
          path: string | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_event_levels_progress: { Args: { updates: Json }; Returns: undefined }
      get_event_leaderboard: {
        Args: { event_id: number }
        Returns: {
          elo: number
          matchCount: number
          penalty: number
          point: number
          userID: string
        }[]
      }
      get_queue_no: {
        Args: { levelid: number; p: number; userid: string }
        Returns: number
      }
      get_random_levels: {
        Args: { filter_type: string; row_count: number }
        Returns: {
          accepted: boolean
          created_at: string
          creator: string | null
          creator_id: string | null
          difficulty: string | null
          dl_top: number | null
          fl_pt: number | null
          fl_top: number | null
          id: number
          insane_tier: number | null
          is_challenge: boolean
          is_non_list: boolean
          is_platformer: boolean
          main_level_id: number | null
          min_progress: number | null
          name: string | null
          rating: number | null
          video_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "levels"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_recommended_community_posts: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_type?: string
          p_user_id?: string
        }
        Returns: {
          attached_level: Json
          attached_record: Json
          comments_count: number
          content: string
          created_at: string
          hidden: boolean
          id: number
          image_url: string
          is_recommended: boolean
          likes_count: number
          pinned: boolean
          recommendation_score: number
          title: string
          type: string
          uid: string
          updated_at: string
          video_url: string
          views_count: number
        }[]
      }
      get_top_buyers: {
        Args: { interval_ms: number; limit_count: number; offset_count: number }
        Returns: {
          totalAmount: number
          uid: string
        }[]
      }
      record_community_post_view: {
        Args: { p_post_id: number; p_user_id: string }
        Returns: undefined
      }
      update_list: { Args: never; Returns: undefined }
      update_rank: { Args: never; Returns: undefined }
      update_supporter_until: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

