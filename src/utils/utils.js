import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

import axios from 'axios';

import { paths } from './config.js';

function getFixture(filePath) {
    try {
        return readFileSync(filePath, {
            encoding: 'utf8',
            flag: 'r',
        });
    } catch (err) {
        console.error(`Unable to open or process ${filePath}`);
    }

    return null;
}

export function getHTMLFixture(articleId) {
    const filePath = resolve(paths.fixtures, articleId, 'index.html');
    return getFixture(filePath);
}

export function getJSONFixture(articleId) {
    const filePath = resolve(paths.fixtures, articleId, 'events.json');
    const data = getFixture(filePath);
    return data ? JSON.parse(data) : { events: [] };
}

export async function getPageHTML(url) {
    try {
        const USERAGENT =
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';
        return axios.get(url, {
            headers: {
                'User-Agent': USERAGENT,
            },
            responseType: 'text',
        });
    } catch (err) {
        console.error(err);
        return { data: '' };
    }
}

export function getFormattedDate(time) {
    const date = new Date();
    // Set the original time if we have it
    if (time) {
        date.setTime(time);
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

export function getArticleId(timestamp, slug) {
    const date = getFormattedDate(timestamp);
    return `${date}_${slug}`;
}

function saveFixture(path, content) {
    try {
        const pathName = dirname(path);
        mkdirSync(pathName, { recursive: true });
        writeFileSync(path, content, 'utf8');
    } catch (err) {
        console.error(`Unable to save ${path}`, err);
    }
}

export function saveHTMLFixture(articleId, content) {
    const filePath = resolve(paths.fixtures, articleId, 'index.html');
    saveFixture(filePath, content);
}

export function saveJSONFixture(articleId, content) {
    const filePath = resolve(paths.fixtures, articleId, 'events.json');
    // This lets us direcly pass in json to be saved
    const adaptedContent = JSON.stringify(content, null, 4);
    saveFixture(filePath, adaptedContent);
}
