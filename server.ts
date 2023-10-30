import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const port = process.env.PORT || 8080;
const app = express();

// Get the current directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.get('/dist/events.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(readFileSync('dist/events.json', 'utf8'));
});

app.get('/docs/assets/monster-hunter-now-logo.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs/assets/monster-hunter-now-logo.png'));
});

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(readFileSync('./index.html', 'utf8'));
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
