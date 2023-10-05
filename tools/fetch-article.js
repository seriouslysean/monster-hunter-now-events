import { Command } from 'commander';

import { version } from '../src/utils/config.js';

import { fetchArticle } from '../src/fetch-all-articles.js';

// Invoke via `npm run fetch:article -- -u <url>`
// HAS EVENTS:
//    npm run fetch:article -- -u https://monsterhunternow.com/news/update-2023sep
//    npm run fetch:article -- -u https://monsterhunternow.com/news/diablos-invasion
//    npm run fetch:article -- -u https://monsterhunternow.com/news/oct-2023
// NO EVENTS:
//    npm run fetch:article -- -u https://monsterhunternow.com/news/tgs2023
//    npm run fetch:article -- -u https://monsterhunternow.com/news/oneokrock

const program = new Command();

program
    .name('mhne-test-article')
    .description('Test event parsing on an individual article by url')
    .option(
        '-u, --url <article>',
        'URL to the article from the Monster Hunter Now news website',
    )
    .version(version);

program.parse();
const { url } = program.opts();

fetchArticle(url);
