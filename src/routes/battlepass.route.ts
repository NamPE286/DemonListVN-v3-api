import express from 'express'
import userAuth from '@src/middleware/user-auth.middleware'
import adminAuth from '@src/middleware/admin-auth.middleware'
import optionalUserAuth from '@src/middleware/optional-user-auth.middleware'
import {
    getActiveseason,
    getSeason,
    createSeason,
    updateSeason,
    archiveSeason,
    getPlayerProgress,
    addXp,
    upgradeToPremium,
    getSeasonLevels,
    addSeasonLevel,
    updateSeasonLevel,
    deleteSeasonLevel,
    getSeasonMapPacks,
    getAllSeasonMapPacks,
    getBattlePassMapPack,
    addBattlePassMapPack,
    updateBattlePassMapPack,
    deleteBattlePassMapPack,
    getPlayerMapPackProgress,
    claimMapPackReward,
    getTierRewards,
    createTierReward,
    deleteTierReward,
    claimTierReward,
    getClaimableRewards,
    getSeasonMissions,
    getMission,
    createMission,
    updateMission,
    deleteMission,
    addMissionReward,
    removeMissionReward,
    claimMission,
    getPlayerMissionStatus,
    updateLevelProgressWithMissionCheck,
    getPlayerLevelProgress,
    getPlayerSubscriptions,
    addPlayerSubscription,
    hasBattlePassPremium
} from '@src/services/battlepass.service'

const router = express.Router()

/**
 * @openapi
 * "/battlepass":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get active battle pass season
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *       404:
 *         description: No active season
 */
