export function isSupporterActive(supporterUntil: string | null) {
    if (!supporterUntil) {
        return false;
    }

    return new Date(supporterUntil) > new Date();
}
