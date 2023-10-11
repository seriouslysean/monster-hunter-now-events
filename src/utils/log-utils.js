import Rollbar from 'rollbar';

import { environment, version } from './config.js';

function getLogger() {
    if (process.env.ROLLBAR_ACCESS_TOKEN) {
        return new Rollbar({
            accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
            captureUncaught: true,
            captureUnhandledRejections: true,
            environment,
            payload: {
                code_version: version,
            },
            // Also log to the console
            verbose: true,
        });
    }

    return console;
}

const logger = getLogger();

export const log = (...args) => logger.log(...args);

export const warn = (...args) => logger.warn(...args);

export const error = (...args) => logger.error(...args);
