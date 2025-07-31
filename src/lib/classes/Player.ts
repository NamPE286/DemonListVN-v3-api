import supabase from '@database/supabase'
import { sendDirectMessage } from '@src/lib/client/discord'
import type { TPlayer } from '@src/lib/types'

interface Player extends TPlayer { }

class Player {
    constructor(data: TPlayer) {
        Object.assign(this, data)
    }

    async pull() {
        const { data, error } = await supabase
            .from('players')
            .select('*, clans!id(*)')
            .eq('uid', this.uid!)
            .single()

        if (error) {
            throw error
        }

        Object.assign(this, data)
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

    async extendSupporter(month: number) {
        if (!this.supporterUntil || new Date(this.supporterUntil) < new Date()) {
            const supporterUntil = new Date(new Date().getTime() + month * 30 * 24 * 60 * 60 * 1000);
            this.supporterUntil = supporterUntil.toISOString();
        } else {
            const supporterUntil = new Date(new Date(this.supporterUntil).getTime() + month * 30 * 24 * 60 * 60 * 1000);
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
        if (this.rating! >= 10000) {
            return {
                title: "AGM",
                fullTitle: "Ascended Grandmaster",
                color:
                    "white;background: linear-gradient(to right, #ff00cc, #333399);",
            };
        }
        if (this.rating! >= 6000) {
            return {
                title: "LGM",
                fullTitle: "Legendary Grandmaster",
                color: "darkred",
            };
        }
        if (this.rating! >= 3000) {
            return {
                title: "GM",
                fullTitle: "Grandmaster",
                color: "red",
            };
        }
        if (this.rating! >= 1500) {
            return {
                title: "M",
                fullTitle: "Master",
                color: "hsla(321, 100%, 50%, 1)",
            };
        }
        if (this.rating! >= 1000) {
            return {
                title: "CM",
                fullTitle: "Candidate Master",
                color: "purple",
            };
        }
        if (this.rating! >= 800) {
            return {
                title: "EX",
                fullTitle: "Expert",
                color: "blue",
            };
        }
        if (this.rating! >= 400) {
            return {
                title: "SP",
                fullTitle: "Specialist",
                color: "darkcyan",
            };
        }
        if (this.rating! >= 200) {
            return {
                title: "A",
                fullTitle: "A",
                color: "green",
            };
        }
        if (this.rating! >= 50) {
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

        await sendDirectMessage(this.uid!, `Your Discord account is linked to [${this.name}](https://demonlistvn.com/player/${this.uid!}) DLVN account.`, true)
    }

    async getInventoryItems(type: string) {
        const { data, error } = await supabase
            .from("inventory")
            .select("*, items!inner(*)")
            .eq("userID", this.uid!)
            .eq("items.type", type)
            .order("created_at", { ascending: false })

        if (error) {
            throw error
        }

        if (data) {
            data.forEach((item: any) => {
                if (item.items) {
                    Object.assign(item, item.items);
                    delete item.items;
                    delete item.id;
                }
            });
        }

        return data
    }
}

export default Player