export async function getUsernameByToken(token: string): Promise<string> {
    const res: any = await (await fetch('https://pointercrate.com/api/v1/auth/me/', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })).json();

    return res.data.name;
}