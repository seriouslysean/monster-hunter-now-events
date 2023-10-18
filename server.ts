import { createServer } from 'http';
import { parse } from 'url';
import { readFileSync } from 'fs';

const port = process.env.PORT || 8080;

function initServer(req: any, res: any) {
    const path = parse(req.url).pathname;
    console.log('current path: ', path);

    res.writeHead(200);
    if (path == '/dist/events.json') {
        res.end(readFileSync('dist/events.json'));
    } else {
        res.end(readFileSync('./index.html'));
    }
}

const server = createServer(initServer);
server.listen(port, () => {
    console.log('Server listeninng on port', port);
});
