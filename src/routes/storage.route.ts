import userAuth from '@src/middleware/user-auth.middleware'
import express from 'express'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from '@src/client/s3';
import type { getPlayer } from '@src/services/player.service';

type Player = Awaited<ReturnType<typeof getPlayer>>;

function extractID(path: string) {
    return path.split('/')[1].split('.')[0]
}

function validate(path: string, user: Player) {
    if (user.isAdmin) {
        return;
    }
    
    if ((path.startsWith('avatars') || path.startsWith('banners')) && user.uid == extractID(path)) {
        return;
    }

    if (path.startsWith('clan-photos') && user.clan == parseInt(extractID(path))) {
        return;
    }

    throw new Error('Forbidden')
}

const router = express.Router()

router.route('/presign')
    .get(userAuth, async (req, res) => {
        const { user } = res.locals
        const { path } = req.query as { path: string }
        let { bucket } = req.query as { bucket?: string }

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
            Bucket: bucket,
            Key: path
        })

        try {
            validate(path, user)
        } catch {
            res.status(403).send()
            return
        }

        try {
            res.send(await getSignedUrl(s3, command, { expiresIn: 60 }));
        } catch (err) {
            console.error(err);
            res.status(500).send();
        }
    })

export default router