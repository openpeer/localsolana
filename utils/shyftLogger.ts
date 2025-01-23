import fs from 'fs';
import path from 'path';

const isDevelopment = process.env.NODE_ENV === 'development';
const LOG_FILE = path.join(process.cwd(), 'logs', 'shyft-usage.log');

// Ensure logs directory exists in development
if (isDevelopment) {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

interface LogEntry {
  timestamp: string;
  operation: string;
  details: Record<string, any>;
}

export const logShyftOperation = (operation: string, details: Record<string, any>) => {
  if (!isDevelopment) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    operation,
    details
  };

  const logLine = JSON.stringify(entry) + '\n';

  fs.appendFile(LOG_FILE, logLine, (err) => {
    if (err) {
      console.error('Error writing to Shyft log file:', err);
    }
  });
}; 