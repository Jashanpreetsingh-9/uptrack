import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { loadEnv } from '../lib/env';
import { createRouter } from './routes';

const env = loadEnv();

const app = express();
app.set('trust proxy', true);

app.use(
  cors({
    origin: env.frontendOrigins,
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', createRouter(env.apiKey));

app.listen(env.port, '0.0.0.0', () => {
  console.log(`API listening on port ${env.port}`);
});
