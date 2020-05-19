import * as request from 'request';
import * as util from 'util';

import * as Errors from './models/Errors'
import { Comment } from './models/Comment'
import { RawComment } from './models/RawComment'
import { CommentsResponse } from './models/CommentsResponse';
import { UserCountComment } from './models/UserCountComment';
import { TimeRangeComment, Range } from './models/TimeRangeComment';
import { EmoticonStat } from './models/EmoticonStat';
import { VideoInfos } from './models/VideoInfos';

const asyncRequest = util.promisify(request.get)

export class CommentAnalyser {

    private TWITCH_API_URL = 'https://api.twitch.tv/v5'
    public TWITCH_CLIENT_ID: string
    public verbose: boolean

    constructor(twitchClientId: string, verbose: boolean = false) {
        if (!twitchClientId) {
            throw Errors.NO_CLIENTID_ERROR
        }
        this.TWITCH_CLIENT_ID = twitchClientId
        this.verbose = verbose
    }

    private async getVideoInfos(videoId: number): Promise<VideoInfos> {
        const mainURL = `${this.TWITCH_API_URL}/videos/${videoId}`;

        const options = {
            uri: mainURL,
            headers: {
                'Client-ID': this.TWITCH_CLIENT_ID
            },
            json: true
        };

        try {
            const req = await asyncRequest(options)
            if (req.statusCode !== 200) {
                const error = req.body
                throw error
            } else {
                return req.body
            }
        } catch(e) {
            throw e
        }
    }

    async getAllComment(videoId: number): Promise<Comment[]> {
        const path = 'videos/' + videoId;
        const tag = 'comments?content_offset_seconds=0';
        let mainURL = `${this.TWITCH_API_URL}/${path}/${tag}`;
        let videoLength: number;

        let nextCursor: string | null;

        let comments: RawComment[] = []

        const options = {
            uri: mainURL,
            headers: {
                'Client-ID': this.TWITCH_CLIENT_ID
            },
            json: true
        };

        try {
            videoLength = await (await this.getVideoInfos(videoId)).length
        } catch(e) {
            throw e
        }

        do {
            try {
                const req = await asyncRequest(options)
                const body: CommentsResponse = req.body

                if (req.statusCode !== 200) {
                    const error = req.body
                    throw error
                } else {
                    body._next ? nextCursor = body._next : nextCursor = null

                    mainURL = `${this.TWITCH_API_URL}/${path}/comments?cursor=${nextCursor}`;
                    options.uri = mainURL

                    comments = comments.concat(body.comments)
                    const lastTime = body.comments[body.comments.length - 1].content_offset_seconds

                    if (this.verbose) { progressBar((lastTime) / videoLength) }
                }

            } catch(e) {
                throw e
            }

        } while (nextCursor)

        return this.simplifyComments(comments)
    }

    /**
     * Get the comments from the Twitch API and return a simplified version of it
     * @param videoId The ID of the Twitch Video
     * @param startTime The start of the extract you want to analyze in seconds
     * @param endTime The end of the extract you want to analyze in seconds
     */
    async getComments(videoId: number, startTime: number, endTime: number): Promise<Comment[]> {
        const path = 'videos/' + videoId;
        const tag = 'comments?content_offset_seconds=' + startTime;
        let mainURL = `${this.TWITCH_API_URL}/${path}/${tag}`;

        let comments: RawComment[] = []

        const options = {
            uri: mainURL,
            headers: {
                'Client-ID': this.TWITCH_CLIENT_ID
            },
            json: true
        };

        for (let i=startTime; i<endTime;) {
            try {
                const req = await asyncRequest(options)
                const body: CommentsResponse = req.body

                if (req.statusCode !== 200) {
                    const error = req.body
                    throw error
                } else {
                    mainURL = `${this.TWITCH_API_URL}/${path}/comments?cursor=${body._next}`;
                    options.uri = mainURL

                    comments = comments.concat(body.comments)
                    const lastTime = body.comments[body.comments.length - 1].content_offset_seconds
                    i = lastTime
                    if (this.verbose) { progressBar((i - startTime) / (endTime - startTime)) }
                }

            } catch(e) {
                throw e
            }
        }
        if (this.verbose) { console.log(`A total of ${comments.length} comments have been retreived from ${startTime}s to ${endTime}s`) }
        return this.simplifyComments(comments)
    }

