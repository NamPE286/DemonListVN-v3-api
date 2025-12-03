import type Player from '@src/classes/Player'
import type { TInventoryItem } from '@src/types'

declare global {
    namespace Express {
        interface Locals {
            user: Player
            authenticated: boolean
            authType: 'token' | 'key'
            item: TInventoryItem
        }
    }
}