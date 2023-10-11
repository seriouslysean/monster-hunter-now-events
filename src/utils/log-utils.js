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
        });
    }

    return console;
}

const logger = getLogger();

export const log = (...args) => logger.log(...args);

export const warn = (...args) => logger.log(...args);

export const error = (...args) => logger.log(...args);
