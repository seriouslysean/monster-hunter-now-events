import { parse } from 'node-html-parser';

import { getEventsFromHTML } from './utils/chat-gpt.js';
import {
    getFormattedDate,
    getHTMLFixture,
    getPageHTML,
    saveHTMLFixture,
} from './utils/utils.js';

const MHNRootUrl = 'https://monsterhunternow.com';
const MHNNewsUrl = `${MHNRootUrl}/news`;

function getFilenameByArticle(article) {
    const { date: rawDate, slug } = article;
    const date = getFormattedDate(rawDate);
    return `${date}_${slug}.html`;
}

async function getNewsHTML() {
    let { data: html } = getHTMLFixture('news-index.html');
    if (!html) {
        console.log(`Downloading html for news index`);
        // eslint-disable-next-line no-await-in-loop
        ({ data: html } = await getPageHTML(MHNNewsUrl));
        // Saving the fetched HTML data to the file system
        saveHTMLFixture('news-index.html', html);
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
        const article = {
            path,
            url: `${MHNRootUrl}${path}`,
            date: parseInt(
                link.querySelector('[timestamp]').getAttribute('timestamp'),
                10,
            ),
            slug: path.substring(1).replace('/', '-'),
        };
        const filename = getFilenameByArticle(article);
        let { data: articleHTML } = getHTMLFixture(filename);
        if (!articleHTML) {
            console.log(`Downloading html for ${article.url}`);
            // eslint-disable-next-line no-await-in-loop
            ({ data: articleHTML } = await getPageHTML(article.url));
            // Saving the fetched HTML data to the file system
            saveHTMLFixture(filename, articleHTML);
        }
        // eslint-disable-next-line no-await-in-loop
        const events = await getEventsFromHTML(articleHTML);
        articleEvents.push(events);
    }
    console.log(articleEvents);
}

getNewsHTML();
