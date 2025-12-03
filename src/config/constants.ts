const isDevelopment = process.env.DEVELOPMENT === 'true';

export const API_URL = isDevelopment ? 'http://localhost:8080' : 'https://api.demonlistvn.com';
export const FRONTEND_URL = isDevelopment ? 'http://localhost:5173' : 'https://demonlistvn.com';
