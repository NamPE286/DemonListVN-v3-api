export async function getUsernameByToken(token: string): Promise<string> {
    const res: any = await (await fetch('https://pointercrate.com/api/v1/auth/me/', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })).json();

    return res.data.id;
}

export async function approved(userID: number, levelName: string) {
    const res: any = await (await fetch(`https://pointercrate.com/api/v1/records?player=${userID}&demon=${levelName}`)).json();

    for (const record of res) {
        if (record.status == "approved") {
            return true;
        }
    }

    return false;
}