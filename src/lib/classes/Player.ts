import supabase from '@database/supabase'
import { sendDirectMessage } from '@src/services/discord'
import type { TInventoryItem, TPlayer } from '@src/lib/types'
import type { Database } from '@src/lib/types/supabase'
import { FRONTEND_URL } from '@src/lib/constants'

interface Player extends TPlayer { }

class Player {
    constructor(data: TPlayer) {
        Object.assign(this, data)
    }

    async pull() {
        if (this.uid) {
            const { data, error } = await supabase
                .from('players')
                .select('*, clans!id(*)')
                .eq('uid', this.uid)
                .single()

            if (error) {
                throw error
            }

            Object.assign(this, data)
        } else if (this.name) {
            const { data, error } = await supabase
                .from('players')
                .select('*, clans!id(*)')
                .eq('name', this.name)
                .single()

            if (error) {
                throw error
            }

            Object.assign(this, data)
        }
    }

    async update({ updateClan = false } = {}) {
        const updateData = this

        if (!/^[A-Za-z0-9]+$/.test(updateData.name!)) {
            throw new Error("Invalid name format")
        }

        if ((updateData.isTrusted && !updateData.isAdmin) || updateData.nameLocked) {
            delete updateData.name
        }

        delete updateData.isAdmin
        delete updateData.isTrusted
        delete updateData.isBanned
        delete updateData.reviewCooldown
        delete updateData.renameCooldown
        delete updateData.rating
        delete updateData.overallRank
        delete updateData.supporterUntil
        //@ts-ignore
        delete updateData.clans
        delete updateData.discord
        delete updateData.nameLocked
        delete updateData.pointercrate

        if (!updateClan) {
            delete this.clan
        }

        const { error } = await supabase
            .from('players')
            .upsert(this as any)

        if (error) {
            const { error } = await supabase
                .from("players")
                .update(this as any)
                .eq("uid", this.uid!)

            if (error) {
                throw error
            }
        }

        await this.pull()
    }

    async extendSupporter(month: number, day: number = 0) {
        const DAY_MS = 24 * 60 * 60 * 1000;

        if (!this.supporterUntil || new Date(this.supporterUntil) < new Date()) {
            const supporterUntil = new Date(new Date().getTime() + month * 30 * DAY_MS + day * DAY_MS);
            this.supporterUntil = supporterUntil.toISOString();
        } else {
            const supporterUntil = new Date(new Date(this.supporterUntil).getTime() + month * 30 * DAY_MS + day * DAY_MS);
            this.supporterUntil = supporterUntil.toISOString();
        }

        const { error } = await supabase
            .from('players')
            .update({ supporterUntil: this.supporterUntil })
            .eq('uid', this.uid!)

        if (error) {
            throw error;
        }
    }

    isSupporterActive() {
        if (!this.supporterUntil) {
            return false;
        }

        return new Date(this.supporterUntil) > new Date();
    }

    getTitle(list: string) {
        if (list == "dl") {
            if (this.rating! >= 6000) {
                return {
                    title: "AGM",
                    fullTitle: "Ascended Grandmaster",
                    color:
                        "white;background: linear-gradient(to right, #ff00cc, #333399);",
                };
            }
            if (this.rating! >= 5000) {
                return {
                    title: "LGM",
                    fullTitle: "Legendary Grandmaster",
                    color: "darkred",
                };
            }
            if (this.rating! >= 4000) {
                return {
                    title: "GM",
                    fullTitle: "Grandmaster",
                    color: "red",
                };
            }
            if (this.rating! >= 3000) {
                return {
                    title: "M",
                    fullTitle: "Master",
                    color: "hsla(321, 100%, 50%, 1)",
                };
            }
            if (this.rating! >= 2500) {
                return {
                    title: "CM",
                    fullTitle: "Candidate Master",
                    color: "purple",
                };
            }
            if (this.rating! >= 2000) {
                return {
                    title: "EX",
                    fullTitle: "Expert",
                    color: "blue",
                };
            }
            if (this.rating! >= 1500) {
                return {
                    title: "SP",
                    fullTitle: "Specialist",
                    color: "darkcyan",
                };
            }
            if (this.rating! >= 1000) {
                return {
                    title: "A",
                    fullTitle: "A",
                    color: "green",
                };
            }
            if (this.rating! >= 500) {
                return {
                    title: "B",
                    fullTitle: "B",
                    color: "#413cde",
                };
            }
            if (this.rating! > 0) {
                return {
                    title: "C",
                    fullTitle: "C",
                    color: "gray",
                };
            }
            return null;
        }
    }

    async updateDiscord(id: string) {
        const { error } = await supabase
            .from("players")
            .update({ discord: id, DiscordDMChannelID: null })
            .eq("uid", this.uid!)

        if (error) {
            throw error;
        }

        await sendDirectMessage(this.uid!, `Your Discord account is linked to [${this.name}](${FRONTEND_URL}/player/${this.uid!}) DLVN account.`, true)
    }

    async getInventoryItems() {
        type InventoryRow = Database['public']['Tables']['inventory']['Row']
        type ItemRow = Database['public']['Tables']['items']['Row']

        const { data, error } = await supabase
            .from('inventory')
            .select('*, items!inner(*)')
            .eq('userID', this.uid!)
            .eq('consumed', false)
            .or(`expireAt.is.null,expireAt.gt.${new Date().toISOString()}`)
            .order('created_at', { ascending: false })

        if (error) {
            throw error
        }

        if (!data) {
            return [] as TInventoryItem[]
        }

        const mapped: TInventoryItem[] = (data as (InventoryRow & { items?: ItemRow })[]).map(row => {
            const items = row.items

            const base = {
                userID: row.userID,
                itemId: row.itemId,
                content: row.content,
                created_at: row.created_at,
                inventoryId: row.id,
                useRedirect: row.redirectTo,
                expireAt: row.expireAt
            }

            const itemFields = items ? {
                name: items.name,
                type: items.type,
                redirect: items.redirect,
                productId: items.productId,
                description: items.description,
                rarity: items.rarity,
                useRedirect: base.useRedirect,
                expireAt: base.expireAt
            } : {
                name: '' as string,
                type: '' as string,
                redirect: null as string | null,
                productId: null as number | null,
                description: null as string | null,
                useRedirect: null,
                expireAt: null
            }

            return Object.assign({}, base, itemFields) as TInventoryItem
        })

        return mapped
    }
}

export default Player