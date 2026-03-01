import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { initDatabase } from './config/database';
import roiRoutes from './routes/roiRoutes';
import importRoutes from './routes/importRoutes';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : [];

app.use(cors({
  origin: allowedOrigins.length > 0
    ? (origin, callback) => {
        if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      }
    : true,
  credentials: true,
}));
app.use(helmet());
app.use(compression());
app.use(express.json());

app.use('/api', roiRoutes);
app.use('/api', importRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API endpoints:`);
      console.log(`  GET  /api/health`);
      console.log(`  GET  /api/filters`);
      console.log(`  GET  /api/roi-data?app=App-1`);
      console.log(`  POST /api/import`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
