import dotenv from 'dotenv';

// Load environment-specific file first (e.g. .env.staging, .env.production).
const environment = process.env['ENV'] ?? 'local';
dotenv.config({ path: `.env.${environment}` });

// .env is a fallback — only fills in variables not already set above or by the system.
dotenv.config({ path: '.env' });

export interface AppConfig {
  baseApiUrl: string;
  baseUiUrl: string;
}

export const config: AppConfig = {
  baseApiUrl: process.env['BASE_API_URL'] ?? 'http://localhost:5058',
  baseUiUrl: process.env['BASE_UI_URL'] ?? 'http://localhost:5173',
};
