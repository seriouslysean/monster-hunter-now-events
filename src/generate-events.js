import { parse } from 'node-html-parser';

import { getEventsFromHTML } from './utils/chat-gpt.js';
import { mhnUrls } from './utils/config.js';
import {
    getHTMLFixture,
    getPageHTML,
    saveFixture,
    getHTMLFilename,
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

async function getNewArticleURLs() {
    console.log(`Downloading html for ${mhnUrls.news}`);
    // eslint-disable-next-line no-await-in-loop
    const { data: newsHTML } = await getPageHTML(mhnUrls.news);
    if (!newsHTML) {
        throw new Error('No HTML returned');
    }
    const document = parse(newsHTML);
    const links = document
        .querySelectorAll('#news a[href^="/news/"]')
        .reduce((acc, el) => {
            const path = el.getAttribute('href');
            // Is this link valid?
            if (!path) {
                return acc;
            }
            // Do we already have the fixture?
            const url = `${mhnUrls.root}${path}`;
            const timestamp = parseInt(
                el.querySelector('[timestamp]').getAttribute('timestamp'),
                10,
            );
            const slug = getSlugFromPath(path);
            const filename = getHTMLFilename(timestamp, slug);
            let { data: articleHTML } = getHTMLFixture(filename);
            if (articleHTML) {
                return acc;
            }

            // If this is a valid link and we don't have a fixture, queue it up!
            return [...acc, url];
        }, []);
    // Get list of article links
    console.log(links);
}

async function getArticles() {}

getNewArticleURLs();

async function getNewsHTML() {
    let { data: html } = getHTMLFixture('news-index.html');
    if (!html) {
        console.log(`Downloading html for news index`);
        // eslint-disable-next-line no-await-in-loop
        ({ data: html } = await getPageHTML(mhnUrls.news));
        // Saving the fetched HTML data to the file system
        saveFixture('news-index.html', html);
    }
    const document = parse(html);
    const links = document.querySelectorAll('#news a[href^="/news/"]');
    if (!links.length) {
        console.log('No links found!');
        return;
    }
    const articleEvents = [];
    for (let i = 0; i < links.length; i += 1) {
        const link = links[i];
        const path = link.getAttribute('href') ?? '';
        const url = `${MHNRootUrl}${path}`;
        const timestamp = parseInt(
            link.querySelector('[timestamp]').getAttribute('timestamp'),
            10,
        );
        const slug = path.substring(1).replace('/', '-');
        const filename = getHTMLFilename(timestamp, slug);
        let { data: articleHTML } = getHTMLFixture(filename);
        if (!articleHTML) {
            console.log(`Downloading html for ${url}`);
            // eslint-disable-next-line no-await-in-loop
            ({ data: articleHTML } = await getPageHTML(url));
            // Saving the fetched HTML data to the file system
            saveFixture(filename, articleHTML);
        }
        // eslint-disable-next-line no-await-in-loop
        const events = await getEventsFromHTML(articleHTML);
        articleEvents.push(events);
    }
    console.log(articleEvents);
}

// getNewsHTML();
