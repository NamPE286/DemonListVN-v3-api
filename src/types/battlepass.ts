export interface BattlePassSeason {
    id: number
    created_at: string
    start: string
    end: string | null
    title: string
    description: string | null
}

export interface BattlePassLevel {
    id: number
    seasonID: number
    levelID: number
    created_at: string
}

export interface BattlePassMapPack {
    id: number
    seasonID: number
    packID: number
    created_at: string
}
