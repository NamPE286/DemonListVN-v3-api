import Player from "@src/classes/Player";

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
    const player = new Player({ uid: uid })

    await player.pull();

    if (!bypass && (!player.isSupporterActive() || !player.discord)) {
        return;
    }

    if (player.DiscordDMChannelID == null) {
        player.DiscordDMChannelID = await createDirectMessageChannel(player.discord!)

        if (player.DiscordDMChannelID == null) {
            throw new Error("Failed to create channel")
        }

        await player.update();
    }

    await fetch(`https://discord.com/api/v10/channels/${player.DiscordDMChannelID}/messages`, {
        method: "POST",
        body: JSON.stringify({
            "content": content
        }),
        headers: {
            "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
        }
    });
}

export async function sendMessageToChannel(id: string, content: string) {
    await fetch(`https://discord.com/api/v10/channels/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({
            "content": content
        }),
        headers: {
            "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
        }
    });
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

export async function syncRoleDLVN(player: Player) {
    const roles = {
        trusted: "1246843095593517066",
        supporter: "1004356961309032549",
        AGM: "1400238211321823354",
        LGM: "1058866853038010390",
        GM: "1058866865222463548",
        M: "1058866902627262564",
        CM: "1058924959122075698",
        EX: "1058867472595439763",
        SP: "1058867025528750130",
        A: "1387277818823577741",
        B: "1387278083907915866",
        C: "1387278263940026419"
    }
    const guildID = "877546680801697813";

    if (!player.discord) {
        return;
    }

    const playerRoles: string[] = (await fetchMember(guildID, player.discord!)).roles;
    const s = new Set(playerRoles)

    for (const [key, value] of Object.entries(roles)) {
        s.delete(value);
    }

    if (player.isSupporterActive()) {
        s.add(roles.supporter)
    }

    const title = player.getTitle('dl')

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

export async function syncRoleGDVN(player: Player) {
    const roles = {
        supporter: "1387306487168106568",
        LGM: "1387311470257111051",
        GM: "1387352354604584970",
        M: "1387352402939744368",
        EX: "1387352624483012768",
        SP: "1387347034960564298",
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

    if (player.isSupporterActive()) {
        s.add(roles.supporter)
    }

    const title = player.getTitle('dl')

    if (title != null) {
        if (title.title == "SP" || title.title == "C" || title.title == "B" || title.title == "A") {
            s.add(roles['SP'])
        } else if (title.title == 'EX' || title.title == 'CM') {
            s.add(roles['EX'])
        } else {
            // @ts-ignore
            s.add(roles[title.title])
        }
    }

    const s1 = new Set(playerRoles)

    if (s1.isSubsetOf(s) && s1.isSupersetOf(s)) {
        return;
    }

    await updateRole(guildID, player.discord!, Array.from(s));
}