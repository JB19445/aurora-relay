import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import { extractContent } from './routes/extract-content.js';
import { applyRewrite } from './routes/apply-rewrite.js';
import { mcpRouter } from './mcp.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8787;
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.get('/extract-content', extractContent);
app.post('/apply-rewrite', applyRewrite);

app.use('/mcp', mcpRouter);

app.listen(PORT, () => console.log(`[aurora-relay] http://localhost:${PORT}`));
