import express from 'express'
import userAuth from '@src/middleware/userAuth'
import apiKeyController from '@src/controllers/apiKeyController'

/**
 * @openapi
 * tags:
 *   - name: API Key
 *     description: Endpoints for managing API keys
 */
const router = express.Router()

router.route('/')
    /**
     * @openapi
     * /APIKey:
     *   get:
     *     tags:
     *       - API Key
     *     summary: Get all API keys for the authenticated user
     *     responses:
     *       200:
     *         description: Success - returns an array of API keys
     *       403:
     *         description: Forbidden - API key authentication cannot be used for this endpoint
     *       500:
     *         description: Internal Server Error
     */
    .get(userAuth, apiKeyController.getAllAPIKeys.bind(apiKeyController))
    /**
     * @openapi
     * /APIKey:
     *   post:
     *     tags:
     *       - API Key
     *     summary: Create a new API key for the authenticated user
     *     responses:
     *       200:
     *         description: Success - a new API key has been created
     *       403:
     *         description: Forbidden - API key authentication cannot be used for this endpoint
     *       500:
     *         description: Internal Server Error
     */
    .post(userAuth, apiKeyController.createAPIKey.bind(apiKeyController))

router.route('/:key')
    /**
     * @openapi
     * /APIKey/{key}:
     *   delete:
     *     tags:
     *       - API Key
     *     summary: Delete a specific API key for the authenticated user
     *     parameters:
     *       - name: key
     *         in: path
     *         description: The API key to delete
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success - the API key has been deleted
     *       403:
     *         description: Forbidden - API key authentication cannot be used for this endpoint
     *       500:
     *         description: Internal Server Error
     */
    .delete(userAuth, apiKeyController.deleteAPIKey.bind(apiKeyController))

export default router
