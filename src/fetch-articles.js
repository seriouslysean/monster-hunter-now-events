import { parse } from 'node-html-parser';
import { getEventsFromHTML } from './utils/chat-gpt.js';
import { mhnUrls } from './utils/config.js';
import {
    getHTMLFixture,
    getPageHTML,
    saveFixture,
    getHTMLFilename,
    getJSONFilename,
    getJSONFixture,
} from './utils/utils.js';

/*
NEXT STEPS
1. Abstract test-article logic in to shared utilities
2. Use shared utilities to download and save the articles using the main news index
    - Save news index HTML as a fixture?
3. Use fixture json data to combine in to a single events.json file
4. Use fixture json data to generate an ics file
*/

const getSlugFromPath = (path) => path.substring(1).replace('/', '-');

async function getArticles() {
    console.log(`Downloading html for ${mhnUrls.news}`);
    // eslint-disable-next-line no-await-in-loop
    const { data: newsHTML } = await getPageHTML(mhnUrls.news);
    if (!newsHTML) {
        throw new Error('No HTML returned');
    }
    const document = parse(newsHTML);
    const links = [];
    const anchors = document.querySelectorAll('#news a[href^="/news/"]');
    for (let i = 0; i < anchors.length; i += 1) {
        const el = anchors[i];
        const path = el.getAttribute('href');

        // Is this link valid?
        if (!path) {
            // eslint-disable-next-line no-continue
            continue;
        }

        // Do we already have the fixture?
        const url = `${mhnUrls.root}${path}`;
        const timestamp = parseInt(
            el.querySelector('[timestamp]').getAttribute('timestamp'),
            10,
        );

        // Get HTML fixture
        const slug = getSlugFromPath(path);
        const htmlFilename = getHTMLFilename(timestamp, slug);
        let { data: articleHTML } = getHTMLFixture(htmlFilename);

        // Get JSON fixture
        const jsonFilename = getJSONFilename(timestamp, slug);
        let articleJSON = getJSONFixture(jsonFilename);

        // If we have a fixture of these events we don't need to add them
        if (articleHTML && articleJSON) {
            // eslint-disable-next-line no-continue
            continue;
        }

        // If this is a valid link and we don't have a fixture, queue it up!
        console.log(`Downloading html for ${url}`);
        // eslint-disable-next-line no-await-in-loop
        ({ data: articleHTML } = await getPageHTML(url));
        // Saving the fetched HTML data to the file system
        saveFixture(htmlFilename, articleHTML);

        // Also save the events output from ChatGPT
        console.log(`Downloading json for ${url}`);
        // eslint-disable-next-line no-await-in-loop
        articleJSON = await getEventsFromHTML(articleHTML, true);
        saveFixture(jsonFilename, articleJSON);

        // Add this url to the list of parsed events
        links.push(url);
    }

    // Get list of article links
    if (!links.length) {
        console.log('No new news articles found');
    }
}

getArticles();
