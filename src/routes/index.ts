import { Router } from 'express';
import { ChatController } from '../controllers/ChatController.js';


const chatRouter = Router();
const chatController = new ChatController();

chatRouter.post('/ask', chatController.ask);


export default chatRouter;