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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
          created_at: string
          id: number
          imageVersion: number
          isPublic: boolean
          memberCount: number
          memberLimit: number
          name: string
          owner: string
          rank: number | null
          rating: number
          tag: string
          tagBgColor: string | null
          tagTextColor: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          imageVersion?: number
          isPublic?: boolean
          memberCount?: number
          memberLimit?: number
          name: string
          owner?: string
          rank?: number | null
          rating?: number
          tag: string
          tagBgColor?: string | null
          tagTextColor?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          imageVersion?: number
          isPublic?: boolean
          memberCount?: number
          memberLimit?: number
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
          percent: number
          productID: number | null
          quantity: number
          usageLeft: number
          validUntil: string
        }
        Insert: {
          code: string
          created_at?: string
          deduct?: number
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
          percent?: number
          productID?: number | null
          quantity?: number
          usageLeft?: number
          validUntil?: string
        }
        Relationships: [
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
          needRaw: boolean
          point: number
        }
        Insert: {
          eventID: number
          id?: number
          levelID: number
          needRaw: boolean
          point: number
        }
        Update: {
          eventID?: number
          id?: number
          levelID?: number
          needRaw?: boolean
          point?: number
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
      eventProofs: {
        Row: {
          accepted: boolean
          content: string
          created_at: string
          data: Json | null
          eventID: number
          userid: string
        }
        Insert: {
          accepted?: boolean
          content?: string
          created_at?: string
          data?: Json | null
          eventID: number
          userid: string
        }
        Update: {
          accepted?: boolean
          content?: string
          created_at?: string
          data?: Json | null
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
          description: string
          end: string | null
          exp: number | null
          freeze: string | null
          hidden: boolean
          id: number
          imgUrl: string
          isContest: boolean
          isSupporterOnly: boolean
          minExp: number
          needProof: boolean
          redirect: string | null
          start: string
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          description: string
          end?: string | null
          exp?: number | null
          freeze?: string | null
          hidden?: boolean
          id?: number
          imgUrl: string
          isContest?: boolean
          isSupporterOnly?: boolean
          minExp?: number
          needProof?: boolean
          redirect?: string | null
          start?: string
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string
          end?: string | null
          exp?: number | null
          freeze?: string | null
          hidden?: boolean
          id?: number
          imgUrl?: string
          isContest?: boolean
          isSupporterOnly?: boolean
          minExp?: number
          needProof?: boolean
          redirect?: string | null
          start?: string
          title?: string
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
          content: string | null
          created_at: string
          medalID: number
          userID: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          medalID: number
          userID: string
        }
        Update: {
          content?: string | null
          created_at?: string
          medalID?: number
          userID?: string
        }
        Relationships: [
          {
            foreignKeyName: "playerMedal_medalID_fkey"
            columns: ["medalID"]
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
          id: number
          name: string
          redirect: string | null
          type: string
        }
        Insert: {
          id?: number
          name?: string
          redirect?: string | null
          type?: string
        }
        Update: {
          id?: number
          name?: string
          redirect?: string | null
          type?: string
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
          delivered: boolean
          discount: number
          fee: number
          giftTo: string | null
          id: number
          paymentMethod: string
          phone: number | null
          productID: number | null
          quantity: number | null
          recipentName: string | null
          state: string
          userID: string
        }
        Insert: {
          address?: string | null
          amount: number
          coupon?: string | null
          created_at?: string
          currency?: string
          delivered?: boolean
          discount?: number
          fee?: number
          giftTo?: string | null
          id?: number
          paymentMethod?: string
          phone?: number | null
          productID?: number | null
          quantity?: number | null
          recipentName?: string | null
          state: string
          userID: string
        }
        Update: {
          address?: string | null
          amount?: number
          coupon?: string | null
          created_at?: string
          currency?: string
          delivered?: boolean
          discount?: number
          fee?: number
          giftTo?: string | null
          id?: number
          paymentMethod?: string
          phone?: number | null
          productID?: number | null
          quantity?: number | null
          recipentName?: string | null
          state?: string
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
          name: string
          nameLocked: boolean
          overallRank: number | null
          platformerRank: number | null
          platformerRating: number | null
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
          name: string
          nameLocked?: boolean
          overallRank?: number | null
          platformerRank?: number | null
          platformerRating?: number | null
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
          name?: string
          nameLocked?: boolean
          overallRank?: number | null
          platformerRank?: number | null
          platformerRating?: number | null
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
          progress: number
          queueNo: number | null
          raw: string | null
          refreshRate: number | null
          reviewer: string | null
          reviewerComment: string | null
          suggestedRating: number | null
          time: number | null
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
          progress?: number
          queueNo?: number | null
          raw?: string | null
          refreshRate?: number | null
          reviewer?: string | null
          reviewerComment?: string | null
          suggestedRating?: number | null
          time?: number | null
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
          progress?: number
          queueNo?: number | null
          raw?: string | null
          refreshRate?: number | null
          reviewer?: string | null
          reviewerComment?: string | null
          suggestedRating?: number | null
          time?: number | null
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
      updateList: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      updateRank: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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

