import { fetchFromGDAPI, parseGDLevel, type GDLevel } from '@src/utils';

export async function fetchLevelFromGD(levelId: number): Promise<GDLevel> {
    try {
        const rawData = await fetchFromGDAPI('getGJLevels21.php', {
            str: levelId.toString(),
            type: '0'
        });

        return parseGDLevel(rawData);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch level ${levelId}: ${message}`);
    }
}

