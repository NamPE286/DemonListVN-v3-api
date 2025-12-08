export function isActive(expiryDate: string | null) {
    if (!expiryDate) {
        return false;
    }

    return new Date(expiryDate) > new Date();
}

export function parseGDResponse(data: string, splitter: string = ':'): Record<string, string> {
    const result: Record<string, string> = {};
    const parts = data.split(splitter);

    for (let i = 0; i < parts.length - 1; i += 2) {
        result[parts[i]] = parts[i + 1];
    }

    return result;
}

export function gdDecodeBase64(str: string): string {
    try {
        return Buffer.from(str, 'base64').toString('utf-8');
    } catch {
        return '';
    }
}

export async function fetchFromGDAPI(endpoint: string, params: Record<string, string>): Promise<string> {
    const GD_API_URL = 'http://www.boomlings.com/database';
    const urlParams = new URLSearchParams(params);
    
    const url = `${GD_API_URL}/${endpoint}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: urlParams.toString()
    });

    if (!response.ok) {
        throw new Error(`GD API request failed with status ${response.status}`);
    }

    const rawData = await response.text();
    
    if (rawData === '-1' || !rawData) {
        throw new Error('GD API returned no data');
    }

    return rawData;
}