router.route('/')
    .get(optionalUserAuth, async (req, res) => {
        try {
            const season = await getActiveseason()
            if (!season) {
                res.status(404).send({ message: 'No active season' })
                return
            }
            
            const { user, authenticated } = res.locals
            let isPremium = false
            
            if (authenticated && user) {
                isPremium = await hasBattlePassPremium(user.uid!, season.id)
            }
            
            res.send({ ...season, isPremium })
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/battlepass/season":
 *   post:
 *     tags:
 *       - Battle Pass
 *     summary: Create a new battle pass season (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               start:
 *                 type: string
 *               end:
 *                 type: string
 *     responses:
 *       200:
 *         description: Season created successfully
 *       500:
 *         description: Internal server error
 */
router.route('/season')
    .post(adminAuth, async (req, res) => {
        try {
            const season = await createSeason(req.body)
            res.send(season)
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })

/**
 * @openapi
 * "/battlepass/season/{id}":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get a specific battle pass season
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Season ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 *   patch:
 *     tags:
 *       - Battle Pass
 *     summary: Update a battle pass season (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Season ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Season updated successfully
 *       500:
 *         description: Internal server error
 */
router.route('/season/:id')
    .get(optionalUserAuth, async (req, res) => {
        const { id } = req.params
        try {
            const season = await getSeason(Number(id))
            
            const { user, authenticated } = res.locals
            let isPremium = false
            
            if (authenticated && user) {
                isPremium = await hasBattlePassPremium(user.uid!, season.id)
            }
            
            res.send({ ...season, isPremium })
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })
    .patch(adminAuth, async (req, res) => {
        const { id } = req.params
        try {
            await updateSeason(Number(id), req.body)
            res.send()
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })

/**
 * @openapi
 * "/battlepass/season/{id}/archive":
 *   post:
 *     tags:
 *       - Battle Pass
 *     summary: Archive a battle pass season (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Season ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Season archived successfully
 *       500:
 *         description: Internal server error
 */
router.route('/season/:id/archive')
    .post(adminAuth, async (req, res) => {
        const { id } = req.params
        try {
            await archiveSeason(Number(id))
            res.send()
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })

/**
 * @openapi
 * "/battlepass/progress":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get current user's battle pass progress
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: No active season
 *       500:
 *         description: Internal server error
 */
router.route('/progress')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        try {
            const season = await getActiveseason()
            if (!season) {
                res.status(404).send({ message: 'No active season' })
                return
            }
            const progress = await getPlayerProgress(season.id, user.uid!)
            res.send(progress)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/battlepass/progress/{seasonId}":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get current user's battle pass progress for a specific season
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: seasonId
 *         in: path
 *         description: Season ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */
router.route('/progress/:seasonId')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        const { seasonId } = req.params
        try {
            const progress = await getPlayerProgress(Number(seasonId), user.uid!)
            res.send(progress)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/battlepass/upgrade":
 *   post:
 *     tags:
 *       - Battle Pass
 *     summary: Upgrade to premium battle pass (Admin only - typically called after payment)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seasonId:
 *                 type: integer
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Upgraded successfully
 *       500:
 *         description: Internal server error
 */
router.route('/upgrade')
    .post(adminAuth, async (req, res) => {
        const { seasonId, userId } = req.body
        try {
            await upgradeToPremium(Number(seasonId), userId)
            res.send()
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })

/**
 * @openapi
 * "/battlepass/levels":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get active season's levels
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: No active season
 */
router.route('/levels')
    .get(async (req, res) => {
        try {
            const season = await getActiveseason()
            if (!season) {
                res.status(404).send({ message: 'No active season' })
                return
            }
            const levels = await getSeasonLevels(season.id)
            res.send(levels)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/battlepass/season/{id}/levels":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get levels for a specific season
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Season ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 *   post:
 *     tags:
 *       - Battle Pass
 *     summary: Add a level to a season (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Season ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               levelID:
 *                 type: integer
 *               xp:
 *                 type: integer
 *               minProgressXp:
 *                 type: integer
 *               minProgress:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Level added successfully
 *       500:
 *         description: Internal server error
 */
router.route('/season/:id/levels')
    .get(async (req, res) => {
        const { id } = req.params
        try {
            const levels = await getSeasonLevels(Number(id))
            res.send(levels)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })
    .post(adminAuth, async (req, res) => {
        const { id } = req.params
        try {
            const level = await addSeasonLevel({
                seasonId: Number(id),
                ...req.body
            })
            res.send(level)
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })

/**
 * @openapi
 * "/battlepass/level/{levelId}":
 *   patch:
 *     tags:
 *       - Battle Pass
 *     summary: Update a season level (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: levelId
 *         in: path
 *         description: Battle Pass Level ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Level updated successfully
 *       500:
 *         description: Internal server error
 *   delete:
 *     tags:
 *       - Battle Pass
 *     summary: Delete a season level (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: levelId
 *         in: path
 *         description: Battle Pass Level ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Level deleted successfully
 *       500:
 *         description: Internal server error
 */
router.route('/level/:levelId')
    .patch(adminAuth, async (req, res) => {
        const { levelId } = req.params
        try {
            await updateSeasonLevel(Number(levelId), req.body)
            res.send()
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })
    .delete(adminAuth, async (req, res) => {
        const { levelId } = req.params
        try {
            await deleteSeasonLevel(Number(levelId))
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/battlepass/levels/{levelId}/progress":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get user's progress on a specific level
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: levelId
 *         in: path
 *         description: Battle Pass Level ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */
const DEFAULT_LEVEL_PROGRESS = { progress: 0, minProgressClaimed: false, completionClaimed: false };

router.route('/levels/:levelId/progress')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        const { levelId } = req.params
        try {
            const progress = await getPlayerLevelProgress(Number(levelId), user.uid!)
            res.send(progress || DEFAULT_LEVEL_PROGRESS)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/battlepass/mappacks":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get active season's unlocked map packs
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: No active season
 */
router.route('/mappacks')
    .get(async (req, res) => {
        try {
            const season = await getActiveseason()
            if (!season) {
                res.status(404).send({ message: 'No active season' })
                return
            }
            const mapPacks = await getSeasonMapPacks(season.id)
            res.send(mapPacks)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/battlepass/season/{id}/mappacks":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get all map packs for a season (Admin gets all, users get unlocked only)
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Season ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 *   post:
 *     tags:
 *       - Battle Pass
 *     summary: Create a map pack for a season (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Season ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easier, harder, medium_demon, insane_demon]
 *               xp:
 *                 type: integer
 *               unlockWeek:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Map pack created successfully
 *       500:
 *         description: Internal server error
 */
router.route('/season/:id/mappacks')
    .get(optionalUserAuth, async (req, res) => {
        const { id } = req.params
        const { user, authenticated } = res.locals
        
        try {
            if (authenticated && user?.isAdmin) {
                const mapPacks = await getAllSeasonMapPacks(Number(id))
                res.send(mapPacks)
            } else {
                const mapPacks = await getSeasonMapPacks(Number(id))
                res.send(mapPacks)
            }
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })
    .post(adminAuth, async (req, res) => {
        const { id } = req.params
        try {
            const bpMapPack = await addBattlePassMapPack({
                seasonId: Number(id),
                ...req.body
            })
            res.send(bpMapPack)
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })

/**
 * @openapi
 * "/battlepass/mappack/{mapPackId}":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get a specific battle pass map pack
 *     parameters:
 *       - name: mapPackId
 *         in: path
 *         description: Battle Pass Map Pack ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 *   patch:
 *     tags:
 *       - Battle Pass
 *     summary: Update a battle pass map pack (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: mapPackId
 *         in: path
 *         description: Battle Pass Map Pack ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Map pack updated successfully
 *       500:
 *         description: Internal server error
 *   delete:
 *     tags:
 *       - Battle Pass
 *     summary: Delete a battle pass map pack (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: mapPackId
 *         in: path
 *         description: Battle Pass Map Pack ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Map pack deleted successfully
 *       500:
 *         description: Internal server error
 */
router.route('/mappack/:mapPackId')
    .get(async (req, res) => {
        const { mapPackId } = req.params
        try {
            const bpMapPack = await getBattlePassMapPack(Number(mapPackId))
            res.send(bpMapPack)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })
    .patch(adminAuth, async (req, res) => {
        const { mapPackId } = req.params
        try {
            await updateBattlePassMapPack(Number(mapPackId), req.body)
            res.send()
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })
    .delete(adminAuth, async (req, res) => {
        const { mapPackId } = req.params
        try {
            await deleteBattlePassMapPack(Number(mapPackId))
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/battlepass/mappack/{mapPackId}/progress":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get user's progress on a map pack
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: mapPackId
 *         in: path
 *         description: Battle Pass Map Pack ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 */
router.route('/mappack/:mapPackId/progress')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        const { mapPackId } = req.params
        try {
            const progress = await getPlayerMapPackProgress(Number(mapPackId), user.uid!)
            res.send(progress || { completedLevels: [], claimed: false })
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/battlepass/mappack/{mapPackId}/claim":
 *   post:
 *     tags:
 *       - Battle Pass
 *     summary: Claim XP reward for completing a map pack
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: mapPackId
 *         in: path
 *         description: Map Pack ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: XP claimed successfully
 *       400:
 *         description: Map pack not completed or already claimed
 *       500:
 *         description: Internal server error
 */
router.route('/mappack/:mapPackId/claim')
    .post(userAuth, async (req, res) => {
        const { user } = res.locals
        const { mapPackId } = req.params
        try {
            const xp = await claimMapPackReward(Number(mapPackId), user.uid!)
            res.send({ xp })
        } catch (err: any) {
            console.error(err)
            if (err.message === 'Already claimed' || 
                err.message === 'Map pack not completed' ||
                err.message === 'Season is not active') {
                res.status(400).send({ message: err.message })
            } else {
                res.status(500).send({ message: err.message })
            }
        }
    })

/**
 * @openapi
 * "/battlepass/rewards":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get active season's tier rewards
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: No active season
 */
router.route('/rewards')
    .get(async (req, res) => {
        try {
            const season = await getActiveseason()
            if (!season) {
                res.status(404).send({ message: 'No active season' })
                return
            }
            const rewards = await getTierRewards(season.id)
            res.send(rewards)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/battlepass/season/{id}/rewards":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get tier rewards for a specific season
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Season ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 *   post:
 *     tags:
 *       - Battle Pass
 *     summary: Create a tier reward (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Season ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tier:
 *                 type: integer
 *               isPremium:
 *                 type: boolean
 *               itemId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reward created successfully
 *       500:
 *         description: Internal server error
 */
router.route('/season/:id/rewards')
    .get(async (req, res) => {
        const { id } = req.params
        try {
            const rewards = await getTierRewards(Number(id))
            res.send(rewards)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })
    .post(adminAuth, async (req, res) => {
        const { id } = req.params
        try {
            const reward = await createTierReward({
                seasonId: Number(id),
                ...req.body
            })
            res.send(reward)
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })

/**
 * @openapi
 * "/battlepass/reward/{rewardId}":
 *   delete:
 *     tags:
 *       - Battle Pass
 *     summary: Delete a tier reward (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: rewardId
 *         in: path
 *         description: Reward ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reward deleted successfully
 *       500:
 *         description: Internal server error
 */
router.route('/reward/:rewardId')
    .delete(adminAuth, async (req, res) => {
        const { rewardId } = req.params
        try {
            await deleteTierReward(Number(rewardId))
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/battlepass/reward/{rewardId}/claim":
 *   post:
 *     tags:
 *       - Battle Pass
 *     summary: Claim a tier reward
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: rewardId
 *         in: path
 *         description: Reward ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reward claimed successfully
 *       400:
 *         description: Already claimed, tier not reached, or premium required
 *       500:
 *         description: Internal server error
 */
router.route('/reward/:rewardId/claim')
    .post(userAuth, async (req, res) => {
        const { user } = res.locals
        const { rewardId } = req.params
        try {
            const reward = await claimTierReward(Number(rewardId), user.uid!)
            res.send(reward)
        } catch (err: any) {
            console.error(err)
            if (err.message === 'Already claimed' || 
                err.message === 'Tier not reached' || 
                err.message === 'Premium required' ||
                err.message === 'Season is not active') {
                res.status(400).send({ message: err.message })
            } else {
                res.status(500).send({ message: err.message })
            }
        }
    })

/**
 * @openapi
 * "/battlepass/rewards/claimable":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get all claimable rewards for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: No active season
 *       500:
 *         description: Internal server error
 */
router.route('/rewards/claimable')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        try {
            const season = await getActiveseason()
            if (!season) {
                res.status(404).send({ message: 'No active season' })
                return
            }
            const rewards = await getClaimableRewards(season.id, user.uid!)
            res.send(rewards)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/battlepass/xp/add":
 *   post:
 *     tags:
 *       - Battle Pass
 *     summary: Add XP to a user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seasonId:
 *                 type: integer
 *               userId:
 *                 type: string
 *               xp:
 *                 type: integer
 *     responses:
 *       200:
 *         description: XP added successfully
 *       500:
 *         description: Internal server error
 */
router.route('/xp/add')
    .post(adminAuth, async (req, res) => {
        const { seasonId, userId, xp } = req.body
        try {
            const result = await addXp(Number(seasonId), userId, Number(xp))
            res.send(result)
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })

// ==================== Mission Routes ====================

/**
 * @openapi
 * "/battlepass/missions":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get active season's missions with user status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: No active season
 */
router.route('/missions')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        try {
            const season = await getActiveseason()
            if (!season) {
                res.status(404).send({ message: 'No active season' })
                return
            }
            const missions = await getPlayerMissionStatus(season.id, user.uid!)
            res.send(missions)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/battlepass/season/{id}/missions":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get missions for a specific season
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Season ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 *   post:
 *     tags:
 *       - Battle Pass
 *     summary: Create a mission for a season (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Season ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               condition:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [clear_level, clear_mappack, reach_tier, earn_xp, clear_level_count, clear_mappack_count]
 *                     value:
 *                       type: integer
 *                     targetId:
 *                       type: integer
 *               xp:
 *                 type: integer
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Mission created successfully
 *       500:
 *         description: Internal server error
 */
router.route('/season/:id/missions')
    .get(async (req, res) => {
        const { id } = req.params
        try {
            const missions = await getSeasonMissions(Number(id))
            res.send(missions)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })
    .post(adminAuth, async (req, res) => {
        const { id } = req.params
        try {
            const mission = await createMission({
                seasonId: Number(id),
                ...req.body
            })
            res.send(mission)
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })

/**
 * @openapi
 * "/battlepass/mission/{missionId}":
 *   get:
 *     tags:
 *       - Battle Pass
 *     summary: Get a specific mission
 *     parameters:
 *       - name: missionId
 *         in: path
 *         description: Mission ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal server error
 *   patch:
 *     tags:
 *       - Battle Pass
 *     summary: Update a mission (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: missionId
 *         in: path
 *         description: Mission ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Mission updated successfully
 *       500:
 *         description: Internal server error
 *   delete:
 *     tags:
 *       - Battle Pass
 *     summary: Delete a mission (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: missionId
 *         in: path
 *         description: Mission ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mission deleted successfully
 *       500:
 *         description: Internal server error
 */
router.route('/mission/:missionId')
    .get(async (req, res) => {
        const { missionId } = req.params
        try {
            const mission = await getMission(Number(missionId))
            res.send(mission)
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })
    .patch(adminAuth, async (req, res) => {
        const { missionId } = req.params
        try {
            await updateMission(Number(missionId), req.body)
            res.send()
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })
    .delete(adminAuth, async (req, res) => {
        const { missionId } = req.params
        try {
            await deleteMission(Number(missionId))
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

/**
 * @openapi
 * "/battlepass/mission/{missionId}/claim":
 *   post:
 *     tags:
 *       - Battle Pass
 *     summary: Claim a completed mission reward
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: missionId
 *         in: path
 *         description: Mission ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mission reward claimed successfully
 *       400:
 *         description: Already claimed or mission not completed
 *       500:
 *         description: Internal server error
 */
router.route('/mission/:missionId/claim')
    .post(userAuth, async (req, res) => {
        const { user } = res.locals
        const { missionId } = req.params
        try {
            const mission = await claimMission(Number(missionId), user.uid!)
            res.send(mission)
        } catch (err: any) {
            console.error(err)
            if (err.message === 'Already claimed' || 
                err.message === 'Mission not completed' ||
                err.message === 'Season is not active') {
                res.status(400).send({ message: err.message })
            } else {
                res.status(500).send({ message: err.message })
            }
        }
    })

/**
 * @openapi
 * "/battlepass/mission/{missionId}/reward":
 *   post:
 *     tags:
 *       - Battle Pass
 *     summary: Add a reward to a mission (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: missionId
 *         in: path
 *         description: Mission ID
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               expireAfter:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Reward added successfully
 *       500:
 *         description: Internal server error
 */
router.route('/mission/:missionId/reward')
    .post(adminAuth, async (req, res) => {
        const { missionId } = req.params
        const { itemId, quantity, expireAfter } = req.body
        try {
            const reward = await addMissionReward(
                Number(missionId),
                Number(itemId),
                Number(quantity) || 1,
                expireAfter ? Number(expireAfter) : null
            )
            res.send(reward)
        } catch (err: any) {
            console.error(err)
            res.status(500).send({ message: err.message })
        }
    })

/**
 * @openapi
 * "/battlepass/mission/{missionId}/reward/{rewardId}":
 *   delete:
 *     tags:
 *       - Battle Pass
 *     summary: Remove a reward from a mission (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: missionId
 *         in: path
 *         description: Mission ID
 *         required: true
 *         schema:
 *           type: integer
 *       - name: rewardId
 *         in: path
 *         description: Reward ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reward removed successfully
 *       500:
 *         description: Internal server error
 */
router.route('/mission/:missionId/reward/:rewardId')
    .delete(adminAuth, async (req, res) => {
        const { rewardId } = req.params
        try {
            await removeMissionReward(Number(rewardId))
            res.send()
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router
