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

export const GD_API_SECRET = 'Wmfd2893gb7';

export async function fetchFromGDAPI(endpoint: string, params: Record<string, string>): Promise<string> {
    const GD_API_URL = 'http://www.boomlings.com/database';
    const urlParams = new URLSearchParams({
        ...params,
        secret: GD_API_SECRET
    });
    
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

const DIFFICULTY_MAP: Record<number, string> = {
    [-1]: 'N/A',
    0: 'Auto',
    1: 'Easy',
    2: 'Normal',
    3: 'Hard',
    4: 'Harder',
    5: 'Insane'
};

const DEMON_DIFFICULTY_MAP: Record<number, string> = {
    0: 'Any',
    1: 'Easy Demon',
    2: 'Medium Demon',
    3: 'Hard Demon',
    4: 'Insane Demon',
    5: 'Extreme Demon'
};

function getDifficulty(diff: number, isDemon: boolean, isAuto: boolean): string {
    if (isAuto) {
        return 'Auto';
    }

    if (isDemon) {
        const raw = diff === 0 ? 0 : diff / 10;
        return DEMON_DIFFICULTY_MAP[raw] || 'Any';
    }

    const raw = diff === 0 ? -1 : diff / 10;
    return DIFFICULTY_MAP[raw] || 'N/A';
}

export interface GDLevel {
    id: number;
    name: string;
    description: string;
    length: number;
    author: string;
    difficulty: string;
}

export function parseGDLevel(rawData: string): GDLevel {
    const parts = rawData.split('#');
    const levelData = parts[0];
    const creatorData = parts[1] || '';
    const parsed = parseGDResponse(levelData);

    const id = parseInt(parsed['1'] || '0');
    const name = parsed['2'] || 'Unknown';
    const description = gdDecodeBase64(parsed['3'] || '');
    const length = parseInt(parsed['15'] || '0');

    let author = 'Unknown';
    const creatorId = parsed['6'];

    if (creatorData && creatorId) {
        const creators = creatorData.split('|');
        for (const creator of creators) {
            const creatorParts = creator.split(':');
            if (creatorParts[0] === creatorId && creatorParts.length >= 2) {
                author = creatorParts[1];
                break;
            }
        }
    }

    const diffValue = parseInt(parsed['9'] || '0');
    const isDemon = parsed['17'] === '1';
    const isAuto = parsed['25'] === '1';
    const difficulty = getDifficulty(diffValue, isDemon, isAuto);

    return {
        id,
        name,
        description,
        length,
        author,
        difficulty
    };
}
