// Migrated from lib/client/pointercrate.ts
class PointercrateService {
    async getUsernameByToken(token: string): Promise<string> {
        const res: any = await (await fetch('https://pointercrate.com/api/v1/auth/me/', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })).json()

        return res.data.name
    }

    async hasRecord(id: number, levelName: string): Promise<boolean> {
        try {
            const res: any = await (await fetch(`https://pointercrate.com/api/v1/records?player=${id}&demon=${levelName}`)).json()

            for (const record of res) {
                if (record.status === "approved") {
                    return true
                }
            }

            return false
        } catch {
            console.error("Failed to fetch from Pointercrate")

            return false
        }
    }

    async approved(name: string, levelName: string): Promise<boolean> {
        const res: any = await (await fetch(`https://pointercrate.com/api/v1/players?name=${name}`)).json()

        for (const i of res) {
            if (await this.hasRecord(i.id, levelName)) {
                return true
            }
        }

        return false
    }
}

export default new PointercrateService()
