const GD_API_URL = 'http://www.boomlings.com/database';
const GD_API_SECRET = 'Wmfd2893gb7';

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

function parseGDResponse(data: string, splitter: string = ':'): Record<string, string> {
    const split = data.split(splitter);
    const obj: Record<string, string> = {};
    for (let i = 0; i < split.length - 1; i += 2) {
        if (split[i + 1] !== undefined) {
            obj[split[i]] = split[i + 1];
        }
    }
    return obj;
}

function gdDecodeBase64(str: string): string {
    if (!str) return '';
    try {
        const normalized = str.replace(/_/g, '/').replace(/-/g, '+');

        return Buffer.from(normalized, 'base64').toString('utf-8');
    } catch (e) {
        return '';
    }
}

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

interface GDLevel {
    id: number;
    name: string;
    description: string;
    length: number;
    author: string;
    difficulty: string;
}

export async function fetchLevelFromGD(levelId: number): Promise<GDLevel> {
    try {
        const params = new URLSearchParams({
            levelID: levelId.toString(),
            inc: '1',
            extras: '0',
            secret: GD_API_SECRET
        });

        const url = `${GD_API_URL}/downloadGJLevel22.php`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        if (!response.ok) {
            throw new Error(`GD API request failed with status ${response.status}`);
        }

        const rawData = await response.text();
        
        if (rawData === '-1' || !rawData) {
            throw new Error(`Level ${levelId} not found`);
        }

        const parts = rawData.split('#');
        const levelData = parts[0];
        const userData = parts[1] || '';
        const parsed = parseGDResponse(levelData);
        const id = parseInt(parsed['1'] || '0');
        const name = parsed['2'] || 'Unknown';
        const description = gdDecodeBase64(parsed['3'] || '');
        const length = parseInt(parsed['15'] || '0');
        
        let author = 'Unknown';

        if (userData) {
            const parsedUser = parseGDResponse(userData);
            author = parsedUser['1'] || 'Unknown';
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
    } catch (error) {
        throw new Error(`Failed to fetch level from GD: ${error instanceof Error ? error.message : String(error)}`);
    }
}
