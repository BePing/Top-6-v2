import * as fs from 'fs';
import * as path from 'path';
import { formatISO9075 } from 'date-fns';

export class LoggingService {
  private logPath: string;
  private logLevel: string = 'info';

  constructor() {
    this.logPath = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath);
    }
  }

  private formatMessage(level: string, message: string, data?: unknown): string {
    const timestamp = formatISO9075(new Date());
    const levelUpper = level.toUpperCase().padEnd(5);
    
    if (data) {
      return `[${timestamp}] ${levelUpper}: ${message} ${JSON.stringify(data, null, 2)}`;
    }
    return `[${timestamp}] ${levelUpper}: ${message}`;
  }

  private shouldLog(level: string): boolean {
    const levels = ['trace', 'debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  trace(message: string, data?: unknown): void {
    if (this.shouldLog('trace')) {
      console.log(this.formatMessage('trace', message, data));
    }
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, data?: unknown): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  }

  getLayerInfo(layer: string): string {
    return `=== ${layer} ===`;
  }

  setLogLevel(level: string): void {
    this.logLevel = level;
  }
}
