import { getPlayer, updatePlayer, isPlayerSupporterActive, getPlayerTitle } from '@src/services/player.service'
import type { Tables } from '@src/types/supabase';

export async function getAccessToken(code: string) {
    const response = await fetch("https://discord.com/api/v10/oauth2/token", {
        method: "POST",
        body: new URLSearchParams({
            "client_id": process.env.DISCORD_AUTH_CLIENT_ID!,
            "client_secret": process.env.DISCORD_AUTH_CLIENT_SECRET!,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": process.env.DISCORD_AUTH_REDIRECT_URI!
        }),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });
    const data: any = await response.json();

    if (data.access_token == undefined) {
        console.error(data)
    }

    return data;
}

export async function getUserByToken(token: string) {
    const response = await fetch("https://discord.com/api/v10/users/@me", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    const data: any = await response.json();

    return data;
}

export async function getUserByID(id: number) {
    const response = await fetch(`https://discord.com/api/v10/users/${id}`, {
        method: "GET",
        headers: {
            "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
        }
    });
    const data = await response.json();

    return data;
}

export async function createDirectMessageChannel(userID: string): Promise<string> {
    const response = await fetch("https://discord.com/api/v10/users/@me/channels", {
        method: "POST",
        body: JSON.stringify({
            "recipient_id": userID
        }),
        headers: {
            "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
        }
    });
    const data: any = await response.json();

    return data.id;
}

export async function sendDirectMessage(uid: string, content: string, bypass: boolean = false) {
    const player = await getPlayer(uid)

    if (!bypass && (!isPlayerSupporterActive(player) || !player.discord)) {
        return;
    }

    let DiscordDMChannelID = player.DiscordDMChannelID

    if (DiscordDMChannelID == null) {
        DiscordDMChannelID = await createDirectMessageChannel(player.discord!)

        if (DiscordDMChannelID == null) {
            throw new Error("Failed to create channel")
        }

        await updatePlayer({ ...player, DiscordDMChannelID });
    }

    const res = await fetch(`https://discord.com/api/v10/channels/${DiscordDMChannelID}/messages`, {
        method: "POST",
        body: JSON.stringify({
            "content": content
        }),
        headers: {
            "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
        }
    });

    if (!res.ok) {
        console.log('Failed to send DM: ', res.status)
    }
}

export async function sendMessageToChannel(id: string, content: string) {
    const res = await fetch(`https://discord.com/api/v10/channels/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({
            "content": content
        }),
        headers: {
            "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
        }
    });

    console.log(res.ok)

    if (!res.ok) {
        console.log('Failed to send message to channel: ', res.status)
    }
}

export async function fetchMember(guildID: string, userID: string): Promise<any> {
    const res = await (await fetch(`https://discord.com/api/v10/guilds/${guildID}/members/${userID}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json'
        }
    })).json()

    return res;
}

export async function updateRole(guildID: string, userID: string, roles: string[]) {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildID}/members/${userID}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            roles: roles
        })
    })

    if (!res.ok) {
        throw await res.json()
    }
}

export async function syncRoleGDVN(player: Tables<"players">) {
    const roles = {
        trusted: "1469593519445377064",
        supporter: "1387306487168106568",
        AGM: "1469657496476979290",
        LGM: "1387311470257111051",
        GM: "1387352354604584970",
        M: "1387352402939744368",
        CM: "1469640440276844545",
        EX: "1387352624483012768",
        SP: "1387347034960564298",
        A: "1469608329088073728",
        B: "1469608391470223493",
        C: "1469608439071248574"
    }
    const guildID = "1387099091028152392";

    if (!player.discord) {
        return;
    }

    const playerRoles: string[] = (await fetchMember(guildID, player.discord!)).roles;
    const s = new Set(playerRoles)

    for (const [key, value] of Object.entries(roles)) {
        s.delete(value);
    }

    if (isPlayerSupporterActive(player)) {
        s.add(roles.supporter)
    }

    // @ts-ignore
    const title = getPlayerTitle(player, 'dl')

    if (title != null) {
        // @ts-ignore
        s.add(roles[title.title])
    }

    if (player.isTrusted) {
        s.add(roles.trusted)
    }

    const s1 = new Set(playerRoles)

    if (s1.isSubsetOf(s) && s1.isSupersetOf(s)) {
        return;
    }

    await updateRole(guildID, player.discord!, Array.from(s));
}