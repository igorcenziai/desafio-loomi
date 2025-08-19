import { type Request, type Response } from 'express';
import { ChatService } from '../services/ChatService.js';

export class ChatController {
    private chatService: ChatService;

    constructor() {
        this.chatService = new ChatService();
    }

    public ask = async (req: Request, res: Response): Promise<void> => {
        try {
            const { question } = req.body;

            if (!question) {
                res.status(400).json({ error: 'Question is required' });
                return;
            }

            const response = await this.chatService.ask(question);

            res.status(200).json({ response });
        } catch (error) {
            console.error('Error in ChatController:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}