    /**
     * Make the comments simpler
     * @param comments The raw comments from Twitch
     */
    private simplifyComments(comments: RawComment[]) {
        const simpleComments: Comment[] = []

        comments.forEach(com => {
            const comment: Comment = {
                created_at: com.created_at,
                updated_at: com.updated_at,
                time: com.content_offset_seconds,
                commenter: {
                    display_name: com.commenter.display_name,
                    name: com.commenter.display_name,
                    type: com.commenter.type,
                    bio: com.commenter.bio,
                    logo: com.commenter.logo,
                },
                message: {
                    message: com.message.body,
                    user_color: com.message.user_color ? com.message.user_color : undefined,

                    user_badges: com.message.user_badges ? com.message.user_badges.map(ba => (
                        {id: ba._id, version: ba.version ? +ba.version : undefined}
                    )) : [],

                    emoticons: com.message.emoticons ? com.message.emoticons.map(em => (
                        {id: +em._id, link: `https://static-cdn.jtvnw.net/emoticons/v1/${em._id}/1.0`}
                    )) : []
                },
            }

            simpleComments.push(comment)
        })

        if (this.verbose) { console.log('Comments have been simplified') }
        return simpleComments
    }

    /**
     * Sort comments according to the number of comments sent by people
     * @param comments
     */
    sortByUsers(comments: Comment[]): UserCountComment[] {
        let sortedComments = comments.reduce((acc: any, curr) => {
            if (acc[curr.commenter.display_name]) {
                acc[curr.commenter.display_name] += 1;
            } else {
                acc[curr.commenter.display_name] = 1;
            }

            return acc
        }, {})

        sortedComments = Object.keys(sortedComments)
            .map(user => ({user, count: sortedComments[user]}))
            .sort((a, b) => (a.count < b.count) ? 1 : -1);

        if (this.verbose) { console.log('Comments have been sorted by users') }
        return sortedComments
    }


    /**
     * Calculates the number of comments sent over specified range of seconds
     * @param comments
     * @param accuracy the time range (in seconds)
     */
    sortByTimeRange(comments: Comment[], accuracy: number) {

        let range: Range = {
            start: comments[0].time,
            end : comments[0].time + accuracy
        }

        const res: TimeRangeComment[] = comments.reduce((acc: TimeRangeComment[], curr: Comment) => {

            if (curr.time < range.end) {
                const idx = acc.findIndex(el => el.range.end === range.end)
                acc[idx].count += 1
            } else {
                range = { start: curr.time, end: curr.time + accuracy}
                acc.push({ range, count: 1 })
            }

            return acc
        }, [{ range, count: 0}])

        if (this.verbose) { console.log('Comments have been sorted by time range') }
        return res
    }


    /**
     * Returns an array with the IDs of the different emoticons and their number of occurrences
     * @param comments
     * @param accuracy the time range (in seconds)
     */
    emoticonStats(comments: Comment[]): any[] {
        const emoticonsArr = comments
            .filter(com => com.message.emoticons.length > 0)
            .map(com => (com.message.emoticons?.map(em => (em.id))))
            .reduce((acc: EmoticonStat[], curr: any) => {

                curr.forEach((num: number) => {
                    const idx = acc.findIndex(el => el.emoticonId === num)

                    if (idx !== -1) {
                        acc[idx].count += 1
                    } else {
                        acc.push({ emoticonId: num, count: 1, link: `https://static-cdn.jtvnw.net/emoticons/v1/${num}/1.0` })
                    }
                })


                return acc
            }, [])
            .sort((a, b) => (a.count < b.count) ? 1 : -1)

        if (this.verbose) { console.log('Comments have been sorted by emoticons') }
        return emoticonsArr
    }
}

function progressBar(progress: number, barLen: number = 20) {
    const percentage = Math.round(progress * 100)

    if (percentage >= 100) {
        process.stdout.write(`\r [${'='.repeat(barLen)}] 100% of comments retrieved`)
        process.stdout.write('\n')
        console.log('Done !')
    } else {
        const bar = '='.repeat(Math.round(progress * barLen)) + ' '.repeat(barLen - Math.round(progress * barLen))
        process.stdout.write(`\r [${bar}] ${percentage}% of comments retrieved`)
    }
}