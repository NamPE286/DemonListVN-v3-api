import type { getPlayer } from '@src/services/player.service'
import type { TInventoryItem } from '@src/types'

declare global {
    namespace Express {
        interface Locals {
            user: Awaited<ReturnType<typeof getPlayer>>
            authenticated: boolean
            authType: 'token' | 'key'
            token: string
            item: TInventoryItem
        }
    }
}