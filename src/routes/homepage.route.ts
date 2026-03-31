import express from 'express'
import { getOngoingEvents } from '@src/services/event.service'
import { getTopBuyers, getSupporterRevenueProgress } from '@src/services/player.service'
import { getClans } from '@src/services/clan.service'
import { getCommunityPosts } from '@src/services/community.service'
import { getPlayerProgress, hasBattlePassPremium, fetchActiveSeason } from '@src/services/battlepass.service'
import { fetchLevels } from '@src/services/level.service'
import optionalUserAuth from '@src/middleware/optional-user-auth.middleware'
import supabase from '@src/client/supabase'

const router = express.Router()

router.route('/')
    .get(optionalUserAuth, async (req, res) => {
        try {
            const [
                events,
                topSupporters,
                serverProgress,
                topClans,
                communityPosts,
                dlLevels,
                flLevels,
                plLevels,
                clLevels,
                activeSeason
            ] = await Promise.all([
                getOngoingEvents().catch(() => []),
                getTopBuyers(2592000000, 3, 0).catch(() => []),
                getSupporterRevenueProgress(2592000000).catch(() => ({ serverCostPercent: 0, minecraftServerPercent: 0 })),
                getClans({ start: 0, end: 4, sortBy: 'memberCount', ascending: 'false' }).catch(() => []),
                getCommunityPosts({ limit: 3, offset: 0, sortBy: 'createdAt', ascending: false, clanId: null }).catch(() => []),
                fetchLevels('dl'),
                fetchLevels('fl'),
                fetchLevels('pl'),
                fetchLevels('cl'),
                fetchActiveSeason()
            ])

            const publicData = {
                events,
                topSupporters,
                serverProgress,
                topClans,
                communityPosts,
                levels: {
                    dl: dlLevels,
                    fl: flLevels,
                    pl: plLevels,
                    cl: clLevels
                },
                activeSeason
            }

            // If user is authenticated and there's an active season, fetch their BP progress
            let battlepassProgress = null
            if (res.locals.authenticated && res.locals.user && publicData.activeSeason) {
                try {
                    battlepassProgress = await getPlayerProgress(publicData.activeSeason.id, res.locals.user.uid!)
                } catch {}
            }

            res.send({
                ...publicData,
                battlepassProgress
            })
        } catch (err) {
            console.error('Homepage data error:', err)
            res.status(500).send()
        }
    })

export default router
