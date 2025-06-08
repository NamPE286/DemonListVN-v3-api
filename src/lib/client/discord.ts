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

export async function createDirectMessageChannel(userID: number): Promise<number> {
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

export async function sendDirectMessage(channelID: number, content: string) {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelID}/messages`, {
        method: "POST",
        body: JSON.stringify({
            "content": content
        }),
        headers: {
            "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
        }
    });

    await response.json();
}