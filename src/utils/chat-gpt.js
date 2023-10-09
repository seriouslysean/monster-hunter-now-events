import { parse } from 'node-html-parser';
import OpenAI from 'openai';

export const OPENAI_CHAT_ENDPOINT =
    'https://api.openai.com/v1/chat/completions';

async function askGPTChat(messages, debug) {
    const apiKey = process.env.API_KEY_OPENAI;
    const noEvents = { events: [] };
    try {
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY env required');
        }

        if (debug) {
            console.log('-----Question-----');
            console.log(JSON.stringify(messages, null, 2));
            console.log('');
        }

        const openai = new OpenAI({ apiKey });
        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages,
            // Adjust this value (0 to 1) to control randomness. Lower values make the output more deterministic.
            // https://platform.openai.com/docs/guides/gpt/how-should-i-set-the-temperature-parameter
            temperature: 0.2,
        });
        const response = chatCompletion.choices?.[0]?.message?.content?.trim();

        if (!response) {
            throw new Error('No response sent');
        }

        if (debug) {
            console.log('-----Response-----');
            console.log(response);
            console.log('');
        }

        return JSON.parse(response);
    } catch (err) {
        console.error(err);
        return noEvents;
    }
}

export async function getEventsFromHTML(html, debug = false) {
    if (!html) {
        console.log('!!! No html');
        return { events: [] };
    }

    const document = parse(html);
    const article = document.querySelector('#main article');
    article.querySelector('#share')?.remove();
    article.querySelector('#next-article')?.remove();
    const content = article.textContent.replace(/\n{2,}/g, '\n').trim();

    const messages = [
        {
            role: 'system',
            content: `**Event Extraction Guidelines: Monster Hunter Now**

Extract in-game events occurring STRICTLY within the virtual game "Monster Hunter Now". Ensure your extraction adheres to the following criteria:

1. **Game Environment**:
    - Events should ONLY occur inside "Monster Hunter Now". Exclude any external promotions, updates, or non-game events.

2. **Event Duration**:
    - Must include both a start and end time.
    - For all-day events without specific times, set "allDay": true with 00:00:00 as the start and 23:59:59 as the end.

3. **Event Continuity**:
    - If multiple instances of the same event are found in different content, combine them as one, ensuring all details are captured.
    - List additional intervals or time frames separately within the event details.

4. **Avoid Assumptions/Additions**:
    - Extract based solely on the provided content. No outside information should be incorporated.

**Focus On**:
- Player-centric quests, missions, challenges that are time-bound.
- In-game bonuses, competitions with clear start/end times.
- Game locations associated with events.

**Exclude**:
- Generic game updates or features without a specific in-game activity timeframe.
- Events or mentions external to the game environment.
- Ambiguous events lacking a clear time-bound in-game context.

When listing dates, organize them from recent to oldest. Ensure consecutive dates follow consecutively.

Ensure to return valid JSON.

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

export async function getDedupedJSON(json, debug = false) {
    if (!json) {
        console.log('!!! No json');
        return { events: [] };
    }

    const messages = [
        {
            role: 'system',
            content: `**Event Combination Guidelines: Monster Hunter Now**

Given the provided JSON:

1. **Criteria for Merging**:
    - **Overlapping Dates & Times**: Merge events that share a time frame or overlap within the same habitat and involve similar monsters. If the times are identical, merge them into one; if they overlap but aren't identical, maintain them separately within the 'dates' array.
    - **Habitat & Monsters**: Events in the same habitat, involving the same monsters, during overlapping or identical times should be considered for merging.

2. **Generate Coherent Summaries**: For events that are closely related in theme or content, create a combined summary that encapsulates the essence of both events without using " | ".

3. **Combine Descriptions Carefully**: Integrate the event descriptions to ensure the final combined description is coherent and retains the essence of both original descriptions.

4. **Remove Extraneous Keys**: After merging, monsters and habitat keys should be removed from the final JSON.

Return the events in this format:
{
    "events": [
        {
            "summary": "Generated Event Name",
            "description": "Merged Event Details",
            "dates": [
                {
                    "start": "YYYY-MM-DDTHH:mm:ss",
                    "end": "YYYY-MM-DDTHH:mm:ss",
                    "allDay": true/false
                }
            ],
        }
    ]
}

Notes:
- Events that don't meet the above strict criteria for merging should remain as separate items in the returned list.
- Ensure individual timed events with unique times remain separate within the 'dates' array.

Return ONLY valid JSON in the format requested as the final output.`,
        },
        {
            role: 'user',
            content:
                'Merge events with identical timings and closely related content:',
        },
        {
            role: 'user',
            content: JSON.stringify(json, null, 4),
        },
    ];

    const response = await askGPTChat(messages, debug);
    return response ?? { events: [] };
}
