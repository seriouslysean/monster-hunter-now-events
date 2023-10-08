import { readdirSync } from 'fs';
import crypto from 'crypto';

import { isSameDay, startOfDay, endOfDay, parse } from 'date-fns';

import { paths } from './utils/config.js';
import { isConsecutiveDay } from './utils/date-utils.js';
import { getJSONFixture, saveEventsJSON } from './utils/utils.js';

const generateEventUID = (start, end, summary) => {
    const uidComponents = `${start}${end}${summary}`;
    return crypto.createHash('sha1').update(uidComponents).digest('hex');
};

const adaptEventWithDays = (event) => {
    const adaptedDates = [];

    let i = 0;
    while (i < event.dates.length) {
        const date = { ...event.dates[i] };
        let frequencyCount = date.frequency ? date.frequency.count : 1;

        const hasSameTime = (index) => {
            const currentEndTime = event.dates[index].end.split(' ')[1];
            const currentStartTime = event.dates[index].start.split(' ')[1];
            const nextEndTime = event.dates[index + 1]
                ? event.dates[index + 1].end.split(' ')[1]
                : null;
            const nextStartTime = event.dates[index + 1]
                ? event.dates[index + 1].start.split(' ')[1]
                : null;

            return (
                currentEndTime === nextEndTime &&
                currentStartTime === nextStartTime
            );
        };

        while (
            i + frequencyCount < event.dates.length &&
            isConsecutiveDay(
                event.dates[i + frequencyCount - 1].start,
                event.dates[i + frequencyCount].start,
            ) &&
            hasSameTime(i + frequencyCount - 1)
        ) {
            frequencyCount += 1;
        }

        if (frequencyCount > 1) {
            date.frequency = {
                type: 'DAILY',
                count: frequencyCount,
            };
        }

        date.uid = generateEventUID(date.start, date.end, event.summary);

        // Determine if it's an all-day event
        const startDate = parse(date.start, 'yyyy-MM-dd HH:mm:ss', new Date());
        const endDate = parse(date.end, 'yyyy-MM-dd HH:mm:ss', new Date());
        date.isAllDay =
            isSameDay(startDate, startOfDay(startDate)) &&
            isSameDay(endDate, endOfDay(endDate));

        adaptedDates.push(date);
        i += frequencyCount;
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

// Main function to generate the events JSON file
function generateEventsJSON() {
    console.log('Generating events.json');
    const directoryNames = getFixtureDirectoryNames();
    const mergedEvents = mergeEventFixtures(directoryNames);
    saveEventsJSON(mergedEvents);
}

generateEventsJSON();
