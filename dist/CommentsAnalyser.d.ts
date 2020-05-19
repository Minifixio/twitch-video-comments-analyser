import { Comment } from './models/Comment';
import { UserCountComment } from './models/UserCountComment';
import { TimeRangeComment } from './models/TimeRangeComment';
export declare class CommentAnalyser {
    private TWITCH_API_URL;
    TWITCH_CLIENT_ID: string;
    verbose: boolean;
    constructor(twitchClientId: string, verbose?: boolean);
    private getVideoInfos;
    getAllComment(videoId: number): Promise<Comment[]>;
    /**
     * Get the comments from the Twitch API and return a simplified version of it
     * @param videoId The ID of the Twitch Video
     * @param startTime The start of the extract you want to analyze in seconds
     * @param endTime The end of the extract you want to analyze in seconds
     */
    getComments(videoId: number, startTime: number, endTime: number): Promise<Comment[]>;
    /**
     * Make the comments simpler
     * @param comments The raw comments from Twitch
     */
    private simplifyComments;
    /**
     * Sort comments according to the number of comments sent by people
     * @param comments
     */
    sortByUsers(comments: Comment[]): UserCountComment[];
    /**
     * Calculates the number of comments sent over specified range of seconds
     * @param comments
     * @param accuracy the time range (in seconds)
     */
    sortByTimeRange(comments: Comment[], accuracy: number): TimeRangeComment[];
    /**
     * Returns an array with the IDs of the different emoticons and their number of occurrences
     * @param comments
     * @param accuracy the time range (in seconds)
     */
    emoticonStats(comments: Comment[]): any[];
}
