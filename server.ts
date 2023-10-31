import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const port = process.env.PORT || 8080;
const app = express();

// Get the current directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create an Express router for the subdirectory
const subdirectory = express.Router();

// Serve '/monster-hunter-now-events/dist/events.json' as '/dist/events.json'
subdirectory.get('/dist/events.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(readFileSync('dist/events.json', 'utf8'));
});

// Serve '/monster-hunter-now-events/docs/assets/monster-hunter-now-logo.png' as '/docs/assets/monster-hunter-now-logo.png'
subdirectory.get('/docs/assets/monster-hunter-now-logo.png', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'docs/assets/monster-hunter-now-logo.png'),
    );
});

// Serve the homepage from the subdirectory
subdirectory.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(readFileSync('./index.html', 'utf8'));
});

// Mount the subdirectory at '/monster-hunter-now-events'
app.use('/monster-hunter-now-events', subdirectory);

// Redirect the root URL to the subdirectory index
app.get('/', (req, res) => {
    res.redirect('/monster-hunter-now-events/');
});

app.listen(port, () => {
    console.log(`

                           __
                          / _)  - Listening on port ${port}
                 _/|/|/|_/ /
               _|         /
             _|  (  | (  |
            /__.-'|_|--|_|

`);
});
