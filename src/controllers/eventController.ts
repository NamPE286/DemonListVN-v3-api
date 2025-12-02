import { Request, Response } from 'express'
import eventService from '@src/services/eventService'

class EventController {
    async createEvent(req: Request, res: Response) {
        try {
            await eventService.createEvent(req.body)

            res.send()
        } catch (err: any) {
            console.error(err)

            res.status(500).send({
                message: err.message
            })
        }
    }

    async upsertProof(req: Request, res: Response) {
        try {
            const result = await eventService.upsertProof(req.body)

            res.send(result)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async createProof(req: Request, res: Response) {
        try {
            const { user } = res.locals

            req.body.userid = user.uid
            req.body.accepted = false

            const { event, proof } = await eventService.createProof(req.body, parseInt(req.body.eventID))

            if (event.isSupporterOnly && !user.isSupporterActive()) {
                res.status(401).send()
                return
            }

            if (event.isContest && !user.discord) {
                res.status(401).send()
                return
            }

            if (event.end && new Date() >= new Date(event.end)) {
                res.status(401).send()
                return
            }

            res.send(proof)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async submitLevel(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const { levelID } = req.params
            const { progress, password } = req.query

            if (password != process.env.SUBMIT_PASSWORD) {
                res.status(403).send()
                return
            }

            await eventService.submitLevel(user.uid!, parseInt(levelID), Number(progress))

            res.send()
        } catch (err: any) {
            console.error(err)

            if (err.message === 'Level not found in event') {
                res.status(500).send()
                return
            }

            res.status(500).send()
        }
    }

    async checkQuest(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const { questId } = req.params
            const { isCompleted } = await eventService.checkQuest(user.uid, parseInt(questId))

            res.send({ isCompleted })
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async claimQuest(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const { questId } = req.params

            await eventService.claimQuest(user.uid, parseInt(questId))

            res.send()
        } catch (err: any) {
            console.error(err)

            if (err.message === 'Quest already claimed' || err.message === 'Quest not completed') {
                res.status(401).send()
                return
            }

            res.status(500).send()
        }
    }

    async getSubmission(req: Request, res: Response) {
        try {
            const { id } = req.params
            const data = await eventService.getSubmission(parseInt(id))

            res.send(data)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async deleteSubmission(req: Request, res: Response) {
        try {
            const { id } = req.params

            await eventService.deleteSubmission(parseInt(id))

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getEvent(req: Request, res: Response) {
        try {
            const { id } = req.params
            const event = await eventService.getEvent(parseInt(id))

            res.send(event)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async updateEvent(req: Request, res: Response) {
        try {
            const { id } = req.params

            await eventService.updateEvent(parseInt(id), req.body)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async deleteEvent(req: Request, res: Response) {
        try {
            const { id } = req.params

            await eventService.deleteEvent(parseInt(id))

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getEventLevels(req: Request, res: Response) {
        try {
            const { id } = req.params
            const { user } = res.locals
            const levels = await eventService.getEventLevels(parseInt(id), user?.uid)

            res.send(levels)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async upsertEventLevel(req: Request, res: Response) {
        try {
            const { id } = req.params

            req.body.eventID = parseInt(id)

            await eventService.upsertEventLevel(req.body)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async updateEventLevel(req: Request, res: Response) {
        try {
            const { levelID } = req.params

            await eventService.updateEventLevel(parseInt(levelID), req.body)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async deleteEventLevel(req: Request, res: Response) {
        try {
            const { levelID } = req.params

            await eventService.deleteEventLevel(parseInt(levelID))

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getEventSubmissions(req: Request, res: Response) {
        try {
            const { id } = req.params
            const { start, end } = req.query
            const submissions = await eventService.getEventSubmissions(
                parseInt(id),
                start ? Number(start) : 0,
                end ? Number(end) : 50
            )

            res.send(submissions)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async submitRecord(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const { id } = req.params

            const submission = await eventService.submitRecord(user.uid, parseInt(id), req.body)

            res.send(submission)
        } catch (err: any) {
            console.error(err)

            if (err.message === 'Level not in event' || err.message === 'Event has ended') {
                res.status(401).send()
                return
            }

            res.status(500).send()
        }
    }

    async getSubmissionByLevel(req: Request, res: Response) {
        try {
            const { id, levelID } = req.params
            const data = await eventService.getSubmissionByLevel(parseInt(id), parseInt(levelID))

            res.send(data)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async updateSubmission(req: Request, res: Response) {
        try {
            const { user } = res.locals
            const { id, levelID } = req.params

            await eventService.updateSubmission(user.uid, parseInt(id), parseInt(levelID), req.body)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getLeaderboard(req: Request, res: Response) {
        try {
            const { id } = req.params
            const leaderboard = await eventService.getLeaderboard(parseInt(id))

            res.send(leaderboard)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getEventProofs(req: Request, res: Response) {
        try {
            const { id } = req.params
            const { start, end, uid } = req.query
            const proofs = await eventService.getEventProofs(
                parseInt(id),
                start ? Number(start) : 0,
                end ? Number(end) : 50,
                uid as string | undefined
            )

            res.send(proofs)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getEventProof(req: Request, res: Response) {
        try {
            const { id, uid } = req.params
            const proof = await eventService.getEventProof(parseInt(id), uid)

            res.send(proof)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async deleteEventProof(req: Request, res: Response) {
        try {
            const { id, uid } = req.params

            await eventService.deleteEventProof(parseInt(id), uid)

            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async calculateLeaderboard(req: Request, res: Response) {
        try {
            const { id } = req.params
            const leaderboard = await eventService.calculateLeaderboard(parseInt(id))

            res.send(leaderboard)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }

    async getEventQuests(req: Request, res: Response) {
        try {
            const { id } = req.params
            const { user } = res.locals
            const quests = await eventService.getEventQuests(parseInt(id), user?.uid)

            res.send(quests)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    }
}

export default new EventController()
