import Player from "@src/lib/classes/Player"

declare global {
  namespace Express {
    interface Locals {
      user: Player,
      authType: 'token' | 'key',
      authenticated: boolean
    }
  }
}