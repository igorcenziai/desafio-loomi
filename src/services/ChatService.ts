import { SuvinilAgent } from "../agents/SuvinilAgent.js";

export class ChatService {

    async ask(message: string, sessionId: string): Promise<string> {
        return await SuvinilAgent(message, sessionId);
    }
}