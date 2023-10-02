const crypto = require('crypto');
const { writeFileSync } = require('fs');
const { join } = require('path');

// Lines can not be longer than 75 characters
// See https://icalendar.org/iCalendar-RFC-5545/3-1-content-lines.html
function wordWrap(line) {
    const lineLength = 75;
    const [heading, content] = line.split(':');

    // Calculate the maximum content length after taking into account the heading and the colon
    const maxContentLength = lineLength - heading.length - 1;

    // Split the content at maxContentLength
    const regex = new RegExp(`(.{1,${maxContentLength}})`, 'g');

    const wrappedContent = content.match(regex).join('\r\n ');

    return `${heading}:${wrappedContent}`;
}

const CALENDAR_TEMPLATE = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Monster Hunter Now Events//EN
URL:https://github.com/seriouslysean/monster-hunter-now-events
NAME:Monster Hunter Now Events
${wordWrap('DESCRIPTION:Monster Hunter Now Events, see https://github.com/seriouslysean/monster-hunter-now-events for more information.')}
REFRESH-INTERVAL;VALUE=DURATION:P1D
COLOR:255:179:25
CALSCALE:GREGORIAN
METHOD:PUBLISH
{{EVENTS}}
END:VCALENDAR`;

// TODO: Allow events to use repear rules instead of individual events (RRULE:FREQ=DAILY;COUNT=2)
// Summary and description may wrap and need to take in to account the heading length so we can
// wrap at the correct length
const EVENT_TEMPLATE = `BEGIN:VEVENT
UID:{{UID}}
DTSTAMP:{{DTSTAMP}}
DTSTART:{{DTSTART}}
DTEND:{{DTEND}}
{{SUMMARY}}
{{DESCRIPTION}}
END:VEVENT`;

function generateICSDatetime(str) {
    const pad = (i) => i < 10 ? `0${i}` : `${i}`;
    const date = new Date(str);
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());
    // Add a 'Z' to the end of the date if this date needs to be timezone aware
    // Without the 'Z', the date will be treated as a floating date (local to user)
    return `${year}${month}${day}T${hour}${minute}${second}`;
}

function generateEventUID(eventIndex, dateIndex, summary) {
    const uidString = `${eventIndex}${dateIndex}${summary}`;
    return crypto.createHash('sha1').update(uidString).digest('hex');
}

// Pass index to be used as a unique identifier
// Maybe switch to actual id later, or maybe just a UUID
function generateEvent(event, eventIndex, date, dateIndex) {
    const UID = generateEventUID(`${eventIndex}${dateIndex}${event.summary}`);
    const start = generateICSDatetime(date.start);
    const end = generateICSDatetime(date.end);
    const SUMMARY = wordWrap(`SUMMARY:${event.summary}`);
    const DESCRIPTION = wordWrap(`DESCRIPTION:${event.description}`);
    const adaptedEvent = {
        UID,
        DTSTAMP: start,
        DTSTART: start,
        DTEND: end,
        SUMMARY,
        DESCRIPTION,
    };
    const icsEvent = EVENT_TEMPLATE.replace(/{{(\w+)}}/g, (match, key) => adaptedEvent[key]);
    return icsEvent;
}

function generateCalendar() {
    try {
        const { events } = require('./events.json');
        if (!events.length) {
            throw new Error('No events found');
        }
        const icsEvents = events.reduce((acc, event, eventIndex) => {
            console.debug(`Adding event: ${event.summary}`);
            const dates = event.dates || [];
            // If there aren't any event dates, get outta here
            if (!dates.length) {
                return acc;
            }
            const datesString = dates.map((date, dateIndex) =>
                generateEvent(event, eventIndex, date, dateIndex)).join('\n');
            // Don't add spacing on the initial index to avoid multiple returns at the beginning of the file
            const joinStr = eventIndex > 0 ? '\n' : '';
            return [
                acc,
                datesString,
            ].join(joinStr);
        }, '');
        const icsCalendar = CALENDAR_TEMPLATE.replace('{{EVENTS}}', icsEvents);
        writeFileSync(
            join(__dirname, 'dist/events.ics'),
            icsCalendar,
        );
    } catch (err) {
        console.error(err);
    }
}

generateCalendar();
