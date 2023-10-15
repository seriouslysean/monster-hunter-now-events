import { environment, version } from '../src/utils/config.js';
import logger from '../src/utils/log-utils.js';

// Invoke via `npm run test:logger`

// // Standard log
logger.info('This is a standard log with an object!', {
    environment,
    version,
    type: 'standard',
});

// Warning log
logger.warn('This is a warning log with multiple params!', {
    environment,
    version,
    type: 'warning',
});

// Error log
logger.error(
    'This is an error log with different types',
    [environment],
    { version },
    'error',
    500,
);
