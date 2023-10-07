import crypto from 'crypto';
import { getEventsJSON, saveEventsICS } from './utils/utils.js';

const { events } = getEventsJSON();

const LINE_BREAK = '\r\n';

const wordWrap = (heading, content) => {
    const lineLength = 75;
    const continuationPrefix = `${LINE_BREAK} `;
    const continuationLineLength = lineLength - continuationPrefix.length;

    const combinedContent = `${heading}:${content}`;

    const segments = [];

    // Add the initial text, which can use the full amount of characters
    segments.push(combinedContent.substring(0, lineLength));

    // Pull out the remaining segments which can only use the max length minus the line prefix
    let index = lineLength;
    while (index < combinedContent.length) {
        segments.push(
            combinedContent.substring(index, index + continuationLineLength),
        );
        index += continuationLineLength;
    }

    // Convert array of segments to a single string, using '\r\n ' to continue lines
    return segments.join(continuationPrefix).trimEnd();
};

const pad = (i) => (i < 10 ? `0${i}` : `${i}`);

const generateICSDatetime = (str) => {
    const time = Date.parse(str);
    const date = new Date(time);
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());
    return `${year}${month}${day}T${hour}${minute}${second}`;
};

const generateEventUID = (start, end, summary, numberOfDays) => {
    const uidString = `${start}${end}${summary}${numberOfDays}`;
    return crypto.createHash('sha1').update(uidString).digest('hex');
};

const isConsecutiveDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() + 1 === d2.getDate() &&
        d1.getHours() === d2.getHours() &&
        d1.getMinutes() === d2.getMinutes()
    );
};

const adaptEventWithDays = (event) => {
    return {
        ...event,
        dates: event.dates.map((date, index) => {
            let numberOfDays = 1;
            while (
                index + numberOfDays < event.dates.length &&
                isConsecutiveDay(
                    event.dates[index + numberOfDays - 1].start,
                    event.dates[index + numberOfDays].start,
                )
            ) {
                numberOfDays += 1;
            }
            return {
                ...date,
                numberOfDays,
            };
        }),
    };
};

const generateEvent = (event, date) => {
    const start = generateICSDatetime(date.start);
    const end = generateICSDatetime(date.end);
    const eventObject = {
        UID: generateEventUID(
            date.start,
            date.end,
            event.summary,
            date.numberOfDays,
        ),
        DTSTAMP: start,
        DTSTART: start,
        DTEND: end,
        SUMMARY: `MHN:${event.summary}`,
        DESCRIPTION: event.description,
        ...(date.numberOfDays && date.numberOfDays > 1
            ? { RRULE: `FREQ=DAILY;COUNT=${date.numberOfDays}` }
            : {}),
    };

    const eventFields = Object.entries(eventObject)
        .map(([key, value]) => wordWrap(key, value))
        .join(LINE_BREAK);

    return [
        // Need to join with CSRF style line endings
        'BEGIN:VEVENT',
        eventFields,
        'END:VEVENT',
    ]
        .join(LINE_BREAK)
        .trim();
};

const generateCalendar = (icsEvents) => {
    const calendarData = {
        PRODID: '-//Seriouslysean//Monster Hunter Now Events Generator//EN',
        URL: 'https://github.com/seriouslysean/monster-hunter-now-events',
        NAME: 'Monster Hunter Now Events',
        DESCRIPTION:
            'Monster Hunter Now Events, see https://github.com/seriouslysean/monster-hunter-now-events for more information.',
        COMMENT:
            'Generated by Monster Hunter Now Events by seriouslysean. Visit https://github.com/seriouslysean/monster-hunter-now-events for more information.',
        'X-URL': 'https://github.com/seriouslysean/monster-hunter-now-events',
        'X-LINK': 'https://github.com/seriouslysean/monster-hunter-now-events',
        'X-WR-CALNAME': 'Monster Hunter Now Events',
        'REFRESH-INTERVAL;VALUE=DURATION': 'P1D',
        COLOR: '255:179:25',
        CALSCALE: 'GREGORIAN',
        METHOD: 'PUBLISH',
    };

    const wrappedCalendarData = Object.entries(calendarData).map(
        ([key, value]) => wordWrap(key, value),
    );

    return [
        // Need to join with CSRF style line endings
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        ...wrappedCalendarData,
        icsEvents,
        'END:VCALENDAR',
    ]
        .join(LINE_BREAK)
        .trim();
};

export default function generateFeed() {
    try {
        if (!events.length) {
            throw new Error('No events found');
        }

        const adaptedEvents = events.map(adaptEventWithDays);
        const icsEvents = adaptedEvents.reduce((acc, event) => {
            console.debug(`Adding event: ${event.summary}`);
            const dates = event.dates || [];
            const datesString = dates.length
                ? dates
                      .map((date) => generateEvent(event, date))
                      .join(LINE_BREAK)
                : '';
            return acc ? [acc, datesString].join(LINE_BREAK) : datesString;
        }, '');

        const icsCalendar = generateCalendar(icsEvents);
        saveEventsICS(icsCalendar);
        console.log('Events saved successfully!');
    } catch (err) {
        console.error(err);
    }
}
