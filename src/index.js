import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import { extractContent } from './routes/extract-content.js';
import { applyRewrite } from './routes/apply-rewrite.js';
import mcpRouter from './mcp.js'; // default export

dotenv.config();

const app = express();

// Parsers, CORS en logging vóór routes
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

// Healthcheck
app.get('/health', (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

// Relay-routes
app.get('/extract-content', extractContent);
app.post('/apply-rewrite', applyRewrite);

// MCP (Connector) routes
app.use('/mcp', mcpRouter);

// Catch-all (zichtbare 404 met path)
app.all('*', (req, res) => {
  res.status(404).json({ error: 'not_found', path: req.path, method: req.method });
});

// Op Vercel: GEEN app.listen(); exporteer het app-object
export default app;
