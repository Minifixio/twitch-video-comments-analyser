import * as fetch from 'node-fetch';
import * as Errors from './models/Errors';
import { Comment } from './models/Comment';
import { CommentsResponse } from './models/CommentsResponse';
import { EmoticonStat } from './models/EmoticonStat';
import { RawComment } from './models/RawComment';
import { Range, TimeRangeComment } from './models/TimeRangeComment';
import { UserCountComment } from './models/UserCountComment';
import { VideoInfos } from './models/VideoInfos';
import { ProgressBar } from './ProgressBar';

export class CommentAnalyser {

    private TWITCH_API_URL = 'https://api.twitch.tv/v5';
    public TWITCH_CLIENT_ID: string;
    public verbose: boolean;

    constructor(twitchClientId: string, verbose: boolean = true) {
        if (!twitchClientId) {
            throw Errors.NO_CLIENTID_ERROR;
        }
        this.TWITCH_CLIENT_ID = twitchClientId;
        this.verbose = verbose;
    }

    private async _getVideoInfos(videoId: number): Promise<VideoInfos> {
        const mainURL = `${this.TWITCH_API_URL}/videos/${videoId}`;
        const headers = { 'Client-ID': this.TWITCH_CLIENT_ID };

        try {
            const res = await fetch.default(mainURL, { headers })
            const body = await res.json()

            if (res.status !== 200) {
                throw body;
            } else {
                return body;
            }
        } catch (e) {
            throw e;
        }
    }

    async getAllComment(videoId: number): Promise<Comment[]> {
        let mainURL = `${this.TWITCH_API_URL}/videos/${videoId}/comments?content_offset_seconds=0`;
        let videoLength: number;
        let nextCursor: string | null;
        let comments: RawComment[] = [];
        const headers = { 'Client-ID': this.TWITCH_CLIENT_ID };
        const progressBar = new ProgressBar(videoId);

        try {
            videoLength = await (await this._getVideoInfos(videoId)).length;
        } catch (e) {
            console.error('An error occurred while retrieving Twitch comments :', e)
            return []
        }

        do {
            try {
                const res = await fetch.default(mainURL, { headers })
                const body: CommentsResponse = await res.json();

                if (res.status !== 200) {
                    console.error('An error occurred while retrieving Twitch comments :', body)
                    return []
                } else {
                    body._next ? nextCursor = body._next : nextCursor = null;

                    mainURL = `${this.TWITCH_API_URL}/videos/${videoId}/comments?cursor=${nextCursor}`;

                    comments = comments.concat(body.comments);
                    const lastTime = body.comments[body.comments.length - 1].content_offset_seconds;

                    const progress = (lastTime) / videoLength
                    if (this.verbose && progress <= 1) { progressBar.update(progress) }
                }

            } catch (e) {
                if (this.verbose) { progressBar.erase() }
                console.error('An error occurred while retrieving Twitch comments :', e)
                return []
            }

        } while (nextCursor)

        if (this.verbose) {
            progressBar.finish()
            console.log(`A total of ${comments.length} comments have been retreived for video ${videoId}`);
        }

        return this._simplifyComments(comments);
    }

    /**
     * Get the comments from the Twitch API and return a simplified version of it
     * @param videoId The ID of the Twitch Video
     * @param startTime The start of the extract you want to analyze in seconds
     * @param endTime The end of the extract you want to analyze in seconds
     */
    async getComments(videoId: number, startTime: number, endTime: number): Promise<Comment[]> {
        let mainURL = `${this.TWITCH_API_URL}/videos/${videoId}/comments?content_offset_seconds=${startTime}`;
        let comments: RawComment[] = [];
        const headers = { 'Client-ID': this.TWITCH_CLIENT_ID };
        const progressBar = new ProgressBar(videoId);

        for (let i = startTime; i < endTime;) {
            try {
                const res = await fetch.default(mainURL, { headers })
                const body: CommentsResponse = await res.json();

                if (res.status !== 200) {
                    console.error('An error occurred while retrieving Twitch comments :', body)
                    return []
                } else {
                    mainURL = `${this.TWITCH_API_URL}/videos/${videoId}/comments?cursor=${body._next}`;

                    comments = comments.concat(body.comments);
                    const lastTime = body.comments[body.comments.length - 1].content_offset_seconds;

                    i = lastTime;

                    const progress = (lastTime - startTime) / (endTime - startTime)
                    if (this.verbose && progress <= 1) { progressBar.update(progress) }
                }

            } catch (e) {
                if (this.verbose) { progressBar.erase() }
                console.error('An error occurred while retrieving Twitch comments :', e)
                return []
            }
        }

        if (this.verbose) {
            progressBar.finish()
            console.log(`A total of ${comments.length} comments have been retreived from ${startTime}s to ${endTime}s`);
        }

        return this._simplifyComments(comments);
    }

