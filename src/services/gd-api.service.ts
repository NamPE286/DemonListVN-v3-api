import { fetchFromGDAPI, parseGDLevel, getGDLevelSegment, type GDLevel } from '@src/utils';

const LevelType = {
    SEARCH_QUERY: '0',
    DAILY_HISTORY: '21',
    WEEKLY_HISTORY: '22'
}

export async function getGJLevels21(levelId: number, type = LevelType.SEARCH_QUERY): Promise<GDLevel> {
    try {
        const rawData = await fetchFromGDAPI('getGJLevels21.php', {
            str: levelId.toString(),
            type: type
        });
        const segments = getGDLevelSegment(rawData);

        let res;

        if (segments.length === 1) {
            res = parseGDLevel(segments[0]);
        } else if (segments.length > 1) {
            const match = segments.find(p => parseGDLevel(p).id == levelId);
            res = parseGDLevel(match || segments[0]);
        }

        if (!res) {
            throw new Error("Level does not exists")
        }

        return res;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch level ${levelId}: ${message}`);
    }
}

export async function getGJDailyLevel(weekly: boolean = false) {
    try {
        const rawData = await fetchFromGDAPI('getGJDailyLevel.php', {
            weekly: weekly ? '1' : '0'
        });

        const [index, timeLeft] = rawData.split('|')

        return await getGJLevels21(Number(index), weekly ? LevelType.WEEKLY_HISTORY : LevelType.DAILY_HISTORY)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch daily level: ${message}`);
    }
}