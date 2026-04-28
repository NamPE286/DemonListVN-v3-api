import {
    assertLevelTypeMatchesList,
    canReviewCustomListSubmissions,
    ensureLevelExists,
    getCustomListAccess,
    getRequiredActorUid,
    sanitizeSubmissionComment,
    sanitizeSubmissionPosition,
    syncLevelCount,
    touchCustomListActivity
} from './list-access.service'
import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
    appendCustomListAuditLog,
    getCustomListRow,
    getPlayersByUid,
    requireLevelId,
    sanitizeCustomListVideoId,
    sanitizeMinProgress,
    sanitizeRating,
    sendNotification,
    supabase
} from './list.common'
import type {
    CustomList,
    CustomListActor,
    CustomListLevelInsert,
    CustomListSubmission
} from './list.common'

import { getCustomList } from './list.service'

export async function getCustomListSubmissionQueue(listId: number, actor: CustomListActor) {
    const list = await getCustomListRow(listId)
    const access = await getCustomListAccess(list, actor)

    if (!canReviewCustomListSubmissions(list, access)) {
        throw new ForbiddenError('You do not have permission to review submissions on this list')
    }

    const { data: submissions, error } = await supabase
        .from('listLevels')
        .select('id, created_at, listId, levelId, addedBy, rating, position, minProgress, videoID, accepted, submissionComment')
        .eq('listId', listId)
        .eq('accepted', false)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    const entries = (submissions || []) as CustomListSubmission[]

    if (!entries.length) {
        return [] as CustomListSubmission[]
    }

    const levelIds = [...new Set(entries.map((entry) => entry.levelId))]
    const submitterUids = [...new Set(entries.map((entry) => entry.addedBy).filter(Boolean))]

    const [levelsResult, submittersByUid] = await Promise.all([
        supabase
            .from('levels')
            .select('id, name, creator, difficulty, isPlatformer, rating, minProgress, videoID')
            .in('id', levelIds),
        getPlayersByUid(submitterUids)
    ])

    if (levelsResult.error) {
        throw new Error(levelsResult.error.message)
    }

    const levelsById = new Map((levelsResult.data || []).map((level) => [level.id, level]))

    return entries.map((entry) => ({
        ...entry,
        level: levelsById.get(entry.levelId) || null,
        submitterData: submittersByUid.get(entry.addedBy) || null
    }))
}

export async function getCustomListSubmissionQueueById(listId: number, actor: CustomListActor) {
    return getCustomListSubmissionQueue(listId, actor)
}

