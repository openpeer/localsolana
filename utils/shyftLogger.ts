const isDevelopment = process.env.NODE_ENV === 'development';

interface LogEntry {
  timestamp: string;
  operation: string;
  type: 'RPC' | 'API';
  details: Record<string, any>;
  creditCost: number;
}

export const logShyftOperation = (operation: string, details: Record<string, any>) => {
  if (!isDevelopment) return;

  // Determine operation type and credit cost
  let type: 'RPC' | 'API' = 'RPC';
  let creditCost = 1; // Default RPC cost

  // If we add any API operations in the future, we can set them here
  if (operation === 'someAPIOperation') {
    type = 'API';
    creditCost = 100;
  }

  // Log to console in development with color coding
  console.log(
    `[Shyft Operation] ${type} (${creditCost} credits):`,
    {
      operation,
      ...details,
      timestamp: new Date().toISOString()
    }
  );
};

// Helper function to get all logs
export const getShyftLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('shyft-logs') || '[]');
  } catch {
    return [];
  }
};

// Helper function to clear logs
export const clearShyftLogs = () => {
  localStorage.removeItem('shyft-logs');
}; 