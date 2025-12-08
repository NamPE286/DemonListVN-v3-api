/**
 * Custom Geometry Dash API Service
 * Replaces the new-gd.js library with a lightweight custom implementation
 */

const GD_API_URL = 'http://www.boomlings.com/database';
const CORS_PROXY = 'https://www.demonlistvn.com/';

// Difficulty mappings from GD API
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

const LEVEL_LENGTH_MAP: Record<number, string> = {
    0: 'Tiny',
    1: 'Short',
    2: 'Medium',
    3: 'Long',
    4: 'XL',
    5: 'Plat.'
};

/**
 * Parse GD API response string into key-value pairs
 */
function parseGDResponse(data: string, splitter: string = ':'): Record<string, string> {
    const split = data.split(splitter);
    const obj: Record<string, string> = {};
    for (let i = 0; i < split.length; i += 2) {
        obj[split[i]] = split[i + 1];
    }
    return obj;
}

/**
 * Decode GD Base64 string
 */
function gdDecodeBase64(str: string): string {
    if (!str) return '';
    try {
        // GD uses URL-safe base64 variant
        const normalized = str.replace(/_/g, '/').replace(/-/g, '+');
        // Use Buffer in Node.js environment
        return Buffer.from(normalized, 'base64').toString('utf-8');
    } catch (e) {
        return '';
    }
}

/**
 * Get difficulty string from raw values
 */
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

/**
 * Get level length string from raw value
 */
function getLevelLength(raw: number): number {
    return raw;
}

/**
 * Interface for level data returned from GD API
 */
interface GDLevel {
    id: number;
    name: string;
    description: string;
    length: number;
    author: string;
    difficulty: string;
}

/**
 * Fetch level data from Geometry Dash servers
 */
export async function fetchLevelFromGD(levelId: number): Promise<GDLevel> {
    try {
        // Prepare request parameters
        const params = new URLSearchParams({
            levelID: levelId.toString(),
            inc: '1',
            extras: '0',
            secret: 'Wmfd2893gb7'  // Standard GD secret for level downloads
        });

        // Make request to GD API
        const url = `${CORS_PROXY}${GD_API_URL}/downloadGJLevel22.php`;
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
        
        // Check for error response
        if (rawData === '-1' || !rawData) {
            throw new Error(`Level ${levelId} not found`);
        }

        // Parse the response - GD API returns: levelData#userData#songData
        const parts = rawData.split('#');
        const levelData = parts[0];
        const userData = parts[1] || '';
        
        const parsed = parseGDResponse(levelData);

        // Extract level data from parsed response
        // Field mappings based on GD API protocol:
        // 1: Level ID, 2: Level name, 3: Description (base64), 
        // 6: Creator user ID, 15: Length, 9: Difficulty value
        // 17: Is demon (0/1), 25: Is auto (0/1)
        
        const id = parseInt(parsed['1'] || '0');
        const name = parsed['2'] || 'Unknown';
        const description = gdDecodeBase64(parsed['3'] || '');
        const length = parseInt(parsed['15'] || '0');
        
        // Parse user data to get creator username
        // User data format: userID:username:accountID
        let author = 'Unknown';
        if (userData) {
            const userParts = userData.split(':');
            if (userParts.length >= 2) {
                author = userParts[1];
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
    } catch (error) {
        throw new Error(`Failed to fetch level from GD: ${error instanceof Error ? error.message : String(error)}`);
    }
}
