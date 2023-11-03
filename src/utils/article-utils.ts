import crypto from 'crypto';

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
import logger from './log-utils.js';

export const getSlugFromPath = (path) => path.substring(1).replace('/', '-');

export const generateEventUID = (start, end, summary) => {
    const uidComponents = `${start}${end}${summary}`;
    return crypto.createHash('sha1').update(uidComponents).digest('hex');
};

const fetchAndParse = async (url) => {
    logger.info(`Downloading html for ${url}`);
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

export async function getArticleByURL(url: string) {
    try {
        if (!url || !url.startsWith(mhnUrls.news)) {
            throw new Error(`Article url not valid: ${url}`);
        }
        logger.info(`Downloading html for ${url}`);
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
        articleJSON.meta = { timestamp, url };

        saveJSONFixture(articleId, articleJSON);
    } catch (err) {
        logger.error('Unable to fetch article', err);
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
        logger.info('No new news articles found');
        // Exit with status code 0 to gracefully allow the workflow to continue
        // this will prevent a hard error but allow next steps to be skipped
        process.exit(0);
    }

    logger.info('News articles downloaded', downloadedLinks);
}
