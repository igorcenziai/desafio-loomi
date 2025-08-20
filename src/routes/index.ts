import { Router } from 'express';
import { ChatController } from '../controllers/ChatController.js';

/**
 * @swagger
 * /chat/ask:
 *   post:
 *     summary: Envia uma pergunta para o chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 example: "O que posso usar para pintar meu quarto?"
 *               sessionId:
 *                 type: string
 *                 example: "abc123"
 *     responses:
 *       200:
 *         description: Resposta do chat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                   example: "Recomendo o produto Suvinil Premium."
 *                 image:
 *                   type: string
 *                   nullable: true
 *                   example: "https://exemplo.com/imagem.jpg"
 */
const chatRouter = Router();
const chatController = new ChatController();

chatRouter.post('/ask', chatController.ask);


export default chatRouter;