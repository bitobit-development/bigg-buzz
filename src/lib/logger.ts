import winston from 'winston'
import { maskSensitiveData } from './security'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'warn'
}

// Define colors for different log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
)

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),

  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
]

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
})

// Custom logger interface for the application
class AppLogger {
  private logger: winston.Logger

  constructor() {
    this.logger = logger
  }

  error(message: string, meta?: any) {
    const safeMeta = meta ? maskSensitiveData(meta) : undefined
    this.logger.error(message, safeMeta)
  }

  warn(message: string, meta?: any) {
    const safeMeta = meta ? maskSensitiveData(meta) : undefined
    this.logger.warn(message, safeMeta)
  }

  info(message: string, meta?: any) {
    const safeMeta = meta ? maskSensitiveData(meta) : undefined
    this.logger.info(message, safeMeta)
  }

  http(message: string, meta?: any) {
    const safeMeta = meta ? maskSensitiveData(meta) : undefined
    this.logger.http(message, safeMeta)
  }

  debug(message: string, meta?: any) {
    const safeMeta = meta ? maskSensitiveData(meta) : undefined
    this.logger.debug(message, safeMeta)
  }

  // Specific methods for different types of events
  authEvent(event: string, userId?: string, meta?: any) {
    this.info(`AUTH: ${event}`, {
      userId,
      event,
      ...meta,
    })
  }

  securityEvent(event: string, level: 'info' | 'warn' | 'error' = 'warn', meta?: any) {
    this[level](`SECURITY: ${event}`, meta)
  }

  complianceEvent(event: string, userId?: string, meta?: any) {
    this.info(`COMPLIANCE: ${event}`, {
      userId,
      event,
      compliance: true,
      ...meta,
    })
  }

  apiRequest(method: string, path: string, statusCode: number, responseTime: number, meta?: any) {
    this.http(`${method} ${path} ${statusCode} - ${responseTime}ms`, meta)
  }

  dbQuery(query: string, duration: number, meta?: any) {
    this.debug(`DB: ${query} - ${duration}ms`, meta)
  }

  businessEvent(event: string, meta?: any) {
    this.info(`BUSINESS: ${event}`, meta)
  }

  performanceMetric(metric: string, value: number, unit: string, meta?: any) {
    this.info(`PERFORMANCE: ${metric}=${value}${unit}`, meta)
  }
}

// Create and export singleton instance
export const appLogger = new AppLogger()

// Export the winston logger for direct access if needed
export { logger }

// Ensure log directory exists
import fs from 'fs'
import path from 'path'

const logDir = 'logs'
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}