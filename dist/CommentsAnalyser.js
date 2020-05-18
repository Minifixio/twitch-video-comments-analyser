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
const request = __importStar(require("request"));
const util = __importStar(require("util"));
const Errors = __importStar(require("./models/Errors"));
const asyncRequest = util.promisify(request.get);
class CommentAnalyser {
    constructor(twitchClientId, verbose = false) {
        this.TWITCH_API_URL = 'https://api.twitch.tv/v5';
        if (!twitchClientId) {
            throw Errors.NO_CLIENTID_ERROR;
        }
        this.TWITCH_CLIENT_ID = twitchClientId;
        this.verbose = verbose;
    }
    /**
     * Get the comments from the Twitch API and return a simplified version of it
     * @param videoId The ID of the Twitch Video
     * @param startTime The start of the extract you want to analyze in seconds
     * @param endTime The end of the extract you want to analyze in seconds
     */
    getComments(videoId, startTime, endTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = 'videos/' + videoId;
            const tag = 'comments?content_offset_seconds=' + startTime;
            let mainURL = `${this.TWITCH_API_URL}/${path}/${tag}`;
            let comments = [];
            const options = {
                uri: mainURL,
                headers: {
                    'Client-ID': this.TWITCH_CLIENT_ID
                },
                json: true
            };
            for (let i = startTime; i < endTime;) {
                try {
                    const req = yield asyncRequest(options);
                    const body = req.body;
                    if (req.statusCode !== 200) {
                        const error = req.body;
                        console.error(error);
                        return [];
                    }
                    else {
                        mainURL = `${this.TWITCH_API_URL}/${path}/comments?cursor=${body._next}`;
                        options.uri = mainURL;
                        comments = comments.concat(body.comments);
                        const lastTime = body.comments[body.comments.length - 1].content_offset_seconds;
                        i = lastTime;
                        if (this.verbose) {
                            progressBar((i - startTime) / (endTime - startTime));
                        }
                    }
                }
                catch (e) {
                    throw e;
                }
            }
            if (this.verbose) {
                console.log(`A total of ${comments.length} comments have been retreived from ${startTime}s to ${endTime}s`);
            }
            return this.simplifyComments(comments);
        });
    }
    /**
     * Make the comments simpler
     * @param comments The raw comments from Twitch
     */
    simplifyComments(comments) {
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
        if (this.verbose) {
            console.log('Comments have been simplified');
        }
        return simpleComments;
    }
    /**
     * Sort comments according to the number of comments sent by people
     * @param comments
     */
    sortByUsers(comments) {
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
        if (this.verbose) {
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
        let range = {
            start: comments[0].time,
            end: comments[0].time + accuracy
        };
        const res = comments.reduce((acc, curr) => {
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
        if (this.verbose) {
            console.log('Comments have been sorted by time range');
        }
        return res;
    }
    /**
     * Returns an array with the IDs of the different emoticons and their number of occurrences
     * @param comments
     * @param accuracy the time range (in seconds)
     */
    emoticonStats(comments) {
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
function progressBar(progress, barLen = 20) {
    const percentage = Math.round(progress * 100);
    if (percentage >= 100) {
        process.stdout.write(`\r [${'='.repeat(barLen)}] 100% of comments retrieved`);
        process.stdout.write('\n');
        console.log('Done !');
    }
    else {
        const bar = '='.repeat(Math.round(progress * barLen)) + ' '.repeat(barLen - Math.round(progress * barLen));
        process.stdout.write(`\r [${bar}] ${percentage}% of comments retrieved`);
    }
}
//# sourceMappingURL=CommentsAnalyser.js.map