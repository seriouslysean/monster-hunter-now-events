import { createServer } from 'http';
import { parse } from 'url';
import { readFileSync } from 'fs';
// import { paths } from './src/utils/config';
// import { join } from 'path';

const port = process.env.PORT || 8080;
// const eventsFile = join(paths['dist'], 'events.json');
// const defaultFile = join(paths['root'], 'index.html');

function initServer(req: any, res: any) {
    const path = parse(req.url).pathname;
    console.log('current path: ', path);

    res.writeHead(200);
    if (path == '/dist/events.json') {
        res.end(readFileSync('dist/events.json'));
    } else {
        res.end(readFileSync('./index.html'));
    }

    // if (path == '/dist/events.json') {
    //     res.end(readFileSync(eventsFile));
    // } else {
    //     res.end(readFileSync(defaultFile));
    // }
}

const server = createServer(initServer);
server.listen(port, () => {
    console.log('Server listeninng on port', port);
});
