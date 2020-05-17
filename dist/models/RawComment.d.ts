export interface RawComment {
    _id: string;
    created_at: string;
    updated_at: string;
    channel_id: string;
    content_type: string;
    content_id: string;
    content_offset_seconds: number;
    commenter: RawUser;
    source: string;
    state: string;
    message: RawMessage;
}
interface RawUser {
    display_name: string;
    _id: string;
    name: string;
    type: string;
    bio: string;
    created_at: string;
    updated_at: string;
    logo: string;
}
interface RawMessage {
    body: string;
    emoticons?: RawEmoticons[];
    fragments: Fragment[];
    is_action: boolean;
    user_color?: string;
    user_badges: RawBadge[];
}
interface RawBadge {
    _id: string;
    version: string;
}
interface Fragment {
    text: string;
    emoticon?: {
        emoticon_id: string;
        emoticon_set_id: string;
    };
}
interface RawEmoticons {
    _id: string;
    begin: number;
    end: number;
}
export {};
