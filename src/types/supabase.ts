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
      APIKey: {
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
            foreignKeyName: "public_APIKey_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battlePassLevelProgress: {
        Row: {
          battlePassLevelId: number
          completionClaimed: boolean
          created_at: string
          minProgressClaimed: boolean
          progress: number
          userID: string
        }
        Insert: {
          battlePassLevelId: number
          completionClaimed?: boolean
          created_at?: string
          minProgressClaimed?: boolean
          progress?: number
          userID: string
        }
        Update: {
          battlePassLevelId?: number
          completionClaimed?: boolean
          created_at?: string
          minProgressClaimed?: boolean
          progress?: number
          userID?: string
        }
        Relationships: [
          {
            foreignKeyName: "battlePassLevelProgress_battlePassLevelId_fkey"
            columns: ["battlePassLevelId"]
            isOneToOne: false
            referencedRelation: "battlePassLevels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battlePassLevelProgress_userID_fkey"
            columns: ["userID"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battlePassLevels: {
        Row: {
          created_at: string
          id: number
          levelID: number
          minProgress: number
          minProgressXp: number
          seasonId: number
          type: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: number
          levelID: number
          minProgress?: number
          minProgressXp?: number
          seasonId: number
          type?: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: number
          levelID?: number
          minProgress?: number
          minProgressXp?: number
          seasonId?: number
          type?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "battlePassLevels_levelID_fkey"
            columns: ["levelID"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battlePassLevels_seasonId_fkey"
            columns: ["seasonId"]
            isOneToOne: false
            referencedRelation: "battlePassSeasons"
            referencedColumns: ["id"]
          },
        ]
      }
      battlePassMapPackLevelProgress: {
        Row: {
          battlePassMapPackId: number
          created_at: string
          levelID: number
          progress: number
          userID: string
        }
        Insert: {
          battlePassMapPackId: number
          created_at?: string
          levelID: number
          progress?: number
          userID: string
        }
        Update: {
          battlePassMapPackId?: number
          created_at?: string
          levelID?: number
          progress?: number
          userID?: string
        }
        Relationships: [
          {
            foreignKeyName: "battlePassMapPackLevelProgress_battlePassMapPackId_fkey"
            columns: ["battlePassMapPackId"]
            isOneToOne: false
            referencedRelation: "battlePassMapPacks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battlePassMapPackLevelProgress_userID_fkey"
            columns: ["userID"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battlePassMapPackProgress: {
        Row: {
          battlePassMapPackId: number
          claimed: boolean
          created_at: string
          progress: number
          userID: string
        }
        Insert: {
          battlePassMapPackId: number
          claimed?: boolean
          created_at?: string
          progress?: number
          userID: string
        }
        Update: {
          battlePassMapPackId?: number
          claimed?: boolean
          created_at?: string
          progress?: number
          userID?: string
        }
        Relationships: [
          {
            foreignKeyName: "battlePassMapPackProgress_battlePassMapPackId_fkey"
            columns: ["battlePassMapPackId"]
            isOneToOne: false
            referencedRelation: "battlePassMapPacks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battlePassMapPackProgress_userID_fkey"
            columns: ["userID"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battlePassMapPacks: {
        Row: {
          created_at: string
          id: number
          mapPackId: number
          order: number
          seasonId: number
          unlockWeek: number
        }
        Insert: {
          created_at?: string
          id?: number
          mapPackId: number
          order?: number
          seasonId: number
          unlockWeek: number
        }
        Update: {
          created_at?: string
          id?: number
          mapPackId?: number
          order?: number
          seasonId?: number
          unlockWeek?: number
        }
        Relationships: [
          {
            foreignKeyName: "battlePassMapPacks_mapPackId_fkey"
            columns: ["mapPackId"]
            isOneToOne: false
            referencedRelation: "mapPacks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battlePassMapPacks_seasonId_fkey"
            columns: ["seasonId"]
            isOneToOne: false
            referencedRelation: "battlePassSeasons"
            referencedColumns: ["id"]
          },
        ]
      }
      battlePassMissionClaims: {
        Row: {
          created_at: string
          missionId: number
          userID: string
        }
        Insert: {
          created_at?: string
          missionId: number
          userID: string
        }
        Update: {
          created_at?: string
          missionId?: number
          userID?: string
        }
        Relationships: [
          {
            foreignKeyName: "battlePassMissionClaims_missionId_fkey"
            columns: ["missionId"]
            isOneToOne: false
            referencedRelation: "battlePassMissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battlePassMissionClaims_userID_fkey"
            columns: ["userID"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battlePassMissionProgress: {
        Row: {
          completed: boolean
          created_at: string
          missionId: number
          userID: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          missionId: number
          userID: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          missionId?: number
          userID?: string
        }
        Relationships: [
          {
            foreignKeyName: "battlePassMissionProgress_missionId_fkey"
            columns: ["missionId"]
            isOneToOne: false
            referencedRelation: "battlePassMissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battlePassMissionProgress_userID_fkey"
            columns: ["userID"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battlePassMissionRewards: {
        Row: {
          created_at: string
          expireAfter: number | null
          id: number
          itemId: number
          missionId: number
          quantity: number
        }
        Insert: {
          created_at?: string
          expireAfter?: number | null
          id?: number
          itemId: number
          missionId: number
          quantity?: number
        }
        Update: {
          created_at?: string
          expireAfter?: number | null
          id?: number
          itemId?: number
          missionId?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "battlePassMissionRewards_itemId_fkey"
            columns: ["itemId"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battlePassMissionRewards_missionId_fkey"
            columns: ["missionId"]
            isOneToOne: false
            referencedRelation: "battlePassMissions"
            referencedColumns: ["id"]
          },
        ]
      }
      battlePassMissions: {
        Row: {
          condition: Json
          created_at: string
          description: string | null
          id: number
          order: number
          refreshType: string
          seasonId: number
          title: string
          xp: number
        }
        Insert: {
          condition: Json
          created_at?: string
          description?: string | null
          id?: number
          order?: number
          refreshType?: string
          seasonId: number
          title: string
          xp: number
        }
        Update: {
          condition?: Json
          created_at?: string
          description?: string | null
          id?: number
          order?: number
          refreshType?: string
          seasonId?: number
          title?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "battlePassMissions_seasonId_fkey"
            columns: ["seasonId"]
            isOneToOne: false
            referencedRelation: "battlePassSeasons"
            referencedColumns: ["id"]
          },
        ]
      }
      battlePassProgress: {
        Row: {
          created_at: string
          seasonId: number
          userID: string
          xp: number
        }
        Insert: {
          created_at?: string
          seasonId: number
          userID: string
          xp?: number
        }
        Update: {
          created_at?: string
          seasonId?: number
          userID?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "battlePassProgress_seasonId_fkey"
            columns: ["seasonId"]
            isOneToOne: false
            referencedRelation: "battlePassSeasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battlePassProgress_userID_fkey"
            columns: ["userID"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battlePassRewardClaims: {
        Row: {
          created_at: string
          rewardId: number
          userID: string
        }
        Insert: {
          created_at?: string
          rewardId: number
          userID: string
        }
        Update: {
          created_at?: string
          rewardId?: number
          userID?: string
        }
        Relationships: [
          {
            foreignKeyName: "battlePassRewardClaims_rewardId_fkey"
            columns: ["rewardId"]
            isOneToOne: false
            referencedRelation: "battlePassTierRewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battlePassRewardClaims_userID_fkey"
            columns: ["userID"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      battlePassSeasons: {
        Row: {
          created_at: string
          description: string | null
          end: string
          id: number
          isArchived: boolean
          primaryColor: string | null
          start: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end: string
          id?: number
          isArchived?: boolean
          primaryColor?: string | null
          start: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end?: string
          id?: number
          isArchived?: boolean
          primaryColor?: string | null
          start?: string
          title?: string
        }
        Relationships: []
      }
      battlePassTierRewards: {
        Row: {
          created_at: string
          description: string | null
          id: number
          isPremium: boolean
          itemId: number
          quantity: number
          seasonId: number
          tier: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          isPremium?: boolean
          itemId: number
          quantity?: number
          seasonId: number
          tier: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          isPremium?: boolean
          itemId?: number
          quantity?: number
          seasonId?: number
          tier?: number
        }
        Relationships: [
          {
            foreignKeyName: "battlePassTierRewards_itemId_fkey"
            columns: ["itemId"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battlePassTierRewards_seasonId_fkey"
            columns: ["seasonId"]
            isOneToOne: false
            referencedRelation: "battlePassSeasons"
            referencedColumns: ["id"]
          },
        ]
      }
      battlePassXPLogs: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: number
          refId: number | null
          seasonId: number
          source: string
          userID: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: number
          refId?: number | null
          seasonId: number
          source: string
          userID: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: number
          refId?: number | null
          seasonId?: number
          source?: string
          userID?: string
        }
        Relationships: [
          {
            foreignKeyName: "battlePassXPLogs_seasonId_fkey"
            columns: ["seasonId"]
            isOneToOne: false
            referencedRelation: "battlePassSeasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battlePassXPLogs_userID_fkey"
            columns: ["userID"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      cards: {
        Row: {
          activationDate: string | null
          content: string
          created_at: string
          id: string
          img: string
          name: string
          owner: string | null
          supporterIncluded: number
        }
        Insert: {
          activationDate?: string | null
          content?: string
          created_at?: string
          id?: string
          img?: string
          name?: string
          owner?: string | null
          supporterIncluded?: number
        }
        Update: {
          activationDate?: string | null
          content?: string
          created_at?: string
          id?: string
          img?: string
          name?: string
          owner?: string | null
          supporterIncluded?: number
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
      caseItems: {
        Row: {
          caseId: number
          created_at: string
          expireAfter: number | null
          id: number
          itemId: number
          rate: number | null
        }
        Insert: {
          caseId: number
          created_at?: string
          expireAfter?: number | null
          id?: number
          itemId: number
          rate?: number | null
        }
        Update: {
          caseId?: number
          created_at?: string
          expireAfter?: number | null
          id?: number
          itemId?: number
          rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "caseItems_caseId_fkey"
            columns: ["caseId"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caseItems_itemId_fkey"
            columns: ["itemId"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      caseResult: {
        Row: {
          caseId: number
          created_at: string
          id: number
          openerId: string
          resultId: number | null
        }
        Insert: {
          caseId: number
          created_at?: string
          id?: number
          openerId: string
          resultId?: number | null
        }
        Update: {
          caseId?: number
          created_at?: string
          id?: number
          openerId?: string
          resultId?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "caseResult_caseId_fkey1"
            columns: ["caseId"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caseResult_openerId_fkey"
            columns: ["openerId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "caseResult_resultId_fkey"
            columns: ["resultId"]
            isOneToOne: false
            referencedRelation: "caseItems"
            referencedColumns: ["id"]
          },
        ]
      }
      changelogs: {
        Row: {
          created_at: string
          id: number
          levelID: number
          new: Json
          old: Json | null
          published: boolean | null
        }
        Insert: {
          created_at?: string
          id?: number
          levelID: number
          new: Json
          old?: Json | null
          published?: boolean | null
        }
        Update: {
          created_at?: string
          id?: number
          levelID?: number
          new?: Json
          old?: Json | null
          published?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "changelogs_levelID_fkey"
            columns: ["levelID"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      clanBan: {
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
            foreignKeyName: "clanBan_clan_fkey"
            columns: ["clan"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clanBan_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      clanInvitations: {
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
            foreignKeyName: "clanInvitations_clan_fkey"
            columns: ["clan"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clanInvitations_to_fkey"
            columns: ["to"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      clans: {
        Row: {
          boostedUntil: string
          created_at: string
          homeContent: string | null
          id: number
          imageVersion: number
          isPublic: boolean
          memberCount: number
          memberLimit: number
          mode: string
          name: string
          owner: string
          rank: number | null
          rating: number
          tag: string
          tagBgColor: string | null
          tagTextColor: string | null
        }
        Insert: {
          boostedUntil?: string
          created_at?: string
          homeContent?: string | null
          id?: number
          imageVersion?: number
          isPublic?: boolean
          memberCount?: number
          memberLimit?: number
          mode?: string
          name: string
          owner?: string
          rank?: number | null
          rating?: number
          tag: string
          tagBgColor?: string | null
          tagTextColor?: string | null
        }
        Update: {
          boostedUntil?: string
          created_at?: string
          homeContent?: string | null
          id?: number
          imageVersion?: number
          isPublic?: boolean
          memberCount?: number
          memberLimit?: number
          mode?: string
          name?: string
          owner?: string
          rank?: number | null
          rating?: number
          tag?: string
          tagBgColor?: string | null
          tagTextColor?: string | null
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
          productID: number | null
          quantity: number
          usageLeft: number
          validUntil: string
        }
        Insert: {
          code?: string
          created_at?: string
          deduct?: number
          owner?: string | null
          percent?: number
          productID?: number | null
          quantity?: number
          usageLeft?: number
          validUntil: string
        }
        Update: {
          code?: string
          created_at?: string
          deduct?: number
          owner?: string | null
          percent?: number
          productID?: number | null
          quantity?: number
          usageLeft?: number
          validUntil?: string
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
            foreignKeyName: "coupons_productID_fkey"
            columns: ["productID"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      deathCount: {
        Row: {
          completedTime: string | null
          count: number[]
          levelID: number
          tag: string
          uid: string
        }
        Insert: {
          completedTime?: string | null
          count: number[]
          levelID?: number
          tag?: string
          uid: string
        }
        Update: {
          completedTime?: string | null
          count?: number[]
          levelID?: number
          tag?: string
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_deathCount_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      eventLevels: {
        Row: {
          eventID: number
          id: number
          levelID: number
          minEventProgress: number
          needRaw: boolean
          point: number
          requiredLevel: number | null
          totalProgress: number
          unlockCondition: Json | null
        }
        Insert: {
          eventID: number
          id?: number
          levelID: number
          minEventProgress?: number
          needRaw?: boolean
          point: number
          requiredLevel?: number | null
          totalProgress?: number
          unlockCondition?: Json | null
        }
        Update: {
          eventID?: number
          id?: number
          levelID?: number
          minEventProgress?: number
          needRaw?: boolean
          point?: number
          requiredLevel?: number | null
          totalProgress?: number
          unlockCondition?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "eventLevels_eventID_fkey"
            columns: ["eventID"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventLevels_levelID_fkey"
            columns: ["levelID"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      eventLevelUnlockConditions: {
        Row: {
          created_at: string
          eventLevelId: number | null
          id: number
          requireEventLevelId: number | null
        }
        Insert: {
          created_at?: string
          eventLevelId?: number | null
          id?: number
          requireEventLevelId?: number | null
        }
        Update: {
          created_at?: string
          eventLevelId?: number | null
          id?: number
          requireEventLevelId?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "eventLevelUnlockConditions_eventLevelId_fkey"
            columns: ["eventLevelId"]
            isOneToOne: false
            referencedRelation: "eventLevels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventLevelUnlockConditions_requireEventLevelId_fkey"
            columns: ["requireEventLevelId"]
            isOneToOne: false
            referencedRelation: "eventLevels"
            referencedColumns: ["id"]
          },
        ]
      }
      eventProofs: {
        Row: {
          accepted: boolean
          content: string
          created_at: string
          data: Json | null
          diff: number | null
          eventID: number
          userid: string
        }
        Insert: {
          accepted?: boolean
          content?: string
          created_at?: string
          data?: Json | null
          diff?: number | null
          eventID: number
          userid: string
        }
        Update: {
          accepted?: boolean
          content?: string
          created_at?: string
          data?: Json | null
          diff?: number | null
          eventID?: number
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventProofs_eventID_fkey"
            columns: ["eventID"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventProofs_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      eventQuestClaims: {
        Row: {
          created_at: string
          questId: number
          userId: string
        }
        Insert: {
          created_at?: string
          questId: number
          userId: string
        }
        Update: {
          created_at?: string
          questId?: number
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventQuestClaims_questId_fkey"
            columns: ["questId"]
            isOneToOne: false
            referencedRelation: "eventQuests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventQuestClaims_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      eventQuestRewards: {
        Row: {
          created_at: string
          expireAfter: number | null
          id: number
          questId: number | null
          rewardId: number | null
        }
        Insert: {
          created_at?: string
          expireAfter?: number | null
          id?: number
          questId?: number | null
          rewardId?: number | null
        }
        Update: {
          created_at?: string
          expireAfter?: number | null
          id?: number
          questId?: number | null
          rewardId?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "eventQuestRewards_questId_fkey"
            columns: ["questId"]
            isOneToOne: false
            referencedRelation: "eventQuests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventQuestRewards_rewardId_fkey"
            columns: ["rewardId"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      eventQuests: {
        Row: {
          condition: Json
          created_at: string
          eventId: number
          id: number
          title: string | null
        }
        Insert: {
          condition: Json
          created_at?: string
          eventId: number
          id?: number
          title?: string | null
        }
        Update: {
          condition?: Json
          created_at?: string
          eventId?: number
          id?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventQuests_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      eventRecords: {
        Row: {
          accepted: boolean | null
          created_at: string
          levelID: number
          progress: number
          raw: string | null
          rejectReason: string | null
          userID: string
          videoLink: string
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string
          levelID: number
          progress: number
          raw?: string | null
          rejectReason?: string | null
          userID: string
          videoLink: string
        }
        Update: {
          accepted?: boolean | null
          created_at?: string
          levelID?: number
          progress?: number
          raw?: string | null
          rejectReason?: string | null
          userID?: string
          videoLink?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventRecords_levelID_fkey"
            columns: ["levelID"]
            isOneToOne: false
            referencedRelation: "eventLevels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualifier_userID_fkey"
            columns: ["userID"]
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
          imgUrl: string | null
          isCalculated: boolean
          isContest: boolean
          isExternal: boolean
          isRanked: boolean
          isSupporterOnly: boolean
          minExp: number
          needProof: boolean
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
          imgUrl?: string | null
          isCalculated?: boolean
          isContest?: boolean
          isExternal?: boolean
          isRanked?: boolean
          isSupporterOnly?: boolean
          minExp?: number
          needProof?: boolean
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
          imgUrl?: string | null
          isCalculated?: boolean
          isContest?: boolean
          isExternal?: boolean
          isRanked?: boolean
          isSupporterOnly?: boolean
          minExp?: number
          needProof?: boolean
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
          expireAt: string | null
          id: number
          itemId: number
          quantity: number
          redirectTo: string | null
          userID: string
        }
        Insert: {
          consumed?: boolean
          content?: string | null
          created_at?: string
          expireAt?: string | null
          id?: number
          itemId: number
          quantity?: number
          redirectTo?: string | null
          userID: string
        }
        Update: {
          consumed?: boolean
          content?: string | null
          created_at?: string
          expireAt?: string | null
          id?: number
          itemId?: number
          quantity?: number
          redirectTo?: string | null
          userID?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_itemId_fkey"
            columns: ["itemId"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playerMedal_userID_fkey"
            columns: ["userID"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      items: {
        Row: {
          defaultExpireAfter: number | null
          description: string | null
          id: number
          name: string
          productId: number | null
          quantity: number
          rarity: number
          redirect: string | null
          stackable: boolean
          type: string
        }
        Insert: {
          defaultExpireAfter?: number | null
          description?: string | null
          id?: number
          name?: string
          productId?: number | null
          quantity?: number
          rarity?: number
          redirect?: string | null
          stackable?: boolean
          type?: string
        }
        Update: {
          defaultExpireAfter?: number | null
          description?: string | null
          id?: number
          name?: string
          productId?: number | null
          quantity?: number
          rarity?: number
          redirect?: string | null
          stackable?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      itemTransactions: {
        Row: {
          created_at: string
          data: Json | null
          diff: number
          id: number
          inventoryItemId: number
        }
        Insert: {
          created_at?: string
          data?: Json | null
          diff: number
          id?: number
          inventoryItemId: number
        }
        Update: {
          created_at?: string
          data?: Json | null
          diff?: number
          id?: number
          inventoryItemId?: number
        }
        Relationships: [
          {
            foreignKeyName: "stackableItemTransactions_inventoryItemId_fkey"
            columns: ["inventoryItemId"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
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
      levelDeathCount: {
        Row: {
          count: number[]
          levelID: number
        }
        Insert: {
          count: number[]
          levelID?: number
        }
        Update: {
          count?: number[]
          levelID?: number
        }
        Relationships: []
      }
      levelGDStates: {
        Row: {
          isDaily: boolean | null
          isWeekly: boolean | null
          levelId: number
        }
        Insert: {
          isDaily?: boolean | null
          isWeekly?: boolean | null
          levelId: number
        }
        Update: {
          isDaily?: boolean | null
          isWeekly?: boolean | null
          levelId?: number
        }
        Relationships: [
          {
            foreignKeyName: "levelGDStates_levelId_fkey"
            columns: ["levelId"]
            isOneToOne: true
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          accepted: boolean
          created_at: string
          creator: string | null
          creatorId: string | null
          difficulty: string | null
          dlTop: number | null
          flPt: number | null
          flTop: number | null
          id: number
          insaneTier: number | null
          isChallenge: boolean
          isNonList: boolean
          isPlatformer: boolean
          main_level_id: number | null
          minProgress: number | null
          name: string | null
          rating: number | null
          videoID: string | null
        }
        Insert: {
          accepted?: boolean
          created_at?: string
          creator?: string | null
          creatorId?: string | null
          difficulty?: string | null
          dlTop?: number | null
          flPt?: number | null
          flTop?: number | null
          id: number
          insaneTier?: number | null
          isChallenge?: boolean
          isNonList?: boolean
          isPlatformer?: boolean
          main_level_id?: number | null
          minProgress?: number | null
          name?: string | null
          rating?: number | null
          videoID?: string | null
        }
        Update: {
          accepted?: boolean
          created_at?: string
          creator?: string | null
          creatorId?: string | null
          difficulty?: string | null
          dlTop?: number | null
          flPt?: number | null
          flTop?: number | null
          id?: number
          insaneTier?: number | null
          isChallenge?: boolean
          isNonList?: boolean
          isPlatformer?: boolean
          main_level_id?: number | null
          minProgress?: number | null
          name?: string | null
          rating?: number | null
          videoID?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "levels_creatorId_fkey"
            columns: ["creatorId"]
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
      levelSubmissions: {
        Row: {
          accepted: boolean
          comment: string | null
          created_at: string
          levelId: number
          userId: string
        }
        Insert: {
          accepted?: boolean
          comment?: string | null
          created_at?: string
          levelId: number
          userId: string
        }
        Update: {
          accepted?: boolean
          comment?: string | null
          created_at?: string
          levelId?: number
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "levelSubmissions_levelId_fkey"
            columns: ["levelId"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "levelSubmissions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      mapPackLevels: {
        Row: {
          created_at: string
          id: number
          levelID: number
          mapPackId: number
          order: number
        }
        Insert: {
          created_at?: string
          id?: number
          levelID: number
          mapPackId: number
          order?: number
        }
        Update: {
          created_at?: string
          id?: number
          levelID?: number
          mapPackId?: number
          order?: number
        }
        Relationships: [
          {
            foreignKeyName: "mapPackLevels_levelID_fkey"
            columns: ["levelID"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapPackLevels_mapPackId_fkey"
            columns: ["mapPackId"]
            isOneToOne: false
            referencedRelation: "mapPacks"
            referencedColumns: ["id"]
          },
        ]
      }
      mapPacks: {
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
      orderItems: {
        Row: {
          created_at: string
          id: number
          orderID: number
          productID: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: number
          orderID: number
          productID: number
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: number
          orderID?: number
          productID?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "orderItems_orderID_fkey"
            columns: ["orderID"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orderItems_productID_fkey"
            columns: ["productID"]
            isOneToOne: false
            referencedRelation: "products"
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
          giftTo: string | null
          id: number
          paymentMethod: string
          phone: number | null
          productID: number | null
          quantity: number | null
          recipientName: string | null
          state: string
          targetClanID: number | null
          userID: string
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
          giftTo?: string | null
          id?: number
          paymentMethod?: string
          phone?: number | null
          productID?: number | null
          quantity?: number | null
          recipientName?: string | null
          state: string
          targetClanID?: number | null
          userID: string
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
          giftTo?: string | null
          id?: number
          paymentMethod?: string
          phone?: number | null
          productID?: number | null
          quantity?: number | null
          recipientName?: string | null
          state?: string
          targetClanID?: number | null
          userID?: string
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
            foreignKeyName: "orders_giftTo_fkey"
            columns: ["giftTo"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "orders_productID_fkey"
            columns: ["productID"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_targetClanID_fkey"
            columns: ["targetClanID"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_userID_fkey"
            columns: ["userID"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      orderTracking: {
        Row: {
          content: string | null
          created_at: string
          delivering: boolean
          id: number
          link: string | null
          orderID: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          delivering?: boolean
          id?: number
          link?: string | null
          orderID: number
        }
        Update: {
          content?: string | null
          created_at?: string
          delivering?: boolean
          id?: number
          link?: string | null
          orderID?: number
        }
        Relationships: [
          {
            foreignKeyName: "deliverySteps_orderID_fkey"
            columns: ["orderID"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
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
      playerConvictions: {
        Row: {
          content: string
          created_at: string
          creditReduce: number
          id: number
          isHidden: boolean
          userId: string | null
        }
        Insert: {
          content: string
          created_at?: string
          creditReduce?: number
          id?: number
          isHidden?: boolean
          userId?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          creditReduce?: number
          id?: number
          isHidden?: boolean
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playerConvictions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      players: {
        Row: {
          avatarVersion: number
          bannerVersion: number
          bgColor: string | null
          borderColor: string | null
          city: string | null
          clan: number | null
          clrank: number | null
          clRating: number | null
          discord: string | null
          DiscordDMChannelID: string | null
          dlMaxPt: number | null
          dlrank: number | null
          elo: number
          email: string | null
          exp: number
          extraExp: number | null
          facebook: string | null
          flMaxPt: number | null
          flrank: number | null
          id: number
          isAdmin: boolean
          isAvatarGif: boolean
          isBanned: boolean
          isBannerGif: boolean
          isHidden: boolean
          isTrusted: boolean
          matchCount: number
          name: string | null
          nameLocked: boolean
          overallRank: number | null
          overviewData: Json | null
          plrank: number | null
          plRating: number | null
          pointercrate: string | null
          province: string | null
          rating: number | null
          recordCount: number
          renameCooldown: string
          reviewCooldown: string | null
          supporterUntil: string | null
          totalDLpt: number | null
          totalFLpt: number | null
          uid: string
          youtube: string | null
        }
        Insert: {
          avatarVersion?: number
          bannerVersion?: number
          bgColor?: string | null
          borderColor?: string | null
          city?: string | null
          clan?: number | null
          clrank?: number | null
          clRating?: number | null
          discord?: string | null
          DiscordDMChannelID?: string | null
          dlMaxPt?: number | null
          dlrank?: number | null
          elo?: number
          email?: string | null
          exp?: number
          extraExp?: number | null
          facebook?: string | null
          flMaxPt?: number | null
          flrank?: number | null
          id?: number
          isAdmin?: boolean
          isAvatarGif?: boolean
          isBanned?: boolean
          isBannerGif?: boolean
          isHidden?: boolean
          isTrusted?: boolean
          matchCount?: number
          name?: string | null
          nameLocked?: boolean
          overallRank?: number | null
          overviewData?: Json | null
          plrank?: number | null
          plRating?: number | null
          pointercrate?: string | null
          province?: string | null
          rating?: number | null
          recordCount?: number
          renameCooldown?: string
          reviewCooldown?: string | null
          supporterUntil?: string | null
          totalDLpt?: number | null
          totalFLpt?: number | null
          uid?: string
          youtube?: string | null
        }
        Update: {
          avatarVersion?: number
          bannerVersion?: number
          bgColor?: string | null
          borderColor?: string | null
          city?: string | null
          clan?: number | null
          clrank?: number | null
          clRating?: number | null
          discord?: string | null
          DiscordDMChannelID?: string | null
          dlMaxPt?: number | null
          dlrank?: number | null
          elo?: number
          email?: string | null
          exp?: number
          extraExp?: number | null
          facebook?: string | null
          flMaxPt?: number | null
          flrank?: number | null
          id?: number
          isAdmin?: boolean
          isAvatarGif?: boolean
          isBanned?: boolean
          isBannerGif?: boolean
          isHidden?: boolean
          isTrusted?: boolean
          matchCount?: number
          name?: string | null
          nameLocked?: boolean
          overallRank?: number | null
          overviewData?: Json | null
          plrank?: number | null
          plRating?: number | null
          pointercrate?: string | null
          province?: string | null
          rating?: number | null
          recordCount?: number
          renameCooldown?: string
          reviewCooldown?: string | null
          supporterUntil?: string | null
          totalDLpt?: number | null
          totalFLpt?: number | null
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
      playersAchievement: {
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
            foreignKeyName: "playersAchievement_achievementid_fkey"
            columns: ["achievementid"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playersAchievement_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      playerSubscriptions: {
        Row: {
          created_at: string
          end: string | null
          id: number
          start: string
          subscriptionId: number
          userID: string
        }
        Insert: {
          created_at?: string
          end?: string | null
          id?: number
          start?: string
          subscriptionId: number
          userID: string
        }
        Update: {
          created_at?: string
          end?: string | null
          id?: number
          start?: string
          subscriptionId?: number
          userID?: string
        }
        Relationships: [
          {
            foreignKeyName: "playerSubscriptions_subscriptionId_fkey"
            columns: ["subscriptionId"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playerSubscriptions_userID_fkey"
            columns: ["userID"]
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
          bannerTextColor: string
          created_at: string
          description: string | null
          featured: boolean
          hidden: boolean
          id: number
          imgCount: number | null
          maxQuantity: number | null
          name: string
          price: number
          redirect: string | null
          stock: number | null
        }
        Insert: {
          bannerTextColor?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          hidden?: boolean
          id?: number
          imgCount?: number | null
          maxQuantity?: number | null
          name: string
          price: number
          redirect?: string | null
          stock?: number | null
        }
        Update: {
          bannerTextColor?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          hidden?: boolean
          id?: number
          imgCount?: number | null
          maxQuantity?: number | null
          name?: string
          price?: number
          redirect?: string | null
          stock?: number | null
        }
        Relationships: []
      }
      PVPPlayers: {
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
            foreignKeyName: "PVPPlayers_player_fkey"
            columns: ["player"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
          {
            foreignKeyName: "PVPPlayers_room_fkey"
            columns: ["room"]
            isOneToOne: false
            referencedRelation: "PVPRooms"
            referencedColumns: ["id"]
          },
        ]
      }
      PVPRooms: {
        Row: {
          averageRating: number
          created_at: string
          host: string | null
          id: number
          isPublic: boolean
          name: string
          playerCount: number
        }
        Insert: {
          averageRating?: number
          created_at?: string
          host?: string | null
          id?: number
          isPublic?: boolean
          name: string
          playerCount?: number
        }
        Update: {
          averageRating?: number
          created_at?: string
          host?: string | null
          id?: number
          isPublic?: boolean
          name?: string
          playerCount?: number
        }
        Relationships: [
          {
            foreignKeyName: "PVPRoom_host_fkey"
            columns: ["host"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
      }
      records: {
        Row: {
          clPt: number | null
          comment: string | null
          dlPt: number | null
          flPt: number | null
          isChecked: boolean | null
          levelid: number
          mobile: boolean
          needMod: boolean
          no: number | null
          plPt: number | null
          prioritizedBy: number
          progress: number
          queueNo: number | null
          raw: string | null
          refreshRate: number | null
          reviewer: string | null
          reviewerComment: string | null
          suggestedRating: number | null
          timestamp: number | null
          userid: string
          variant_id: number | null
          videoLink: string | null
        }
        Insert: {
          clPt?: number | null
          comment?: string | null
          dlPt?: number | null
          flPt?: number | null
          isChecked?: boolean | null
          levelid: number
          mobile?: boolean
          needMod?: boolean
          no?: number | null
          plPt?: number | null
          prioritizedBy?: number
          progress?: number
          queueNo?: number | null
          raw?: string | null
          refreshRate?: number | null
          reviewer?: string | null
          reviewerComment?: string | null
          suggestedRating?: number | null
          timestamp?: number | null
          userid: string
          variant_id?: number | null
          videoLink?: string | null
        }
        Update: {
          clPt?: number | null
          comment?: string | null
          dlPt?: number | null
          flPt?: number | null
          isChecked?: boolean | null
          levelid?: number
          mobile?: boolean
          needMod?: boolean
          no?: number | null
          plPt?: number | null
          prioritizedBy?: number
          progress?: number
          queueNo?: number | null
          raw?: string | null
          refreshRate?: number | null
          reviewer?: string | null
          reviewerComment?: string | null
          suggestedRating?: number | null
          timestamp?: number | null
          userid?: string
          variant_id?: number | null
          videoLink?: string | null
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
          refId: number | null
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          price: number
          refId?: number | null
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          price?: number
          refId?: number | null
          type?: string
        }
        Relationships: []
      }
      userSocial: {
        Row: {
          created_at: string
          id: string
          isVisible: boolean
          name: string | null
          platform: string
          userid: string
        }
        Insert: {
          created_at?: string
          id: string
          isVisible?: boolean
          name?: string | null
          platform: string
          userid: string
        }
        Update: {
          created_at?: string
          id?: string
          isVisible?: boolean
          name?: string | null
          platform?: string
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "userSocial_userid_fkey"
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
          modifiedAt: string
          path: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          image?: string | null
          locale?: string
          modifiedAt?: string
          path: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          image?: string | null
          locale?: string
          modifiedAt?: string
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
          creatorId: string | null
          difficulty: string | null
          dlTop: number | null
          flPt: number | null
          flTop: number | null
          id: number
          insaneTier: number | null
          isChallenge: boolean
          isNonList: boolean
          isPlatformer: boolean
          main_level_id: number | null
          minProgress: number | null
          name: string | null
          rating: number | null
          videoID: string | null
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

