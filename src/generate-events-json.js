import { readdirSync } from 'fs';

import { paths } from './utils/config.js';
// import { getDedupedJSON } from './utils/chat-gpt.js';
import { getJSONFixture, saveEventsJSON } from './utils/utils.js';

function getFixtureDirectoryNames() {
    try {
        const directoryEntries = readdirSync(paths.fixtures, {
            withFileTypes: true,
        });
        const directoryNames = directoryEntries
            .filter((entry) => entry.isDirectory())
            .map((directory) => directory.name)
            .sort((a, b) => b.split('_')[0] - a.split('_')[0]);
        return directoryNames;
    } catch (error) {
        console.error('Error reading the fixtures directory:', error);
        return [];
    }
}

// Merge all event fixtures into one array
function mergeEventFixtures(directoryNames) {
    const events = directoryNames.reduce(
        (acc, directoryName) => [
            ...acc,
            ...getJSONFixture(directoryName).events,
        ],
        [],
    );

    // Sort events based on the start date in descending order (newest first)
    events.sort((a, b) => {
        const aStartDate = a.dates && a.dates[0] ? a.dates[0].start : '';
        const bStartDate = b.dates && b.dates[0] ? b.dates[0].start : '';
        // Sorts in descending order
        return bStartDate.localeCompare(aStartDate);
    });

    return {
        events,
    };
}

async function generateEventsJSON() {
    console.log('Generating events.json');
    const directoryNames = getFixtureDirectoryNames();
    const mergedEvents = mergeEventFixtures(directoryNames);
    saveEventsJSON(mergedEvents);
    // TODO: Dedupe events.json by combining similar events, maybe via ChatGPT?
    // console.log('Deduping events.json');
    // const dedupedJSON = await getDedupedJSON(mergedEvents, true);
    // saveEventsJSON(dedupedJSON);
}

generateEventsJSON();
