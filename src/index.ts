import express from 'express';
import cors from 'cors';
import Chatrouter from './routes/index.js';
import { setupSwagger } from './swagger.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
setupSwagger(app);

interface HealthResponse {
    message: string;
}

app.get('/', (req: express.Request, res: express.Response<HealthResponse>) => {
    res.json({ message: 'Server is running!' });
});

app.use('/chat', Chatrouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

