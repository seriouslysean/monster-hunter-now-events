import Rollbar from 'rollbar';
import winston from 'winston';

import { environment, version } from './config.js';

/* eslint consistent-return: off */
function getRollbarLogger(): Rollbar {
    if (process.env.ROLLBAR_ACCESS_TOKEN) {
        return new Rollbar({
            accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
            captureUncaught: true,
            captureUnhandledRejections: true,
            environment,
            payload: {
                code_version: version,
            },
        });
    }
}

function getWinstonLogger() {
    const formatMetadata = (metadata) => {
        const splat = metadata[Symbol.for('splat')];
        if (splat && splat.length) {
            return splat.length === 1
                ? JSON.stringify(splat[0])
                : JSON.stringify(splat);
        }
        return '';
    };

    return winston.createLogger({
        level: 'info',
        transports: [
            new winston.transports.Console({}),
            // TODO: Evalute if we want to add rollbard a transport from winston or call it from the facade
        ],
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            winston.format.printf(
                ({ level, message, label, timestamp, ...metadata }) =>
                    `${timestamp} ${
                        label || '-'
                    } ${level}: ${message} ${formatMetadata(metadata)}`,
            ),
            winston.format.splat(),
        ),
    });
}

class LoggingFacade {
    private rollbar: Rollbar;

    private logger: winston.Logger;

    constructor() {
        this.rollbar = getRollbarLogger();
        this.logger = getWinstonLogger();
    }

    error(message: string, ...args) {
        this.logger.error(message, ...args);
    }

    warn(message: string, ...args) {
        this.logger.warn(message, ...args);
    }

    info(message: string, ...args) {
        this.logger.info(message, ...args);
    }

    debug(message: string, ...args) {
        this.logger.debug(message, ...args);
    }
}

export default new LoggingFacade();
