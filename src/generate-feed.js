import crypto from "crypto";
import { writeFileSync } from "fs";
import { createRequire } from "module";
import { join } from "path";

import { paths } from "./utils.js";

// Get the events from the JSON file
const require = createRequire(import.meta.url);
const { events } = require("../dist/events.json");

const wordWrap = (line) => {
  const lineLength = 75;
  const [heading, content] = line.split(":");
  const maxContentLength = lineLength - heading.length - 1;
  const regex = new RegExp(`(.{1,${maxContentLength}})`, "g");
  const wrappedContent = content.match(regex).join("\r\n ");
  return `${heading}:${wrappedContent}`;
};

const CALENDAR_TEMPLATE = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Monster Hunter Now Events//EN
URL:https://github.com/seriouslysean/monster-hunter-now-events
NAME:Monster Hunter Now Events
${wordWrap(
  "DESCRIPTION:Monster Hunter Now Events, see https://github.com/seriouslysean/monster-hunter-now-events for more information.",
)}
REFRESH-INTERVAL;VALUE=DURATION:P1D
COLOR:255:179:25
CALSCALE:GREGORIAN
METHOD:PUBLISH
{{EVENTS}}
END:VCALENDAR`;

const EVENT_TEMPLATE = `BEGIN:VEVENT
UID:{{UID}}
DTSTAMP:{{DTSTAMP}}
DTSTART:{{DTSTART}}
DTEND:{{DTEND}}
{{SUMMARY}}
{{DESCRIPTION}}
END:VEVENT`;

const pad = (i) => (i < 10 ? `0${i}` : `${i}`);

const generateICSDatetime = (str) => {
  const date = new Date(str);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}${month}${day}T${hour}${minute}${second}`;
};

const generateEventUID = (eventIndex, dateIndex, summary) => {
  const uidString = `${eventIndex}${dateIndex}${summary}`;
  return crypto.createHash("sha1").update(uidString).digest("hex");
};

const generateEvent = (event, eventIndex, date, dateIndex) => {
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
  return EVENT_TEMPLATE.replace(/{{(\w+)}}/g, (_, key) => adaptedEvent[key]);
};

export default function generateFeed() {
  try {
    if (!events.length) {
      throw new Error("No events found");
    }
    const icsEvents = events.reduce((acc, event, eventIndex) => {
      console.debug(`Adding event: ${event.summary}`);
      const dates = event.dates || [];
      if (!dates.length) {
        return acc;
      }
      const datesString = dates
        .map((date, dateIndex) =>
          generateEvent(event, eventIndex, date, dateIndex),
        )
        .join("\n");
      const joinStr = eventIndex > 0 ? "\n" : "";
      return `${acc}${joinStr}${datesString}`;
    }, "");
    const icsCalendar = CALENDAR_TEMPLATE.replace("{{EVENTS}}", icsEvents);
    writeFileSync(join(paths.dist, "events.ics"), icsCalendar);
    console.log("");
  } catch (err) {
    console.error(err);
  }
}
