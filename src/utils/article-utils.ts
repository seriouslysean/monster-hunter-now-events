import crypto from 'crypto';

import { parse } from 'node-html-parser';
import { getEventsFromHTML } from './chat-gpt';
import { mhnUrls } from './config';
import {
    getArticleId,
    getHTMLFixture,
    getPageHTML,
    getJSONFixture,
    saveHTMLFixture,
    saveJSONFixture,
} from './utils';

/*
NEXT STEPS
1. Abstract test-article logic in to shared utilities
2. Use shared utilities to download and save the articles using the main news index
    - Save news index HTML as a fixture?
3. Use fixture json data to combine in to a single events.json file
4. Use fixture json data to generate an ics file
*/

export const getSlugFromPath = (path) => path.substring(1).replace('/', '-');

export const generateEventUID = (start, end, summary) => {
    const uidComponents = `${start}${end}${summary}`;
    return crypto.createHash('sha1').update(uidComponents).digest('hex');
};

const fetchAndParse = async (url) => {
    console.log(`Downloading html for ${url}`);
    const { data: pageHTML } = await getPageHTML(url);
    return parse(pageHTML);
};

const getArticlePages = (document, currentPage = 1) => {
    const pages = new Set();
    document
        .querySelectorAll('#news [class^="_pagination"] a[href^="/news?page="]')
        .forEach((el) => {
            const page = parseInt(el.getAttribute('href').split('=')[1], 10);
            const href = el.getAttribute('href');
            if (page <= currentPage || !href) {
                return;
            }
            const url = `${mhnUrls.root}${href}`;
            pages.add(url);
        });
    return Array.from(pages);
};

export async function getArticleByURL(url) {
    try {
        if (!url || !url.startsWith(mhnUrls.news)) {
            throw new Error(`Article url not valid: ${url}`);
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
                ?.getAttribute('timestamp') ?? '',
            10,
        );

        if (!timestamp) {
            throw new Error(
                'Timestamp was empty or could not be parsed to integer',
            );
        }

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

export async function getArticles(force = false) {
    const downloadedLinks: string[] = [];
    const promiseFunctions: (() => Promise<void>)[] = [];

    // Get news page index
    const document = await fetchAndParse(mhnUrls.news);
    const pageUrls = getArticlePages(document);
    const pageDocuments = [document];

    // Gather all news pages
    for (let i = 0; i < pageUrls.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const pageDocument = await fetchAndParse(pageUrls[i]);
        pageDocuments.push(pageDocument);
    }

    pageDocuments.forEach((pageDocument) => {
        const anchors = pageDocument.querySelectorAll(
            '#news a[href^="/news/"]',
        );
        anchors.forEach((el) => {
            const path = el.getAttribute('href');
            if (!path) {
                return;
            }

            const url = `${mhnUrls.root}${path}`;

            const timestamp = parseInt(
                el.querySelector('[timestamp]')?.getAttribute('timestamp') ??
                    '',
                10,
            );

            if (!timestamp) {
                throw new Error(
                    'Timestamp was empty or could not be parsed to integer',
                );
            }

            const slug = getSlugFromPath(path);
            const articleId = getArticleId(timestamp, slug);
            const articleHTML = getHTMLFixture(articleId);
            const articleJSON = getJSONFixture(articleId);

            if (!force && articleHTML && articleJSON) {
                return;
            }

            promiseFunctions.push(async () => getArticleByURL(url));
            downloadedLinks.push(url);
        });
    });

    for (let i = 0; i < promiseFunctions.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await promiseFunctions[i]();
    }

    if (!downloadedLinks.length) {
        console.log('No new news articles found');
        return;
    }

    console.log('News articles downloaded', downloadedLinks);
}
