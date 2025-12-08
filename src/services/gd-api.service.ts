import { fetchFromGDAPI, parseGDLevel, type GDLevel } from '@src/utils';

const GD_API_SECRET = 'Wmfd2893gb7';

export async function fetchLevelFromGD(levelId: number): Promise<GDLevel> {
    try {
        const rawData = await fetchFromGDAPI('getGJLevels21.php', {
            str: levelId.toString(),
            type: '0',
            secret: GD_API_SECRET
        });

        return parseGDLevel(rawData);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch level ${levelId}: ${message}`);
    }
}

