import { Message } from "./Message";
import { Commenter } from "./Commenter";
export interface Comment {
    created_at: string;
    updated_at: string;
    time: number;
    commenter: Commenter;
    message: Message;
}
