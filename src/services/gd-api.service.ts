import { parseGDResponse, gdDecodeBase64, fetchFromGDAPI } from '@src/utils';

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
        const rawData = await fetchFromGDAPI('getGJLevels21.php', {
            str: levelId.toString(),
            type: '0',
            secret: GD_API_SECRET
        });

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
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch level ${levelId}: ${message}`);
    }
}

