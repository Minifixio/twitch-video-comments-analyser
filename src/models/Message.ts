import { Emoticon } from "./Emoticon";
import { Badge } from "./Badge";

export interface Message {
    message: string;
    user_color?: string;
    emoticons: Emoticon[];
    user_badges: Badge[];
}