"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentAnalyser = void 0;
const fetch = __importStar(require("node-fetch"));
const Errors = __importStar(require("./models/Errors"));
const ProgressBar_1 = require("./ProgressBar");
class CommentAnalyser {
    constructor(twitchClientId, verbose = true) {
        this.TWITCH_API_URL = 'https://api.twitch.tv/v5';
        if (!twitchClientId) {
            throw Errors.NO_CLIENTID_ERROR;
        }
        this.TWITCH_CLIENT_ID = twitchClientId;
        this.verbose = verbose;
    }
    _getVideoInfos(videoId) {
        return __awaiter(this, void 0, void 0, function* () {
            const mainURL = `${this.TWITCH_API_URL}/videos/${videoId}`;
            const headers = { 'Client-ID': this.TWITCH_CLIENT_ID };
            try {
                const res = yield fetch.default(mainURL, { headers });
                const body = yield res.json();
                if (res.status !== 200) {
                    throw body;
                }
                else {
                    return body;
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    getAllComment(videoId) {
        return __awaiter(this, void 0, void 0, function* () {
            let mainURL = `${this.TWITCH_API_URL}/videos/${videoId}/comments?content_offset_seconds=0`;
            let videoLength;
            let nextCursor;
            let comments = [];
            const headers = { 'Client-ID': this.TWITCH_CLIENT_ID };
            const progressBar = new ProgressBar_1.ProgressBar(videoId);
            try {
                videoLength = yield (yield this._getVideoInfos(videoId)).length;
            }
            catch (e) {
                console.error('An error occurred while retrieving Twitch comments :', e);
                return [];
            }
            do {
                try {
                    const res = yield fetch.default(mainURL, { headers });
                    const body = yield res.json();
                    if (res.status !== 200) {
                        console.error('An error occurred while retrieving Twitch comments :', body);
                        return [];
                    }
                    else {
                        body._next ? nextCursor = body._next : nextCursor = null;
                        mainURL = `${this.TWITCH_API_URL}/videos/${videoId}/comments?cursor=${nextCursor}`;
                        comments = comments.concat(body.comments);
                        const lastTime = body.comments[body.comments.length - 1].content_offset_seconds;
                        const progress = (lastTime) / videoLength;
                        if (this.verbose && progress <= 1) {
                            progressBar.update(progress);
                        }
                    }
                }
                catch (e) {
                    if (this.verbose) {
                        progressBar.erase();
                    }
                    console.error('An error occurred while retrieving Twitch comments :', e);
                    return [];
                }
            } while (nextCursor);
            if (this.verbose) {
                progressBar.finish();
                console.log(`A total of ${comments.length} comments have been retreived for video ${videoId}`);
            }
            return this._simplifyComments(comments);
        });
    }
    /**
     * Get the comments from the Twitch API and return a simplified version of it
     * @param videoId The ID of the Twitch Video
     * @param startTime The start of the extract you want to analyze in seconds
     * @param endTime The end of the extract you want to analyze in seconds
     */
    getComments(videoId, startTime, endTime) {
        return __awaiter(this, void 0, void 0, function* () {
            let mainURL = `${this.TWITCH_API_URL}/videos/${videoId}/comments?content_offset_seconds=${startTime}`;
            let comments = [];
            const headers = { 'Client-ID': this.TWITCH_CLIENT_ID };
            const progressBar = new ProgressBar_1.ProgressBar(videoId);
            for (let i = startTime; i < endTime;) {
                try {
                    const res = yield fetch.default(mainURL, { headers });
                    const body = yield res.json();
                    if (res.status !== 200) {
                        console.error('An error occurred while retrieving Twitch comments :', body);
                        return [];
                    }
                    else {
                        mainURL = `${this.TWITCH_API_URL}/videos/${videoId}/comments?cursor=${body._next}`;
                        comments = comments.concat(body.comments);
                        const lastTime = body.comments[body.comments.length - 1].content_offset_seconds;
                        i = lastTime;
                        const progress = (lastTime - startTime) / (endTime - startTime);
                        if (this.verbose && progress <= 1) {
                            progressBar.update(progress);
                        }
                    }
                }
                catch (e) {
                    if (this.verbose) {
                        progressBar.erase();
                    }
                    console.error('An error occurred while retrieving Twitch comments :', e);
                    return [];
                }
            }
            if (this.verbose) {
                progressBar.finish();
                console.log(`A total of ${comments.length} comments have been retreived from ${startTime}s to ${endTime}s`);
            }
            return this._simplifyComments(comments);
        });
    }
    /**
     * Make the comments simpler
     * @param comments The raw comments from Twitch
     */
    _simplifyComments(comments) {
        const simpleComments = [];
        comments.forEach(com => {
            const comment = {
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
                    user_badges: com.message.user_badges ? com.message.user_badges.map(ba => ({ id: ba._id, version: ba.version ? +ba.version : undefined })) : [],
                    emoticons: com.message.emoticons ? com.message.emoticons.map(em => ({ id: +em._id, link: `https://static-cdn.jtvnw.net/emoticons/v1/${em._id}/1.0` })) : []
                },
            };
            simpleComments.push(comment);
        });
        return simpleComments;
    }
    /**
     * Sort comments according to the number of comments sent by people
     * @param comments
     */
    sortByUsers(comments) {
        if (comments.length === 0) {
            if (this.verbose) {
                console.log('No comments were provided for sortByUsers()');
            }
            return [];
        }
        let sortedComments = comments.reduce((acc, curr) => {
            if (acc[curr.commenter.display_name]) {
                acc[curr.commenter.display_name] += 1;
            }
            else {
                acc[curr.commenter.display_name] = 1;
            }
            return acc;
        }, {});
        sortedComments = Object.keys(sortedComments)
            .map(user => ({ user, count: sortedComments[user] }))
            .sort((a, b) => (a.count < b.count) ? 1 : -1);
        if (this.verbose && sortedComments.length > 0) {
            console.log('Comments have been sorted by users');
        }
        return sortedComments;
    }
    /**
     * Calculates the number of comments sent over specified range of seconds
     * @param comments
     * @param accuracy the time range (in seconds)
     */
    sortByTimeRange(comments, accuracy) {
        if (comments.length === 0) {
            if (this.verbose) {
                console.log('No comments were provided for sortByTimeRange()');
            }
            return [];
        }
        let range = {
            start: comments[0].time,
            end: comments[0].time + accuracy
        };
        const sortedComments = comments.reduce((acc, curr) => {
            if (curr.time < range.end) {
                const idx = acc.findIndex(el => el.range.end === range.end);
                acc[idx].count += 1;
            }
            else {
                range = { start: curr.time, end: curr.time + accuracy };
                acc.push({ range, count: 1 });
            }
            return acc;
        }, [{ range, count: 0 }]);
        if (this.verbose && sortedComments.length > 0) {
            console.log('Comments have been sorted by time range');
        }
        return sortedComments;
    }
    /**
     * Returns an array with the IDs of the different emoticons and their number of occurrences
     * @param comments
     * @param accuracy the time range (in seconds)
     */
    emoticonStats(comments) {
        if (comments.length === 0) {
            if (this.verbose) {
                console.log('No comments were provided for emoticonStats()');
            }
            return [];
        }
        const emoticonsArr = comments
            .filter(com => com.message.emoticons.length > 0)
            .map(com => { var _a; return ((_a = com.message.emoticons) === null || _a === void 0 ? void 0 : _a.map(em => (em.id))); })
            .reduce((acc, curr) => {
            curr.forEach((num) => {
                const idx = acc.findIndex(el => el.emoticonId === num);
                if (idx !== -1) {
                    acc[idx].count += 1;
                }
                else {
                    acc.push({ emoticonId: num, count: 1, link: `https://static-cdn.jtvnw.net/emoticons/v1/${num}/1.0` });
                }
            });
            return acc;
        }, [])
            .sort((a, b) => (a.count < b.count) ? 1 : -1);
        if (this.verbose) {
            console.log('Comments have been sorted by emoticons');
        }
        return emoticonsArr;
    }
}
exports.CommentAnalyser = CommentAnalyser;
//# sourceMappingURL=CommentsAnalyser.js.map