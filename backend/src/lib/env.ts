import 'dotenv/config';

export interface EnvConfig {
  databaseUrl: string;
  port: number;
  apiKey: string;
  incidentFailureThreshold: number;
  checkTimeoutMs: number;
  frontendOrigins: string[];
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadEnv(): EnvConfig {
  return {
    databaseUrl: requireEnv('DATABASE_URL'),
    port: Number(process.env.PORT ?? 3000),
    apiKey: requireEnv('API_KEY'),
    incidentFailureThreshold: Number(process.env.INCIDENT_FAILURE_THRESHOLD ?? 3),
    checkTimeoutMs: Number(process.env.CHECK_TIMEOUT_MS ?? 10_000),
    frontendOrigins: (process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  };
}
