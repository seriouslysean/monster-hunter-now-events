import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import axios from 'axios';

import { paths } from './config.js';

function saveFile(path, filename, content) {
    const filePath = resolve(path, filename);
    const { extension } = filename.split(/\.(?=[^.]+$)/);

    try {
        let adaptedContent = content;
        if (extension === 'json' && typeof content !== 'string') {
            adaptedContent = JSON.stringify(content, null, 4);
            adaptedContent += '\n'; // Ensure new line at end of file :)
        }
        mkdirSync(resolve(filePath, '..'), { recursive: true });
        writeFileSync(filePath, adaptedContent, 'utf8');
    } catch (err) {
        console.error(`Unable to save ${filePath}`, err);
    }
}

export function saveFixtureFile(filename, content) {
    // The name will always be in the format YYYMMDD_article-name
    const [name] = filename.split(/\.(?=[^.]+$)/);
    const adaptedPath = resolve(paths.fixtures, name);
    saveFile(adaptedPath, filename, content);
}

export function saveDistFile(filename, content) {
    saveFile(paths.dist, filename, content);
}

function getFixture(filename, processor) {
    let data = null;
    try {
        const raw = readFileSync(resolve(paths.fixtures, filename), {
            encoding: 'utf8',
            flag: 'r',
        });
        data = processor(raw);
    } catch (err) {
        console.error(`Unable to open or process ${filename}`, err);
    }

    return data;
}

export function getHTMLFixture(filename) {
    const data = getFixture(filename, (raw) => raw);
    return { data };
}

export function getJSONFixture(filename) {
    return getFixture(filename, JSON.parse);
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

function getFilename(timestamp, slug, extension) {
    const date = getFormattedDate(timestamp);
    return `${date}_${slug}.${extension}`;
}

export function getHTMLFilename(timestamp, slug) {
    return getFilename(timestamp, slug, 'html');
}

export function getJSONFilename(timestamp, slug) {
    return getFilename(timestamp, slug, 'json');
}
