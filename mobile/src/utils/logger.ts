import AsyncStorage from '@react-native-async-storage/async-storage';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stackTrace?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.INFO;
  private maxLogEntries = 1000;
  private logStorageKey = 'app_logs';

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public async debug(category: string, message: string, data?: any): Promise<void> {
    await this.log(LogLevel.DEBUG, category, message, data);
  }

  public async info(category: string, message: string, data?: any): Promise<void> {
    await this.log(LogLevel.INFO, category, message, data);
  }

  public async warn(category: string, message: string, data?: any): Promise<void> {
    await this.log(LogLevel.WARN, category, message, data);
  }

  public async error(category: string, message: string, error?: Error | any, data?: any): Promise<void> {
    const stackTrace = error instanceof Error ? error.stack : undefined;
    await this.log(LogLevel.ERROR, category, message, data, stackTrace);
  }

  private async log(level: LogLevel, category: string, message: string, data?: any, stackTrace?: string): Promise<void> {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      stackTrace,
    };

    // Console logging with color coding
    this.logToConsole(entry);

    // Store to AsyncStorage for debugging
    await this.storeLog(entry);
  }

  private logToConsole(entry: LogEntry): void {
    const { timestamp, level, category, message, data, stackTrace } = entry;
    const timeStr = new Date(timestamp).toLocaleTimeString();
    const logMessage = `[${timeStr}] [${LogLevel[level]}] [${category}] ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.log(`🔍 ${logMessage}`, data || '');
        break;
      case LogLevel.INFO:
        console.info(`ℹ️ ${logMessage}`, data || '');
        break;
      case LogLevel.WARN:
        console.warn(`⚠️ ${logMessage}`, data || '');
        break;
      case LogLevel.ERROR:
        console.error(`❌ ${logMessage}`, data || '');
        if (stackTrace) {
          console.error('Stack trace:', stackTrace);
        }
        break;
    }
  }

  private async storeLog(entry: LogEntry): Promise<void> {
    try {
      const existingLogs = await this.getLogs();
      const updatedLogs = [...existingLogs, entry];

      // Keep only the most recent logs
      if (updatedLogs.length > this.maxLogEntries) {
        updatedLogs.splice(0, updatedLogs.length - this.maxLogEntries);
      }

      await AsyncStorage.setItem(this.logStorageKey, JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Failed to store log entry:', error);
    }
  }

  public async getLogs(): Promise<LogEntry[]> {
    try {
      const logsJson = await AsyncStorage.getItem(this.logStorageKey);
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (error) {
      console.error('Failed to retrieve logs:', error);
      return [];
    }
  }

  public async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.logStorageKey);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  public async exportLogs(): Promise<string> {
    try {
      const logs = await this.getLogs();
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('Failed to export logs:', error);
      return '';
    }
  }

  // Specific method for API calls
  public async logApiCall(
    method: string,
    url: string,
    requestData?: any,
    responseData?: any,
    statusCode?: number,
    error?: Error
  ): Promise<void> {
    const message = `${method.toUpperCase()} ${url} - Status: ${statusCode || 'N/A'}`;
    const data = {
      method,
      url,
      requestData,
      responseData,
      statusCode,
    };

    if (error) {
      await this.error('API', `${message} - Failed`, error, data);
    } else {
      await this.info('API', message, data);
    }
  }

  // Specific method for auth operations
  public async logAuth(operation: string, success: boolean, details?: any): Promise<void> {
    const message = `${operation} ${success ? 'successful' : 'failed'}`;
    if (success) {
      await this.info('AUTH', message, details);
    } else {
      await this.error('AUTH', message, undefined, details);
    }
  }

  // Specific method for navigation
  public async logNavigation(from: string, to: string, params?: any): Promise<void> {
    await this.debug('NAVIGATION', `${from} -> ${to}`, params);
  }

  // Specific method for user actions
  public async logUserAction(action: string, details?: any): Promise<void> {
    await this.info('USER_ACTION', action, details);
  }
}

// Create singleton instance
const logger = Logger.getInstance();

// Export convenience functions
export const logDebug = (category: string, message: string, data?: any) => 
  logger.debug(category, message, data);

export const logInfo = (category: string, message: string, data?: any) => 
  logger.info(category, message, data);

export const logWarn = (category: string, message: string, data?: any) => 
  logger.warn(category, message, data);

export const logError = (category: string, message: string, error?: Error | any, data?: any) => 
  logger.error(category, message, error, data);

export const logApiCall = (
  method: string,
  url: string,
  requestData?: any,
  responseData?: any,
  statusCode?: number,
  error?: Error
) => logger.logApiCall(method, url, requestData, responseData, statusCode, error);

export const logAuth = (operation: string, success: boolean, details?: any) => 
  logger.logAuth(operation, success, details);

export const logNavigation = (from: string, to: string, params?: any) => 
  logger.logNavigation(from, to, params);

export const logUserAction = (action: string, details?: any) => 
  logger.logUserAction(action, details);

export const exportLogs = () => logger.exportLogs();
export const clearLogs = () => logger.clearLogs();
export const getLogs = () => logger.getLogs();

export default logger;