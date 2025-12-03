import type { TPlayer, TInventoryItem } from '@src/types'

declare global {
    namespace Express {
        interface Locals {
            user: TPlayer
            authenticated: boolean
            authType: 'token' | 'key'
            item: TInventoryItem
        }
    }
}