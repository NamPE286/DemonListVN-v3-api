export async function getUserIDFromAuthCode(code: string) {
    // TODO
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