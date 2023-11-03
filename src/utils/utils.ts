import crypto from 'crypto';

import {
    existsSync,
    mkdirSync,
    readFileSync,
    unlinkSync,
    writeFileSync,
} from 'fs';
import { dirname, resolve } from 'path';

import axios from 'axios';

import { paths } from './config.js';
import logger from './log-utils.js';

export function stringifyJSON(data) {
    return JSON.stringify(data, null, 4);
}

export function getHash(str) {
    return crypto.createHash('sha1').update(str).digest('base64');
}

export function stripTags(input: string, allowed: string = ''): string {
    const allowedTags: string =
        (allowed || '')
            .toLowerCase()
            .match(/<[a-z][a-z0-9]*>/g)
            ?.join('') || '';

    const tags: RegExp = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    const commentsAndPhpTags: RegExp =
        /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;

    return input
        .replace(commentsAndPhpTags, '')
        .replace(tags, ($0: string, $1: string) =>
            allowedTags.indexOf(`<${$1.toLowerCase()}>`) > -1 ? $0 : '',
        );
}

function getFile(filePath) {
    try {
        return readFileSync(filePath, {
            encoding: 'utf8',
            flag: 'r',
        });
    } catch (err) {
        const pathFromRoot = filePath.replace(paths.root, '');
        logger.error(`File not found: ${pathFromRoot}`);
    }

    return null;
}

function saveFile(path, content) {
    try {
        const pathName = dirname(path);

        // Check if the file already exists, if so, delete it
        if (existsSync(path)) {
            unlinkSync(path);
        }

        mkdirSync(pathName, { recursive: true });
        writeFileSync(path, content, 'utf8');
    } catch (err) {
        logger.error(`Unable to save ${path}`, err);
    }
}

export function getHTMLFixture(articleId) {
    const filePath = resolve(paths.fixtures, articleId, 'index.html');
    return getFile(filePath);
}

export function getJSONFixture(articleId) {
    const filePath = resolve(paths.fixtures, articleId, 'events.json');
    const data = getFile(filePath);
    return data ? JSON.parse(data) : { events: [] };
}

export function getRawJSONHash() {
    const filePath = resolve(paths.dist, 'events.raw.json');
    const fileContents = getFile(filePath);
    return getHash(fileContents);
}

export async function getPageHTML(url) {
    try {
        const USERAGENT =
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';
        return await axios.get(url, {
            headers: {
                'User-Agent': USERAGENT,
            },
            responseType: 'text',
        });
    } catch (err) {
        logger.error(err);
        return { data: '' };
    }
}

export function getFormattedDate(time) {
    const date = new Date();
    // Set the original time if we have it
    if (time) {
        date.setTime(time);
    }
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

export function getArticleId(timestamp, slug) {
    const date = getFormattedDate(timestamp);
    return `${date}_${slug}`;
}

export function getEventsJSON() {
    const filePath = resolve(paths.dist, 'events.json');
    try {
        const data = readFileSync(filePath, {
            encoding: 'utf8',
            flag: 'r',
        });
        return JSON.parse(data);
    } catch (err) {
        const pathFromRoot = filePath.replace(paths.dist, '');
        logger.error(`Events not found: ${pathFromRoot}`);
    }

    return null;
}

export function getEventsJSONHash() {
    try {
        const { hash } = getEventsJSON();
        return hash;
    } catch (err) {
        logger.error(`Event hash not found`);
    }

    return '';
}

export function saveHTMLFixture(articleId, content) {
    const filePath = resolve(paths.fixtures, articleId, 'index.html');
    saveFile(filePath, content);
}

export function saveJSONFixture(articleId, content) {
    const filePath = resolve(paths.fixtures, articleId, 'events.json');
    // This lets us direcly pass in json to be saved
    const adaptedContent = stringifyJSON(content);
    saveFile(filePath, adaptedContent);
}

export function saveEventsJSON(content, raw = true) {
    const filePath = resolve(paths.dist, `events${raw ? '.raw' : ''}.json`);
    // This lets us direcly pass in json to be saved
    const adaptedContent = stringifyJSON(content);
    logger.info(`Saving ${filePath}`, adaptedContent);
    saveFile(filePath, adaptedContent);
}

export function saveEventsICS(content) {
    const filePath = resolve(paths.dist, 'events.ics');
    saveFile(filePath, content);
}
