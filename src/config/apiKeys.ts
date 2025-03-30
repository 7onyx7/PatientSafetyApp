// API Keys for external services
// In a production environment, these should be stored securely and not in source code

// FDA API key - Get your key from https://open.fda.gov/apis/authentication/
export const FDA_API_KEY = process.env.FDA_API_KEY || "";

// CDC API key - Get your key from CDC's API portal
export const CDC_API_KEY = process.env.CDC_API_KEY || "";

// Optional: Other healthcare-related API keys can be added here
export const HEALTH_DATA_API_KEY = process.env.HEALTH_DATA_API_KEY || "";

// Helper method to check if keys are configured
export const areApiKeysConfigured = (): boolean => {
  return !!(FDA_API_KEY || CDC_API_KEY);
};
