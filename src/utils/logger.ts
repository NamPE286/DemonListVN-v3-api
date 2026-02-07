export default {
    async notice(message: string) {
        await fetch(process.env.DISCORD_WEBHOOK_NOTICE!, {
            method: "POST",
            body: JSON.stringify({
                "content": message
            }),
            headers: {
                "Accept": "*/*",
                "Content-Type": "application/json"
            }
        })
    },

    async log(message: string) {
        await fetch(process.env.DISCORD_WEBHOOK_LOG!, {
            method: "POST",
            body: JSON.stringify({
                "content": message
            }),
            headers: {
                "Accept": "*/*",
                "Content-Type": "application/json"
            }
        })
    },

    async changelog(message: string) {
        await fetch(process.env.DISCORD_WEBHOOK_CHANGELOG!, {
            method: "POST",
            body: JSON.stringify({
                "content": message
            }),
            headers: {
                "Accept": "*/*",
                "Content-Type": "application/json"
            }
        }).then(res => {
            if (!res.ok) {
                console.log(res.status)
            }
        });
    },
}