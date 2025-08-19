import { SuvinilAgent } from "../agents/SuvinilAgent.js";

export class ChatService {

    async ask(message: string): Promise<string> {
        return await SuvinilAgent(message);
    }
}