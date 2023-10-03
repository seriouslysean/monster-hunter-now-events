import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import axios from 'axios';

import { paths } from './config.js';

export function getHTMLFixture(filename) {
    let data = null;
    try {
        data = readFileSync(resolve(paths.fixtures, filename), {
            encoding: 'utf8',
            flag: 'r',
        });
    } catch (err) {
        console.error(`Unable to open ${filename}`);
    }
    return { data };
}

export function saveHTMLFixture(filename, html) {
    try {
        writeFileSync(resolve(paths.fixtures, filename), html, 'utf8');
    } catch (err) {
        console.error(`Unable to save ${filename}`);
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
    const USERAGENT =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';
    const response = await axios.get(url, {
        headers: {
            'User-Agent': USERAGENT,
        },
        responseType: 'text',
    });
    return response || { data: '' };
}
