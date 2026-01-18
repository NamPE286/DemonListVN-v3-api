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
          uid: string
        }
        Insert: {
          completedTime?: string | null
          count: number[]
          levelID?: number
          uid: string
        }
        Update: {
          completedTime?: string | null
          count?: number[]
          levelID?: number
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
          description: string | null
          id: number
          name: string
          productId: number | null
          quantity: number
          rarity: number
          redirect: string | null
          type: string
        }
        Insert: {
          description?: string | null
          id?: number
          name?: string
          productId?: number | null
          quantity?: number
          rarity?: number
          redirect?: string | null
          type?: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
          productId?: number | null
          quantity?: number
          rarity?: number
          redirect?: string | null
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
      levels: {
        Row: {
          accepted: boolean
          created_at: string
          creator: string | null
          dlTop: number | null
          flPt: number | null
          flTop: number | null
          id: number
          insaneTier: number | null
          isNonList: boolean
          isPlatformer: boolean
          minProgress: number | null
          name: string | null
          rating: number | null
          videoID: string | null
        }
        Insert: {
          accepted?: boolean
          created_at?: string
          creator?: string | null
          dlTop?: number | null
          flPt?: number | null
          flTop?: number | null
          id: number
          insaneTier?: number | null
          isNonList?: boolean
          isPlatformer?: boolean
          minProgress?: number | null
          name?: string | null
          rating?: number | null
          videoID?: string | null
        }
        Update: {
          accepted?: boolean
          created_at?: string
          creator?: string | null
          dlTop?: number | null
          flPt?: number | null
          flTop?: number | null
          id?: number
          insaneTier?: number | null
          isNonList?: boolean
          isPlatformer?: boolean
          minProgress?: number | null
          name?: string | null
          rating?: number | null
          videoID?: string | null
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
      players: {
        Row: {
          avatarVersion: number
          bannerVersion: number
          bgColor: string | null
          borderColor: string | null
          city: string | null
          clan: number | null
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
          comment: string | null
          dlPt: number | null
          flPt: number | null
          isChecked: boolean | null
          levelid: number
          mobile: boolean
          needMod: boolean
          no: number | null
          plPt: number | null
          prioritizeBy: number
          progress: number
          queueNo: number | null
          raw: string | null
          refreshRate: number | null
          reviewer: string | null
          reviewerComment: string | null
          suggestedRating: number | null
          timestamp: number | null
          userid: string
          videoLink: string | null
        }
        Insert: {
          comment?: string | null
          dlPt?: number | null
          flPt?: number | null
          isChecked?: boolean | null
          levelid: number
          mobile?: boolean
          needMod?: boolean
          no?: number | null
          plPt?: number | null
          prioritizeBy?: number
          progress?: number
          queueNo?: number | null
          raw?: string | null
          refreshRate?: number | null
          reviewer?: string | null
          reviewerComment?: string | null
          suggestedRating?: number | null
          timestamp?: number | null
          userid: string
          videoLink?: string | null
        }
        Update: {
          comment?: string | null
          dlPt?: number | null
          flPt?: number | null
          isChecked?: boolean | null
          levelid?: number
          mobile?: boolean
          needMod?: boolean
          no?: number | null
          plPt?: number | null
          prioritizeBy?: number
          progress?: number
          queueNo?: number | null
          raw?: string | null
          refreshRate?: number | null
          reviewer?: string | null
          reviewerComment?: string | null
          suggestedRating?: number | null
          timestamp?: number | null
          userid?: string
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
          expireAt: string | null
          type: string
          userID: string
        }
        Insert: {
          created_at?: string
          expireAt?: string | null
          type: string
          userID: string
        }
        Update: {
          created_at?: string
          expireAt?: string | null
          type?: string
          userID?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_userID_fkey"
            columns: ["userID"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["uid"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
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
      get_random_levels: {
        Args: { filter_type: string; row_count: number }
        Returns: {
          accepted: boolean
          created_at: string
          creator: string | null
          dlTop: number | null
          flPt: number | null
          flTop: number | null
          id: number
          insaneTier: number | null
          isNonList: boolean
          isPlatformer: boolean
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
      get_top_buyers: {
        Args: { interval_ms: number; limit_count: number; offset_count: number }
        Returns: {
          totalAmount: number
          uid: string
        }[]
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

