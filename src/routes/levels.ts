import express from "express"
import levelsController from "@src/controllers/levelsController"

const router = express.Router()

/**
 * @openapi
 * /levels/new:
 *   get:
 *     summary: Retrieve new levels with null ratings, flTop, and insaneTier.
 *     tags:
 *       - Levels
 *     responses:
 *       200:
 *         description: Successfully retrieved levels.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       500:
 *         description: Internal server error.
 */
router.route("/new")
    .get(levelsController.getNewLevels.bind(levelsController))

router.route("/random")
    .get(levelsController.getRandomLevels.bind(levelsController))

export default router