export async function shiftAcceptedTopPositions(listId: number, startPosition: number) {
    const { data, error } = await supabase
        .from('listLevels')
        .select('id, position, created_at')
        .eq('listId', listId)
        .eq('accepted', true)
        .gte('position', startPosition)
        .order('position', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    const rows = (data || []) as Array<{ id: number; position: number | null }>

    for (const row of rows) {
        const nextPosition = Number(row.position) + 1

        const { error: updateError } = await supabase
            .from('listLevels')
            .update({ position: nextPosition })
            .eq('id', row.id)

        if (updateError) {
            throw new Error(updateError.message)
        }
    }
}

export function sanitizeSubmissionReviewPayload(list: CustomList, payload: {
    accept?: unknown
    rating?: unknown
    minProgress?: unknown
    position?: unknown
    top?: unknown
    videoID?: unknown
    videoId?: unknown
}) {
    const accept = Boolean(payload.accept)
    const videoInput = payload.videoID !== undefined ? payload.videoID : payload.videoId
    const positionInput = payload.position !== undefined ? payload.position : payload.top

    if (!accept) {
        return {
            accept: false,
            rating: null as number | null,
            minProgress: null as number | null,
            position: null as number | null,
            videoID: videoInput !== undefined ? sanitizeCustomListVideoId(videoInput) : null
        }
    }

    if (list.mode === 'top') {
        return {
            accept: true,
            rating: payload.rating !== undefined ? sanitizeRating(payload.rating) : 5,
            minProgress: sanitizeMinProgress(payload.minProgress, list.isPlatformer),
            position: sanitizeSubmissionPosition(positionInput),
            videoID: videoInput !== undefined ? sanitizeCustomListVideoId(videoInput) : null
        }
    }

    return {
        accept: true,
        rating: sanitizeRating(payload.rating),
        minProgress: sanitizeMinProgress(payload.minProgress, list.isPlatformer),
        position: null as number | null,
        videoID: videoInput !== undefined ? sanitizeCustomListVideoId(videoInput) : null
    }
}

export async function submitLevelToCustomList(listId: number, actor: CustomListActor, payload: {
    levelId?: unknown
    videoID?: unknown
    videoLink?: unknown
    comment?: unknown
}) {
    const list = await getCustomListRow(listId)
    const actorUid = getRequiredActorUid(actor)

    if (!list.levelSubmissionEnabled) {
        throw new ForbiddenError('This list does not accept level submissions')
    }

    const levelId = Number(payload.levelId)
    requireLevelId(levelId)
    const level = await ensureLevelExists(levelId)
    assertLevelTypeMatchesList(list, level)

    const { data: existingSubmission, error: existingError } = await supabase
        .from('listLevels')
        .select('id, accepted')
        .eq('listId', listId)
        .eq('levelId', levelId)
        .maybeSingle()

    if (existingError) {
        throw new Error(existingError.message)
    }

    if (existingSubmission) {
        throw new ConflictError('Level already exists in this list')
    }

    const videoInput = payload.videoID !== undefined ? payload.videoID : payload.videoLink
    const submissionVideoID = sanitizeCustomListVideoId(videoInput)
    const submissionComment = sanitizeSubmissionComment(payload.comment)

    const itemInsert: CustomListLevelInsert = {
        listId,
        levelId,
        addedBy: actorUid,
        accepted: false,
        rating: 5,
        minProgress: null,
        position: null,
        videoID: submissionVideoID,
        submissionComment: submissionComment ?? null
    }

    const { error: insertError } = await supabase
        .from('listLevels')
        .insert(itemInsert)

    if (insertError) {
        throw new Error(insertError.message)
    }

    await touchCustomListActivity(listId)

    await appendCustomListAuditLog(listId, {
        actorUid,
        action: 'level_submitted',
        metadata: {
            levelId,
            levelName: level.name,
            creator: level.creator,
            videoID: submissionVideoID,
            comment: submissionComment
        }
    })

    return {
        levelId,
        levelName: level.name,
        creator: level.creator,
        videoID: submissionVideoID,
        comment: submissionComment
    }
}

export async function reviewCustomListSubmission(listId: number, actor: CustomListActor, levelId: number, payload: {
    accept?: unknown
    rating?: unknown
    minProgress?: unknown
    position?: unknown
    top?: unknown
    videoID?: unknown
    videoId?: unknown
}) {
    const list = await getCustomListRow(listId)
    const access = await getCustomListAccess(list, actor)

    if (!canReviewCustomListSubmissions(list, access)) {
        throw new ForbiddenError('You do not have permission to review submissions on this list')
    }

    const submissionLevelId = Number(levelId)
    requireLevelId(submissionLevelId)
    const submission = await supabase
        .from('listLevels')
        .select('id, created_at, listId, levelId, addedBy, rating, position, minProgress, videoID, accepted, submissionComment')
        .eq('listId', listId)
        .eq('levelId', submissionLevelId)
        .eq('accepted', false)
        .maybeSingle()

    if (submission.error) {
        throw new Error(submission.error.message)
    }

    const currentSubmission = submission.data as CustomListSubmission | null

    if (!currentSubmission) {
        throw new NotFoundError('Submission not found')
    }

    const reviewPayload = sanitizeSubmissionReviewPayload(list, payload)

    if (!reviewPayload.accept) {
        const { error: deleteError } = await supabase
            .from('listLevels')
            .delete()
            .eq('id', currentSubmission.id)

        if (deleteError) {
            throw new Error(deleteError.message)
        }

        await appendCustomListAuditLog(listId, {
            actorUid: access.actorUid,
            action: 'level_removed',
            metadata: {
                levelId: currentSubmission.levelId,
                levelItemId: currentSubmission.id,
                levelName: currentSubmission.level?.name ?? null,
                creator: currentSubmission.level?.creator ?? null,
                submittedBy: currentSubmission.addedBy ?? null,
                position: null,
                previousState: {
                    rating: currentSubmission.rating,
                    minProgress: currentSubmission.minProgress,
                    videoID: currentSubmission.videoID,
                    createdAt: currentSubmission.created_at,
                    position: currentSubmission.position
                }
            }
        })

        await touchCustomListActivity(listId)

        if (currentSubmission.addedBy) {
            await sendNotification({
                to: currentSubmission.addedBy,
                status: 2,
                content: `Level ${currentSubmission.level?.name || currentSubmission.levelId} (${currentSubmission.levelId}) bạn gửi vào list ${list.title} đã bị từ chối.`,
                redirect: `/lists/${listId}`
            })
        }

        return getCustomList(listId, actor)
    }

    const updates: Record<string, unknown> = {
        accepted: true,
        submissionComment: currentSubmission.submissionComment ?? null
    }

    if (reviewPayload.videoID !== null) {
        updates.videoID = reviewPayload.videoID
    }

    if (list.mode === 'top') {
        const currentTopCountResult = await supabase
            .from('listLevels')
            .select('id', { count: 'exact', head: true })
            .eq('listId', listId)
            .eq('accepted', true)

        if (currentTopCountResult.error) {
            throw new Error(currentTopCountResult.error.message)
        }

        const desiredPosition = reviewPayload.position ?? ((currentTopCountResult.count ?? 0) + 1)
        const nextPosition = Math.min(desiredPosition, (currentTopCountResult.count ?? 0) + 1)

        await shiftAcceptedTopPositions(listId, nextPosition)

        updates.position = nextPosition
        updates.rating = reviewPayload.rating ?? currentSubmission.rating ?? 5
        updates.minProgress = reviewPayload.minProgress
    } else {
        updates.rating = reviewPayload.rating
        updates.minProgress = reviewPayload.minProgress
        updates.position = null
    }

    const { error: updateError } = await supabase
        .from('listLevels')
        .update(updates)
        .eq('id', currentSubmission.id)

    if (updateError) {
        throw new Error(updateError.message)
    }

    await syncLevelCount(listId)
    await touchCustomListActivity(listId)

    await appendCustomListAuditLog(listId, {
        actorUid: access.actorUid,
        action: 'level_added',
        metadata: {
            levelId: currentSubmission.levelId,
            levelItemId: currentSubmission.id,
            levelName: currentSubmission.level?.name ?? null,
            creator: currentSubmission.level?.creator ?? null,
            submittedBy: currentSubmission.addedBy ?? null,
            nextState: {
                rating: updates.rating,
                minProgress: updates.minProgress,
                videoID: updates.videoID ?? currentSubmission.videoID ?? null,
                createdAt: currentSubmission.created_at,
                position: updates.position
            }
        }
    })

    if (currentSubmission.addedBy) {
        await sendNotification({
            to: currentSubmission.addedBy,
            status: 1,
            content: `Level ${currentSubmission.level?.name || currentSubmission.levelId} (${currentSubmission.levelId}) bạn gửi vào list ${list.title} đã được chấp nhận.`,
            redirect: `/lists/${listId}`
        })
    }

    return getCustomList(listId, actor)
}
