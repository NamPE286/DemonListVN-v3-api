const isDevelopment = process.env.DEVELOPMENT === 'true';

export const API_URL = isDevelopment ? 'http://localhost:8787' : 'https://api.gdvn.net';
export const FRONTEND_URL = isDevelopment ? 'http://localhost:5173' : 'https://gdvn.net';
