import { parse } from 'node-html-parser';
import { getEventsFromHTML } from './chat-gpt.js';
import { mhnUrls } from './config.js';
import {
    getArticleId,
    getHTMLFixture,
    getPageHTML,
    getJSONFixture,
    saveHTMLFixture,
    saveJSONFixture,
} from './utils.js';

/*
NEXT STEPS
1. Abstract test-article logic in to shared utilities
2. Use shared utilities to download and save the articles using the main news index
    - Save news index HTML as a fixture?
3. Use fixture json data to combine in to a single events.json file
4. Use fixture json data to generate an ics file
*/

export const getSlugFromPath = (path) => path.substring(1).replace('/', '-');

export async function fetchArticle(url) {
    try {
        if (!url || !url.startsWith(mhnUrls.news)) {
            throw new Error('Article url not valid', url);
        }
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
        const slug = getSlugFromPath(urlObj.pathname);
        const articleId = getArticleId(timestamp, slug);
        saveHTMLFixture(articleId, articleHTML);

        const articleJSON = await getEventsFromHTML(articleHTML, true);
        saveJSONFixture(articleId, articleJSON);
    } catch (err) {
        console.error('Unable to fetch article', err);
    }
}

export async function getArticles() {
    console.log(`Downloading html for ${mhnUrls.news}`);
    const { data: newsHTML } = await getPageHTML(mhnUrls.news);
    if (!newsHTML) {
        throw new Error('No HTML returned');
    }
    const links = [];
    const promiseFunctions = [];
    const document = parse(newsHTML);
    const anchors = document.querySelectorAll('#news a[href^="/news/"]');
    anchors.forEach((el) => {
        const path = el.getAttribute('href');
        if (!path) {
            return;
        }

        const url = `${mhnUrls.root}${path}`;
        const timestamp = parseInt(
            el.querySelector('[timestamp]').getAttribute('timestamp'),
            10,
        );

        const slug = getSlugFromPath(path);
        const articleId = getArticleId(timestamp, slug);
        const articleHTML = getHTMLFixture(articleId);
        const articleJSON = getJSONFixture(articleId);

        if (articleHTML && articleJSON) {
            return;
        }

        promiseFunctions.push(async () => fetchArticle(url));
        links.push(url);
    });

    for (let i = 0; i < promiseFunctions.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await promiseFunctions[i]();
    }

    if (!links.length) {
        console.log('No new news articles found');
        return;
    }

    console.log('News articles downloaded', links);
}
