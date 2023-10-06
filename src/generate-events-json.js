// https://github.com/seriouslysean/monster-hunter-now-events/pull/3/commits/c4427b13954b6d8182d414d1a1396a411abef2ca

import { readdirSync } from 'fs';

import { paths } from './utils/config.js';
import { getJSONFixture, saveEventsJSON } from './utils/utils.js';

function getFixtureDirectoryNames() {
    try {
        const directoryEntries = readdirSync(paths.fixtures, {
            withFileTypes: true,
        });
        const directoryNames = directoryEntries
            .filter((entry) => entry.isDirectory())
            .map((directory) => directory.name)
            // Ensure we get the newest events first
            .sort((a, b) => b.split('_')[0] - a.split('_')[0]);
        return directoryNames;
    } catch (error) {
        console.error('Error reading the fixtures directory:', error);
        return [];
    }
}

function mergeEventFixtures(directoryNames) {
    const events = directoryNames.reduce(
        (acc, directoryName) => [
            ...acc,
            ...getJSONFixture(directoryName).events,
        ],
        [],
    );
    return {
        events,
    };
}

function generateEventsJSON() {
    console.log('Generating events.json');
    const directoryNames = getFixtureDirectoryNames();
    const mergedEvents = mergeEventFixtures(directoryNames);
    saveEventsJSON(mergedEvents);
}

generateEventsJSON();
