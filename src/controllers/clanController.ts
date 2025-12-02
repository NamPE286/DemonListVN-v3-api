import type { Request, Response } from 'express'
import clanService from '@src/services/clanService'

class ClanController {
    async createClan(req: Request, res: Response) {
        try {
            const { user } = res.locals

            if (user.clan) {
                res.status(500).send()
                return
            }

            if (!user.rating && !user.totalFLpt) {
                res.status(500).send()
                return
            }

            const clan = await clanService.createClan(req.body, user.uid!)

            res.send(clan)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getUserInvitations(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const data = await clanService.getUserInvitations(user.uid!)

            res.send(data)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getClan(req: Request, res: Response) {
        try {
            const { id } = req.params
            const clan = await clanService.getClan(parseInt(id))

            res.send(clan)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async updateClan(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const { id } = req.params

            if (!user.clan) {
                res.status(500).send()
                return
            }

            if (!(await clanService.isOwner(user.uid!, parseInt(id))) && !user.isAdmin) {
                res.status(403).send()
                return
            }

            await clanService.updateClan(parseInt(id), req.body)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async deleteClan(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const { id } = req.params

            if (!user.clan) {
                res.status(500).send()
                return
            }

            if (!(await clanService.isOwner(user.uid!, parseInt(id))) && !user.isAdmin) {
                res.status(403).send()
                return
            }

            await clanService.deleteClan(parseInt(id))

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getClanMembers(req: Request, res: Response) {
        try {
            const { id } = req.params
            const members = await clanService.getClanMembers(parseInt(id), req.query)

            res.send(members)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getClanRecords(req: Request, res: Response) {
        try {
            const { id } = req.params
            const records = await clanService.getClanRecords(parseInt(id), req.query)

            res.send(records)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async invitePlayer(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const { uid } = req.params

            if (!user.clan) {
                res.status(500).send()
                return
            }

            const clan = await clanService.getClan(user.clan)

            if (clan.isPublic || clan.owner == user.uid) {
                await clanService.invitePlayer(user.clan, uid)

                res.send()

                return
            }

            res.status(403).send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async acceptInvitation(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const { id } = req.params

            await clanService.acceptInvitation(user.uid!, parseInt(id))

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async rejectInvitation(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const { id } = req.params

            await clanService.rejectInvitation(user.uid!, parseInt(id))

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async leaveClan(req: Request, res: Response) {
        try {
            const { user } = res.locals

            if (!user.clan) {
                res.status(500).send()
                return
            }

            await clanService.leaveClan(user.uid!, user.clan)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async joinClan(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const { id } = req.params

            if (user.clan) {
                res.status(500).send()
                return
            }

            await clanService.joinClan(user.uid!, parseInt(id))

            res.send()
        } catch (err: any) {
            console.error(err)

            if (err.message === 'Clan is not public') {
                res.status(403).send()
                return
            }

            res.status(500).send()
        }
    }

    async getInvitation(req: Request, res: Response) {
        try {
            const { id, uid } = req.params
            const invitation = await clanService.getInvitation(parseInt(id), uid)

            res.send(invitation)
        } catch (err) {
            console.error(err)
            res.status(404).send()
        }
    }

    async deleteInvitation(req: Request, res: Response) {
        try {
            const { id, uid } = req.params
            const { user } = res.locals
            const clan = await clanService.getClan(parseInt(id))

            if (clan.owner != user.uid) {
                res.status(403).send()
                return
            }

            await clanService.deleteInvitation(parseInt(id), uid)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(404).send()
        }
    }

    async kickMember(req: Request, res: Response) {
        try {
            const { id, uid } = req.params
            const { user } = res.locals
            const clan = await clanService.getClan(parseInt(id))

            if (user.uid == uid) {
                res.status(500).send()
                return
            }

            if (user.uid != clan.owner) {
                res.status(403).send()
                return
            }

            await clanService.kickMember(parseInt(id), uid)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getClanInvitations(req: Request, res: Response) {
        try {
            const { id } = req.params
            const data = await clanService.getClanInvitations(parseInt(id))

            res.send(data)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async banMember(req: Request, res: Response) {
        // Not implemented
        res.send()
    }

    async getClanList(req: Request, res: Response) {
        try {
            const { id, list } = req.params
            const { from, to } = req.query
            const data = await clanService.getClanList(
                parseInt(id),
                list,
                from ? Number(from) : 0,
                to ? Number(to) : 49
            )

            res.send(data)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }
}

export default new ClanController()
