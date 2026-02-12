import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

import aiRouter from './routes/ai.js';
import filesRouter from './routes/files.js';
import exportRouter from './routes/export.js';
import configRouter from './routes/config.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
mkdirSync(path.join(__dirname, '../uploads'), { recursive: true });
mkdirSync(path.join(__dirname, '../generated'), { recursive: true });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve generated images statically
app.use('/generated', express.static(path.join(__dirname, '../generated')));

// Routes
app.use('/api/ai', aiRouter);
app.use('/api/files', filesRouter);
app.use('/api/export', exportRouter);
app.use('/api/config', configRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 AIPPT Server running on http://localhost:${PORT}`);
});
