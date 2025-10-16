import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import { extractContent } from './routes/extract-content.js';
import { applyRewrite } from './routes/apply-rewrite.js';
import mcpRouter from './mcp.js'; // default export gebruiken

dotenv.config();

const app = express();

// parsers, logging, cors vóór routes
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

// health
app.get('/health', (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

// relay-routes
app.get('/extract-content', extractContent);
app.post('/apply-rewrite', applyRewrite);

// MCP router
app.use('/mcp', mcpRouter);

// Belangrijk: NIET app.listen() aanroepen op Vercel
export default app;
