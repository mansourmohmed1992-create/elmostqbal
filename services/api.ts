// Dynamic API URL based on environment
export const getApiUrl = (): string => {
  // For Vercel deployment, use environment variable or production URL
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Default to localhost for local development
  return 'http://localhost:4000';
};

export const API_URL = getApiUrl();
