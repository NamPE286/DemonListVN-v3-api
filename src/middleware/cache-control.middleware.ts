import type { NextFunction, Request as ExpressRequest, Response as ExpressResponse } from 'express'

export const API_CACHE_TTL_SECONDS = 300
export const LEGACY_LIST_API_SUNSET = 'Wed, 21 Oct 2026 00:00:00 GMT'

const PUBLIC_CACHE_CONTROL = `public, max-age=${API_CACHE_TTL_SECONDS}, s-maxage=${API_CACHE_TTL_SECONDS}, stale-while-revalidate=60`
const EDGE_CACHE_CONTROL = `public, max-age=${API_CACHE_TTL_SECONDS}, stale-while-revalidate=60`
const NO_STORE_CACHE_CONTROL = 'private, no-store'
const EDGE_CACHEABLE_PREFIXES = ['/list', '/lists', '/leaderboard']

function hasUidQuery(query: ExpressRequest['query'] | URLSearchParams) {
	if (query instanceof URLSearchParams) {
		return query.has('uid')
	}

	const value = query.uid

	if (Array.isArray(value)) {
		return value.some((entry) => typeof entry === 'string' && entry.trim().length > 0)
	}

	return typeof value === 'string' && value.trim().length > 0
}

function hasSubmitGateQuery(query: ExpressRequest['query'] | URLSearchParams) {
	if (query instanceof URLSearchParams) {
		return query.has('submitGate')
	}

	return query.submitGate !== undefined
}

function setPublicCacheHeaders(res: ExpressResponse) {
	res.vary('Authorization')
	res.set('Cache-Control', PUBLIC_CACHE_CONTROL)
	res.set('CDN-Cache-Control', EDGE_CACHE_CONTROL)
	res.set('Cloudflare-CDN-Cache-Control', EDGE_CACHE_CONTROL)
}

function setNoStoreHeaders(res: ExpressResponse) {
	res.vary('Authorization')
	res.set('Cache-Control', NO_STORE_CACHE_CONTROL)
	res.set('CDN-Cache-Control', 'no-store')
	res.set('Cloudflare-CDN-Cache-Control', 'no-store')
}

export function publicReadCache(req: ExpressRequest, res: ExpressResponse, next: NextFunction) {
	if (req.method !== 'GET' && req.method !== 'HEAD') {
		next()
		return
	}

	if (res.locals.authenticated || hasUidQuery(req.query) || hasSubmitGateQuery(req.query)) {
		setNoStoreHeaders(res)
		next()
		return
	}

	setPublicCacheHeaders(res)
	next()
}

export function legacyListDeprecation(req: ExpressRequest, res: ExpressResponse, next: NextFunction) {
	res.set('Deprecation', 'true')
	res.set('Sunset', LEGACY_LIST_API_SUNSET)
	res.append('Warning', '299 - "/list endpoints are deprecated; prefer /lists"')
	next()
}

export function isWorkerEdgeCacheable(request: Request) {
	const url = new URL(request.url)

	return request.method === 'GET'
		&& EDGE_CACHEABLE_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))
		&& !request.headers.has('authorization')
		&& !hasUidQuery(url.searchParams)
		&& !hasSubmitGateQuery(url.searchParams)
}

export function createWorkerCacheKey(request: Request) {
	return new Request(request.url, { method: 'GET' })
}

export function isWorkerResponseCacheable(response: Response) {
	if (response.status !== 200 || response.headers.has('Set-Cookie')) {
		return false
	}

	const cacheControl = response.headers.get('Cache-Control') || ''

	return cacheControl.includes('public') && !cacheControl.includes('no-store')
}
