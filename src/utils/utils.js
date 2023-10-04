import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import axios from 'axios';

import { paths } from './config.js';

function getFilePathComponents(filename) {
    const [slug, extension] = filename.split(/\.(?=[^.]+$)/);
    const folderPath = resolve(paths.fixtures, slug);
    const fileName = {
        html: 'index.html',
        json: 'events.json',
    }[extension];
    const filePath = resolve(folderPath, fileName);

    return { slug, extension, folderPath, fileName, filePath };
}

export function getHTMLFixture(filename) {
    let data = null;
    const { filePath } = getFilePathComponents(filename);

    try {
        data = readFileSync(filePath, {
            encoding: 'utf8',
            flag: 'r',
        });
    } catch (err) {
        console.error(`Unable to open ${filename}`);
    }

    return { data };
}

export function saveFixture(filename, content) {
    const { extension, folderPath, filePath } = getFilePathComponents(filename);

    try {
        let adaptedContent = content;
        if (extension === 'json' && typeof content !== 'string') {
            adaptedContent = JSON.stringify(content, null, 4);
            adaptedContent += '\n'; // Ensure new line at end of file :)
        }
        mkdirSync(folderPath, { recursive: true });
        writeFileSync(filePath, adaptedContent, 'utf8');
    } catch (err) {
        console.error(`Unable to save ${filePath}`, err);
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

export function getHTMLFilename(...args) {
    return getFilename(...args, 'html');
}

export function getJSONFilename(...args) {
    return getFilename(...args, 'json');
}
