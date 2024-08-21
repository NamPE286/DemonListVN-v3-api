export default {
    notice(message: string) {
        fetch(process.env.DISCORD_WEBHOOK_NOTICE!, {
            method: "POST",
            body: JSON.stringify({
                "content": message
            }),
            headers: {
                "Accept": "*/*",
                "Content-Type": "application/json"
            }
        });
    },

    log(message: string) {
        fetch(process.env.DISCORD_WEBHOOK_LOG!, {
            method: "POST",
            body: JSON.stringify({
                "content": message
            }),
            headers: {
                "Accept": "*/*",
                "Content-Type": "application/json"
            }
        });
    },

    changelog(message: string) {
        fetch(process.env.DISCORD_WEBHOOK_CHANGELOG!, {
            method: "POST",
            body: JSON.stringify({
                "content": message
            }),
            headers: {
                "Accept": "*/*",
                "Content-Type": "application/json"
            }
        });
    },
}