    /**
     * Make the comments simpler
     * @param comments The raw comments from Twitch
     */
    private _simplifyComments(comments: RawComment[]) {
        const simpleComments: Comment[] = [];

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
                        { id: ba._id, version: ba.version ? +ba.version : undefined }
                    )) : [],

                    emoticons: com.message.emoticons ? com.message.emoticons.map(em => (
                        { id: +em._id, link: `https://static-cdn.jtvnw.net/emoticons/v1/${em._id}/1.0` }
                    )) : []
                },
            }

            simpleComments.push(comment);
        })

        return simpleComments;
    }

    /**
     * Sort comments according to the number of comments sent by people
     * @param comments
     */
    sortByUsers(comments: Comment[]): UserCountComment[] {

        if (comments.length === 0) {
            if(this.verbose) {console.log('No comments were provided for sortByUsers()') }
            return []
        }

        let sortedComments = comments.reduce((acc: any, curr) => {
            if (acc[curr.commenter.display_name]) {
                acc[curr.commenter.display_name] += 1;
            } else {
                acc[curr.commenter.display_name] = 1;
            }

            return acc;
        }, {})

        sortedComments = Object.keys(sortedComments)
            .map(user => ({ user, count: sortedComments[user] }))
            .sort((a, b) => (a.count < b.count) ? 1 : -1);

        if (this.verbose && sortedComments.length > 0) { console.log('Comments have been sorted by users') }
        return sortedComments;
    }


    /**
     * Calculates the number of comments sent over specified range of seconds
     * @param comments
     * @param accuracy the time range (in seconds)
     */
    sortByTimeRange(comments: Comment[], accuracy: number) {

        if (comments.length === 0) {
            if(this.verbose) {console.log('No comments were provided for sortByTimeRange()') }
            return []
        }

        let range: Range = {
            start: comments[0].time,
            end: comments[0].time + accuracy
        }

        const sortedComments: TimeRangeComment[] = comments.reduce((acc: TimeRangeComment[], curr: Comment) => {

            if (curr.time < range.end) {
                const idx = acc.findIndex(el => el.range.end === range.end);
                acc[idx].count += 1;
            } else {
                range = { start: curr.time, end: curr.time + accuracy };
                acc.push({ range, count: 1 });
            }

            return acc;
        }, [{ range, count: 0 }]);

        if (this.verbose && sortedComments.length > 0) { console.log('Comments have been sorted by time range') }
        return sortedComments
    }


    /**
     * Returns an array with the IDs of the different emoticons and their number of occurrences
     * @param comments
     * @param accuracy the time range (in seconds)
     */
    emoticonStats(comments: Comment[]): any[] {

        if (comments.length === 0) {
            if(this.verbose) {console.log('No comments were provided for emoticonStats()') }
            return []
        }

        const emoticonsArr = comments
            .filter(com => com.message.emoticons.length > 0)
            .map(com => (com.message.emoticons?.map(em => (em.id))))
            .reduce((acc: EmoticonStat[], curr: any) => {

                curr.forEach((num: number) => {
                    const idx = acc.findIndex(el => el.emoticonId === num);

                    if (idx !== -1) {
                        acc[idx].count += 1;
                    } else {
                        acc.push({ emoticonId: num, count: 1, link: `https://static-cdn.jtvnw.net/emoticons/v1/${num}/1.0` });
                    }
                });


                return acc;
            }, [])
            .sort((a, b) => (a.count < b.count) ? 1 : -1);

        if (this.verbose) { console.log('Comments have been sorted by emoticons') }
        return emoticonsArr;
    }
}