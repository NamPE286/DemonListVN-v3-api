import express from 'express'
import supabase from '@src/client/supabase'
import adminAuth from '@src/middleware/admin-auth.middleware'

const router = express.Router()

router.route('/')
    /**
     * @openapi
     * "/refresh":
     *   patch:
     *     tags:
     *       - Others
    *     summary: Recalculate pending record queue numbers
     *     responses:
     *       200:
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     */
    .patch(adminAuth, async (req, res) => {
        const { error } = await (supabase as any).rpc('calculate_record_queue_no')

        if (error) {
            console.error(error)
            res.status(500).send()
            return
        }

        res.send()
    })

router.route('/contest-rating')
    .patch(adminAuth, async (req, res) => {
        const { error: resetPlayersError } = await supabase
            .from('players')
            .update({
                elo: 1500,
                matchCount: 0
            })
            .not('uid', 'is', null)

        if (resetPlayersError) {
            console.error(resetPlayersError)
            res.status(500).send({
                message: resetPlayersError.message
            })
            return
        }

        const { data: contestDiffs, error: contestDiffsError } = await supabase
            .from('eventProofs')
            .select('userid, diff, events!inner(isContest, isRanked)')
            .not('diff', 'is', null)
            .eq('events.isContest', true)
            .eq('events.isRanked', true)

        if (contestDiffsError) {
            console.error(contestDiffsError)
            res.status(500).send({
                message: contestDiffsError.message
            })
            return
        }

        const recalculatedPlayers = new Map<string, { elo: number, matchCount: number }>()

        for (const item of contestDiffs || []) {
            if (item.diff === null) {
                continue
            }

            const current = recalculatedPlayers.get(item.userid) || {
                elo: 1500,
                matchCount: 0
            }

            current.elo += item.diff
            current.matchCount += 1

            recalculatedPlayers.set(item.userid, current)
        }

        if (recalculatedPlayers.size > 0) {
            const { error: applyContestDiffsError } = await supabase
                .from('players')
                .upsert(Array.from(recalculatedPlayers.entries()).map(([uid, value]) => ({
                    uid,
                    elo: value.elo,
                    matchCount: value.matchCount
                })))

            if (applyContestDiffsError) {
                console.error(applyContestDiffsError)
                res.status(500).send({
                    message: applyContestDiffsError.message
                })
                return
            }
        }

        res.send({
            affectedPlayers: recalculatedPlayers.size,
            proofCount: contestDiffs?.length || 0
        })
    })

export default router