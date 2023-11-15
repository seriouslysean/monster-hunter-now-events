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
    const content = article.textContent.replace(/\n{2,}/g, '\n').trim() ?? '';

    const messages = [
        {
            role: 'system',
            content: `**Event Extraction Guidelines: Monster Hunter Now**

Extract events within the "Monster Hunter Now" game environment, emphasizing the time frames and activities that occur within a specific overarching event. Ensure precise extraction using the following guidelines:

1. **Game Environment**:
    - Extract in-game events within "Monster Hunter Now." Exclude external promotions, in-game shop events, and non-game-related events.

2. **Time Frames and Activities**:
    - Focus on the time frames and specific activities within each event. Pay special attention to the sequence of activities and their time-bound nature.

3. **Separate Event Components**:
    - Recognize that an overarching event can contain multiple time-bound activities. Extract and separate these distinct activities within the same overarching event. Ensure that both the overarching event and its time-bound sub-events are properly identified and named differently based on their context.
        - **Example**: If an event mentions a monster appearing in low numbers for a week, and then more frequently during specific times, these should be extracted as two separate sub-events. The sub-event should not repeat the same title as the main event and should be more related to the context of the in-game event. For instance, it could be named "Monster Appearance Increase."

4. **Capture Start and End Times**:
    - Ensure that each event component includes both a start and end time, even for all-day events. Use "allDay" with 00:00:00 as the start and 23:59:59 as the end for all-day events.

5. **Objective Extraction**:
    - Extract events based solely on the provided content. Avoid adding external information.

6. **Naming Sub-Events**:
    - Sub-events within a larger main event should have unique names that are more related to the context of the sub-event itself. Avoid duplicating the name of the main event in sub-events.

**Focus On**:
    - Identifying and distinguishing distinct in-game activities within overarching events.
    - Properly naming each event based on its unique content.

**Exclude**:
    - Events that are not part of the in-game experience, such as promotional content or features without specific in-game activities.

Order extracted events from the most recent to the oldest. Ensure consecutive dates are presented sequentially.

If no in-game event meets the criteria, return an empty events array.

Provide the output in valid JSON format.

**Output Format**:
{
    "events": [{
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
        "monsters": ["Monster1", "Monster2", "Monster3", etc]
    }]
}`,
        },
        {
            role: 'user',
            content:
                'Identify in-game events from the following content. Be extremely careful in detecting main events and any sub-events within these main events. Sub-events should have their own start and end times and should be extracted separately, even if they are mentioned within the same paragraph as the main event. For instance, if an event mentions a monster appearing in low numbers for a week, and then more frequently during specific times, these should be extracted as two separate sub-events. Ensure all events are parsed with EXTREME accuracy.',
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
            content: `Given a JSON object containing events under the "events" key, consolidate them using the following rules:

1. **Identical Events**:
    - Merge events with identical summaries, descriptions, and date ranges, prioritizing the most recent event, especially if it provides more detailed timing information.

2. **Main and Sub-Events**:
    - Do not merge main events with their sub-events. Sub-events should remain distinct even if they occur within the date range of a main event.

3. **Overlapping Dates**:
    - Events with overlapping dates but different goals, quests, or in-game activities should not be merged. Each event should be preserved as distinct.

4. **Non-Merging Scenarios**:
    - If an event spans a length of time and there are smaller events during that larger event involving the same or similar themes, these should not be merged.

5. **Title Preference**:
    - When merging events, use the title of the most recent event unless the earlier event's title provides essential context that would be lost otherwise.

6. **Content Consideration**:
    - When merging events, consider the content carefully. If a newer event entry provides additional clarity or details that were not present in the earlier entry, prioritize the newer information.

7. **Cleanup**:
    - Remove redundant fields and ensure logical ordering of events, maintaining the original order unless merges dictate otherwise.

Only return valid JSON without backticks, suitable for direct use with JSON.parse. If no events meet the criteria, return an empty events array.

**Output**:
{
    "events": [{
        "summary": "Event Name",
        "description": "Description",
        "dates": [
            {
                "start": "YYYY-MM-DDTHH:mm:ss",
                "end": "YYYY-MM-DDTHH:mm:ss",
                "allDay": true/false
            }
        ]
    }]
}

**Notes**:
- Aim for concise and non-redundant summaries.
- Keep events separate if their activities, quests, or tasks differ, even if they share the same date.
- Ensure all events are represented in the output, either as individual or merged events.
- Overarching events and their sub-events should not be merged, even if they share the same monsters, habitat, and dates.
- The primary trigger for merging events is identical dates. Other factors such as habitat, monsters, and description should be considered, but the dates must be identical for events to be merged.`,
        },
        {
            role: 'user',
            content:
                'Merge events with precision, focusing on identical dates as the primary trigger. Preserve the uniqueness of distinct quests or tasks. Respect the "allDay" property for overlapping events. Aim for concise, non-redundant summaries in the output. Deduplicate with extreme accuracy and attention to detail, considering the most recent content for clarity.',
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
