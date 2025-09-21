import winston from 'winston';
import { config } from '../config/env';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'supply-chain-backend' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    }),
  ],
});

if (config.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export const logRequest = (req: any, action: string, details?: any) => {
  logger.info(`${action}`, {
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    userRole: req.user?.role,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    details
  });
};

export default logger;