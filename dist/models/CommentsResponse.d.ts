import { RawComment } from "./RawComment";
export interface CommentsResponse {
    comments: RawComment[];
    _prev: string;
    _next: string;
}
