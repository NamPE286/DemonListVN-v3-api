import type { Request, Response } from 'express'
import authService from '@src/services/authService'
import { FRONTEND_URL } from '@src/lib/constants'

export class AuthController {
    async handleDiscordCallback(req: Request, res: Response) {
        const { code } = req.query

        try {
            const accessToken = await authService.handleDiscordCallback(String(code))

            res.redirect(`${FRONTEND_URL}/link/discord?token=${accessToken}`)
        } catch (error: any) {
            console.error(error)
            res.status(401).send({ message: error.message })
        }
    }

    async linkDiscord(req: Request, res: Response) {
        const { user } = res.locals
        const { token } = req.body

        try {
            await authService.linkDiscord(user, String(token))

            res.send()
        } catch (error: any) {
            console.error(error)
            res.status(401).send({ message: error.message })
        }
    }

    async linkPointercrate(req: Request, res: Response) {
        const { user } = res.locals
        const { token } = req.body

        try {
            await authService.linkPointercrate(user.uid!, token)

            res.send()
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    }
}

export default new AuthController()
