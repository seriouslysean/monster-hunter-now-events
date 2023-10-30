import { parse } from 'node-html-parser';
import OpenAI from 'openai';
import logger from './log-utils.js';

import { stringifyJSON } from './utils.js';

export const OPENAI_CHAT_ENDPOINT =
    'https://api.openai.com/v1/chat/completions';

export const OPENAI_GPT_MODEL = process.env.OPENAI_GPT_MODEL ?? 'gpt-4';

export const OPENAI_CONFIG = {
    model: OPENAI_GPT_MODEL,
    // Adjust this value (0 to 1) to control randomness. Lower values make the output more deterministic.
    // https://platform.openai.com/docs/guides/gpt/how-should-i-set-the-temperature-parameter
    temperature: 0.2,
};

async function askGPTChat(messages, debug) {
    const noEvents = { events: [] };
    try {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY env required');
        }

        if (debug) {
            logger.info('-----Question-----');
            logger.info(stringifyJSON(messages));
            logger.info('');
            logger.info('-----OpenAI Config-----');
            logger.info(stringifyJSON(OPENAI_CONFIG));
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const chatCompletion = await openai.chat.completions.create({
            messages,
            ...OPENAI_CONFIG,
        });
        const response = chatCompletion.choices?.[0]?.message?.content?.trim();

        if (!response) {
            throw new Error('No response sent');
        }

        if (debug) {
            logger.info('-----Response-----');
            logger.info(response);
            logger.info('');
        }

        return JSON.parse(response);
    } catch (err) {
        logger.error(err);
        return noEvents;
    }
}

export async function getEventsFromHTML(html, debug = false) {
    if (!html) {
        logger.info('!!! No html');
        return { events: [] };
    }

    const document = parse(html);
    const article = document.querySelector('#main article');
    if (article !== null) {
        article.querySelector('#share')?.remove();
        article.querySelector('#next-article')?.remove();
    }
    const content = article?.textContent.replace(/\n{2,}/g, '\n').trim() ?? '';

    const messages = [
        {
            role: 'system',
            content: `**Event Extraction Guidelines: Monster Hunter Now**

Extract strictly in-game events occurring within the virtual game "Monster Hunter Now". Ensure your extraction adheres to the following criteria:

1. **Game Environment**:
- Events MUST ONLY occur inside the "Monster Hunter Now" game environment. Do NOT include any external promotions, in-game shop events, updates, or non-game events.

2. **Event Duration**:
- Every event should have both a start and end time.
- For all-day events without specific times, set "allDay": true with 00:00:00 as the start and 23:59:59 as the end.

3. **Event Discreteness**:
- Separate events that have distinct objectives or activities, even if they share the same timeframe.
- Do NOT combine unrelated activities into a single event.

4. **Event Continuity**:
- Combine instances of the same event with overlapping details into one, capturing all essential facets.
- Separate additional intervals or time frames within the event details.

5. **Avoid Assumptions/Additions**:
- Extract based solely on the provided content. Do NOT incorporate external information.

**Focus On**:
- Player-centric quests, missions, and challenges that are time-bound.
- In-game bonuses, competitions with clear start/end times.
- Game locations linked with events.

**Exclude**:
- Events or promotions not part of the direct in-game experience, like pre-registration rewards, generic game updates, in-game shop promotions, or features without a specific in-game activity timeframe.
- Vague events without a clear time-bound in-game context.

Order dates from the most recent to the oldest. Ensure consecutive dates are sequential.

If no in-game event meets the criteria, return an empty events array.

Ensure the output is valid JSON.

**Output Format**:
{
    events: [{
        "summary": "Event Name",
        "description": "Event Details",
        "dates": [
            {
                "start": "YYYY-MM-DDTHH:mm:ss",
                "end": "YYYY-MM-DDTHH:mm:ss",
                "allDay": true/false
            }
        ],
        "habitat": ["Desert", "Forest", "Swamp", etc],
        "monsters": ["Rathalos", "Rathian", "Diablos", etc],
    }],
}`,
        },
        {
            role: 'user',
            content: 'Identify in-game events from the following content:',
        },
        {
            role: 'user',
            content,
        },
    ];

    const response = await askGPTChat(messages, debug);
    return response ?? { events: [] };
}

interface Event {
    summary: string;
    description: string;
    dates: {
        start: string;
        end: string;
        allDay: boolean;
    }[];
    habitat: string[];
    monsters: string[];
}

export async function getDedupedJSON(
    json,
    debug = false,
): Promise<{ events: Event[]; hash?: string }> {
    if (!json || !json.events || json.events.length === 0) {
        logger.info('!!! No json');
        return { events: [] };
    }

    const messages = [
        {
            role: 'system',
            content: `**Event Combination Guidelines: Monster Hunter Now**

Given an input JSON payload with an array of events within the "events" key, your task is to merge and consolidate these events based on the following rules:

1. **Date Priority**:
    - When merging events from different sources, always prioritize the details from the event with a newer timestamp provided in the "timestamp" field.

2. **Unique Titles Requirement**:
    - Events must have unique titles. If events share identical titles, inspect their description, habitat, monsters, and dates to determine if they should be merged.

3. **Overlapping & Adjacent Dates**:
    - Merge events with shared or consecutive date ranges, especially if they are in the same habitat or involve the same monsters.
    - If events have the exact same date range, combine them into a single date range entry.
    - If one event's date range is an all-day event and another is a timed event on the same dates, retain only the timed event's date range. The all-day event's date range should be removed.
    - Ensure there are no repeated or redundant date ranges in the merged 'dates' array.

4. **Habitat & Monsters**:
    - Merge events that occur in the same habitat with the same monsters, especially if their dates overlap, are identical, or consecutive.

5. **Coherent Summaries**:
    - Generate concise and clear summaries for merged events. Avoid including date details in the summary.

6. **Description**:
    - Carefully combine event descriptions to preserve the essence of the original descriptions. Ensure no redundancy or repetition.

7. **Cleaning Up**:
    - After merging, discard the habitat, monster, and timestamp keys.
    - Return all consolidated events in chronological order based on their start date.

Output Format:
Provide a JSON with the following structure:
{
    "events": [{
        "summary": "Event Name",
        "description": "Detailed Description",
        "dates": [
            {
                "start": "YYYY-MM-DDTHH:mm:ss",
                "end": "YYYY-MM-DDTHH:mm:ss",
                "allDay": true/false
            }
        ]
    }]
}

Important Notes:
- The goal is to return concise event summaries without redundancy.
- Do not include date specifics in the summary or description; use the 'dates' array for that.
- If events cannot be logically merged, they should remain separate in the output.`,
        },
        {
            role: 'user',
            content: 'Merge these events:',
        },
        {
            role: 'user',
            content: stringifyJSON(json),
        },
    ];

    const response = await askGPTChat(messages, debug);
    const dedupedEvents = response && response.events ? response.events : [];

    return { events: dedupedEvents };
}
