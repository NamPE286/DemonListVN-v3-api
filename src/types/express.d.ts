import type Player from '@src/lib/classes/Player'
import type { TInventoryItem } from '@src/lib/types'

declare global {
    namespace Express {
        interface Locals {
            user?: Player
            authenticated?: boolean
            authType?: 'token' | 'key'
            item?: TInventoryItem
        }
    }
}

export {}
