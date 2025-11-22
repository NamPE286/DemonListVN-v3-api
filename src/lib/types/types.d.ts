import Player from "@src/lib/classes/Player"
import type { TInventoryItem } from '@src/lib/types'

declare global {
  namespace Express {
    interface Locals {
      user: Player,
      authType: 'token' | 'key',
      authenticated: boolean,
      item?: TInventoryItem
    }
  }
}