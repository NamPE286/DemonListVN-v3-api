import userAuth from '@src/middleware/userAuth'
import express from 'express'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from '@src/lib/classes/s3';

const router = express.Router()

router.route('/presign')
    .get(userAuth, async (req, res) => {
        const { path } = req.query
        let { bucket } = req.query

        if (!bucket) {
            bucket = 'cdn'
        }

        if (!path) {
            res.status(400).send({
                message: 'Missing file path'
            })

            return
        }

        const command = new PutObjectCommand({
            Bucket: String(bucket),
            Key: String(path)
        })

        // TODO: Auth for different path

        try {
            res.send(await getSignedUrl(s3, command, { expiresIn: 120 }))
        } catch (err) {
            console.error(err)
            res.status(500).send()
        }
    })

export default router