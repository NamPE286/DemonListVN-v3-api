import Record from '@lib/classes/Record'
import logger from '@src/utils/logger'

export class SubmissionService {
    async submitRecord(data: any) {
        const record = new Record(data)

        await record.submit()
        logger.notice(`New record submitted! Please check it out.`)
    }
}

export default new SubmissionService()
