export async function getUsernameByToken(token: string): Promise<string> {
    const res: any = await (await fetch('https://pointercrate.com/api/v1/auth/me/', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })).json();

    return res.data.name;
}

export async function hasRecord(id: number, levelName: string) {
    try {
        const res: any = await (await fetch(`https://pointercrate.com/api/v1/records?player=${id}&demon=${levelName}`)).json();

        for (const record of res) {
            if (record.status == "approved") {
                return true;
            }
        }

        return false;
    } catch {
        console.error("Failed to fetch from Pointercrate")
        return false;
    }
}

export async function approved(name: string, levelName: string) {
    const response = await fetch(`https://pointercrate.com/api/v1/players?name=${name}`);
    
    if (!response.ok) {
        throw response.status;
    }
    
    const res: any = await response.json();

    for (const i of res) {
        if (await hasRecord(i.id, levelName)) {
            return true;
        }
    }

    return false;
}