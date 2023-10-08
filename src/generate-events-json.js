import { readdirSync } from 'fs';
import crypto from 'crypto';
import { paths } from './utils/config.js';
import { getJSONFixture, saveEventsJSON } from './utils/utils.js';

// Check if two dates are consecutive
function isConsecutiveDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() + 1 === d2.getDate() &&
        d1.getHours() === d2.getHours() &&
        d1.getMinutes() === d2.getMinutes()
    );
}

const generateEventUID = (start, end, summary) => {
    const uidComponents = `${start}${end}${summary}`;
    return crypto.createHash('sha1').update(uidComponents).digest('hex');
};

// Adapt the events by merging consecutive dates and adding a numberOfDays key
const adaptEventWithDays = (event) => {
    const adaptedDates = [];

    let i = 0;
    while (i < event.dates.length) {
        const date = { ...event.dates[i] };
        let numberOfDays = 1;

        while (
            i + numberOfDays < event.dates.length &&
            isConsecutiveDay(
                event.dates[i + numberOfDays - 1].start,
                event.dates[i + numberOfDays].start,
            )
        ) {
            numberOfDays += 1;
        }

        date.end = event.dates[i + numberOfDays - 1].end;
        date.numberOfDays = numberOfDays;
        date.uid = generateEventUID(date.start, date.end, event.summary);

        adaptedDates.push(date);
        i += numberOfDays;
    }

    return {
        ...event,
        dates: adaptedDates,
    };
};

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
            ...getJSONFixture(directoryName).events.map(adaptEventWithDays),
        ],
        [],
    );
    return {
        events,
    };
}

// Main function to generate the events JSON file
function generateEventsJSON() {
    console.log('Generating events.json');
    const directoryNames = getFixtureDirectoryNames();
    const mergedEvents = mergeEventFixtures(directoryNames);
    saveEventsJSON(mergedEvents);
}

generateEventsJSON();
