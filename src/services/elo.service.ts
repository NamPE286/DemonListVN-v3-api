interface Elo {
    elo: number;
    point: number;
    penalty: number;
    matchCount: number;
}

interface Diff {
    userID: string
    elo: number
    matchCount: number
    point: number
    diff: number
}

const getK = (count: number): number => {
    if (count < 5) {
        return 40;
    } else if (count < 15) {
        return 20;
    } else {
        return 10;
    }
};

export const calcElo = (playerA: Elo, playerB: Elo): { newPlayerA: Elo, newPlayerB: Elo } => {
    const kA = getK(playerA.matchCount);
    const kB = getK(playerB.matchCount);

    const eloA = playerA.elo;
    const eloB = playerB.elo;

    let scoreA: number, scoreB: number;
    if (playerA.point > playerB.point) {
        scoreA = 1; scoreB = 0;
    } else if (playerA.point < playerB.point) {
        scoreA = 0; scoreB = 1;
    } else {
        if (playerA.penalty < playerB.penalty) {
            scoreA = 1; scoreB = 0;
        } else if (playerA.penalty > playerB.penalty) {
            scoreA = 0; scoreB = 1;
        } else {
            scoreA = 0.5; scoreB = 0.5;
        }
    }

    const expectedScoreA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
    const expectedScoreB = 1 / (1 + Math.pow(10, (eloA - eloB) / 400));

    const newEloA = eloA + kA * (scoreA - expectedScoreA);
    const newEloB = eloB + kB * (scoreB - expectedScoreB);

    const newPlayerA: Elo = { ...playerA, elo: Math.round(newEloA) };
    const newPlayerB: Elo = { ...playerB, elo: Math.round(newEloB) };

    return { newPlayerA, newPlayerB };
};

export function calcLeaderboard(players: any[]): Diff[] {
    const data = structuredClone(players)

    for (const i of data) {
        i.diff = 0
    }

    for (let i = 0; i < data.length; i++) {
        for (let j = i + 1; j < data.length; j++) {
            const tmp = calcElo(data[i], data[j]);

            data[i].elo = tmp.newPlayerA.elo
            data[j].elo = tmp.newPlayerB.elo
        }
    }

    for (let i = 0; i < data.length; i++) {
        data[i].elo = Math.max(500, data[i].elo);
    }

    for (let i = 0; i < data.length; i++) {
        const diffLimit = 200;

        data[i].diff = data[i].elo - players[i].elo;

        if (Math.abs(data[i].diff) > diffLimit) {
            data[i].diff = Math.sign(data[i].diff) * diffLimit;
            data[i].elo = players[i].elo + data[i].diff;
        }
    }

    return data;
}