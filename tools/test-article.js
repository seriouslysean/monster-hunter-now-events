import { Command } from 'commander';
import { parse } from 'node-html-parser';

import { getEventsFromHTML } from '../src/utils/chat-gpt.js';
import { version } from '../src/utils/config.js';
import {
    getHTMLFilename,
    getJSONFilename,
    getPageHTML,
    saveFixtureFile,
} from '../src/utils/utils.js';

// Invoke via `npm run test:article -- -u <url>`
// HAS EVENTS:
//    npm run test:article -- -u https://monsterhunternow.com/news/diablos-invasion
// NO EVENTS:
//    npm run test:article -- -u https://monsterhunternow.com/news/update-2023sep

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

if (!url) {
    console.error('Article url not provided');
    process.exit(1);
}

async function testArticle() {
    try {
        console.log(`Downloading html for ${url}`);
        // eslint-disable-next-line no-await-in-loop
        const { data: articleHTML } = await getPageHTML(url);
        if (!articleHTML) {
            throw new Error('No HTML returned');
        }
        const document = parse(articleHTML);
        // Saving the fetched HTML data to the file system
        const timestamp = parseInt(
            document
                .querySelector('[class^="_headline_"] [timestamp]')
                .getAttribute('timestamp'),
            10,
        );
        const urlObj = new URL(url);
        const slug = urlObj.pathname.substring(1).replace('/', '-');
        const htmlFilename = getHTMLFilename(timestamp, slug);
        saveFixtureFile(htmlFilename, articleHTML);

        const articleJSON = await getEventsFromHTML(articleHTML, true);
        const jsonFilename = getJSONFilename(timestamp, slug);
        saveFixtureFile(jsonFilename, articleJSON);
    } catch (err) {
        console.error('Unable to fetch article', err);
    }
}

testArticle();
