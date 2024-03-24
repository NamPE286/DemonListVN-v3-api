import supabase from '@root/database/supabase'

export default class {
    #initialized: boolean = false
    id: number = NaN
    name: string = ''
    creator: string = ''
    videoID: string = ''
    minProgress: string = ''
    flTop: number = NaN
    dlTop: number = NaN
    flPt: number = NaN
    dlPt: number = NaN
    rating: number = NaN
    songID: number = NaN

    constructor(id: number) {
        this.id = id
    }

    async init() {
        const { data, error } = await supabase
            .from('levels')
            .select('*')
            .eq('id', this.id)
            .single()

        if (error) {
            throw error
        }

        this.id = data.id
        this.name = data.name
        this.creator = data.creator
        this.videoID = data.videoID
        this.minProgress = data.minProgress
        this.flTop = data.flTop
        this.dlTop = data.dlTop
        this.flPt = data.flPt
        this.dlPt = data.dlPt
        this.rating = data.rating
        this.songID = data.songID

        this.#initialized = true
    }

    toJSON() {
        return Object.getOwnPropertyNames(this).reduce((a, b) => {
            // @ts-ignore
            a[b] = this[b];
            return a;
        }, {});
    }
}