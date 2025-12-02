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
    .get((req, res) => levelsController.getNewLevels(req, res))

router.route("/random")
    .get((req, res) => levelsController.getRandomLevels(req, res))

export default router
