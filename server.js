import { createServer } from 'http';
import { parse, fileURLToPath } from 'url';
import { readFileSync, readdir } from 'fs';
import { configDotenv } from 'dotenv';
import { extname, dirname, join } from 'path';

const port = process.env.PORT || 8080;
function initServer(req, res) {
    const path = parse(req.url).pathname;
    console.log('current path: ', path);

    res.writeHead(200);

    switch (path) {
        case '/index.html':
            res.end(readFileSync('index.html'));
            break;
        case '/dist/events.json':
            res.end(readFileSync('dist/events.json'));
            break;
        default:
            res.end('No file found.');
            break;
    }
}

const server = createServer(initServer);
server.listen(port, () => {
    console.log('Server listeninng on port', port);
});
