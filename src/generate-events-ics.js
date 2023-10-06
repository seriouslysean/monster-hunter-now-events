import crypto from 'crypto';
import { getEventsJSON, saveEventsICS } from './utils/utils.js';

// Get the events from the JSON file
const { events } = getEventsJSON();

const wordWrap = (line) => {
    const lineLength = 75;
    const [heading, content] = line.split(/:(.*)/s);
    const firstLineMaxLength = lineLength - heading.length - 1;
    const firstLineContent = content.slice(0, firstLineMaxLength);
    const remainingContent = content.slice(firstLineMaxLength);
    const regex = new RegExp(`(.{1,${lineLength}})`, 'g');
    const continuationLines = remainingContent.match(regex) || [];
    const wrappedContinuation = continuationLines.join('\r\n ');
    return `${heading}:${firstLineContent}\r\n ${wrappedContinuation}`.trimEnd();
};

const CALENDAR_TEMPLATE = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Monster Hunter Now Events//EN
URL:https://github.com/seriouslysean/monster-hunter-now-events
NAME:Monster Hunter Now Events
${wordWrap(
    'DESCRIPTION:Monster Hunter Now Events, see https://github.com/seriouslysean/monster-hunter-now-events for more information.',
)}
REFRESH-INTERVAL;VALUE=DURATION:P1D
COLOR:255:179:25
CALSCALE:GREGORIAN
METHOD:PUBLISH
{{EVENTS}}
END:VCALENDAR
`.trim();

const EVENT_TEMPLATE = `
BEGIN:VEVENT
UID:{{UID}}
DTSTAMP:{{DTSTAMP}}
DTSTART:{{DTSTART}}
DTEND:{{DTEND}}
{{RRULE}}
{{SUMMARY}}
{{DESCRIPTION}}
END:VEVENT
`.trim();

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
    const UID = generateEventUID(
        date.start,
        date.end,
        event.summary,
        date.numberOfDays,
    );
    const start = generateICSDatetime(date.start);
    const end = generateICSDatetime(date.end);
    const SUMMARY = wordWrap(`SUMMARY:MHN:${event.summary}`);
    const DESCRIPTION = wordWrap(`DESCRIPTION:${event.description}`);
    const RRULE =
        date.numberOfDays && date.numberOfDays > 1
            ? `RRULE:FREQ=DAILY;COUNT=${date.numberOfDays}`
            : '';

    const adaptedEvent = {
        UID,
        DTSTAMP: start,
        DTSTART: start,
        DTEND: end,
        SUMMARY,
        DESCRIPTION,
        RRULE,
    };

    return EVENT_TEMPLATE.replace(
        /{{(\w+)}}/g,
        (_, key) => adaptedEvent[key] || '',
    ).trim();
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
            if (!dates.length) {
                return acc;
            }
            const datesString = dates
                .map((date) => generateEvent(event, date))
                .join('\n');
            return acc ? `${acc}\n${datesString}` : datesString;
        }, '');
        const icsCalendar = CALENDAR_TEMPLATE.replace('{{EVENTS}}', icsEvents);
        saveEventsICS(icsCalendar);
        console.log('');
    } catch (err) {
        console.error(err);
    }
}
