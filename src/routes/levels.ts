import express from "express";
import supabase from "@src/database/supabase";

const router = express.Router();

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
    .get(async (req, res) => {
        const { data, error } = await supabase
            .from("levels")
            .select("*")
            .is("rating", null)
            .is("flTop", null)
            .is("insaneTier", null)
            .is("isNonList", false);

        if (error) {
            res.status(500).send();

            return;
        }

        res.send(data);
    });

router.route("/random")
    .get(async (req, res) => {
        const { list, limit } = req.query;
        const { data, error } = await supabase.rpc("get_random_levels", {
            row_count: Number(limit),
            // @ts-ignore
            filter_type: list ? String(list): null,
        });

        if(error) {
            console.error(error);
            res.status(500).send();

            return;
        }

        res.send(data)
    });

export default router;
