import http from 'http';
import url from 'url';
import fs from 'fs';

const PORT = 8080;
const index = fs.readFileSync('index.html');
const events = fs.readFileSync('./dist/events.json');

function createServer(req, res) {
    const path = url.parse(req.url).pathname;

    res.writeHead(200);

    switch (path) {
        case '/json':
            res.end(events);
            break;
        default:
            res.end(index);
            break;
    }
}

const server = http.createServer(createServer);
server.listen(PORT);
console.log('Server listeninng on port', PORT);
