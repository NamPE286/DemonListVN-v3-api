import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3 } from '@src/lib/classes/s3'
import type Player from '@src/lib/classes/Player'

function extractID(path: string) {
    return path.split('/')[1].split('.')[0]
}

function validate(path: string, user: Player) {
    if (user.isAdmin) {
        return
    }

    if ((path.startsWith('avatars') || path.startsWith('banners')) && user.uid == extractID(path)) {
        return
    }

    if (path.startsWith('clan-photos') && user.clan == parseInt(extractID(path))) {
        return
    }

    throw new Error('Forbidden')
}

export class StorageService {
    async getPresignedUrl(path: string, bucket: string, user: Player) {
        validate(path, user)

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: path
        })

        const url = await getSignedUrl(s3, command, { expiresIn: 60 })

        return url
    }
}

export default new StorageService()
