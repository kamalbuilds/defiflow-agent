import { createWriteStream } from 'fs';
import { join } from 'path';

export interface LogLevel {
  ERROR: number;
  WARN: number;
  INFO: number;
  DEBUG: number;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_LEVEL_NAMES = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

class Logger {
  private logLevel: number;
  private logToFile: boolean;
  private logStream?: NodeJS.WritableStream;

  constructor() {
    this.logLevel = LOG_LEVELS[process.env.LOG_LEVEL as keyof LogLevel] ?? LOG_LEVELS.INFO;
    this.logToFile = process.env.LOG_TO_FILE === 'true';

    if (this.logToFile) {
      const logDir = process.env.LOG_DIR || './logs';
      const logFile = join(logDir, 'defiflow-agent.log');
      this.logStream = createWriteStream(logFile, { flags: 'a' });
    }
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  private log(level: number, message: string, meta?: any): void {
    if (level > this.logLevel) return;

    const levelName = LOG_LEVEL_NAMES[level];
    const formattedMessage = this.formatMessage(levelName, message, meta);

    // Console output with colors
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[90m', // Gray
      RESET: '\x1b[0m'
    };

    const color = colors[levelName as keyof typeof colors] || colors.RESET;
    console.log(`${color}${formattedMessage}${colors.RESET}`);

    // File output
    if (this.logToFile && this.logStream) {
      this.logStream.write(`${formattedMessage}\n`);
    }
  }

  error(message: string, meta?: any): void {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message: string, meta?: any): void {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message: string, meta?: any): void {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }

  // Utility method for HTTP request logging
  request(method: string, url: string, statusCode: number, duration: number): void {
    this.info(`${method} ${url} ${statusCode} - ${duration}ms`);
  }

  // Utility method for performance timing
  time(label: string): void {
    console.time(`[PERF] ${label}`);
  }

  timeEnd(label: string): void {
    console.timeEnd(`[PERF] ${label}`);
  }

  // Graceful shutdown
  async close(): Promise<void> {
    if (this.logStream && 'end' in this.logStream) {
      return new Promise((resolve) => {
        this.logStream!.end(() => resolve());
      });
    }
  }
}

export const logger = new Logger();