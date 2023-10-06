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
            model: 'gpt-3.5-turbo',
            messages,
            temperature: 0.5, // Adjust this value (0 to 1) to control randomness. Lower values make the output more deterministic.
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
            content: `From the provided content, extract ONLY the events that occur STRICTLY within the game environment of "Monster Hunter Now".

The criteria are clear:
- The event should take place within the virtual game environment, allowing for player interaction.
- A clear start and end time for the event must be evident.
- Events occurring in continuous time frames should be considered a single event. However, if the same event occurs during a continuous span and then separately at distinct times (like during the week and then separately on the weekend), treat them as two separate events. Discontinuities in time frames are important.
- Assumptions or creative additions to the content should not be made.

The content should be read carefully to identify:
- Time-bound in-game quests, challenges, or missions that require player engagement.
- Time-limited in-game bonuses or competitions with defined start and end times.
- Specific in-game locations or settings tied to events.

Exclude the following:
- Wide-ranging game updates, announcements, or new feature additions without a specific in-game, time-bound challenge or activity.
- Any event, bonus, promotion, or activity that takes place outside the game environment in the real world.
- Statements or references that lack clear signals of a time-limited in-game event.

Use the JSON format provided:
{
    "summary": "Name of the Event",
    "description": "Description of the Event",
    "dates": [{"start": "YYYY-MM-DD HH:MM:SS", "end": "YYYY-MM-DD HH:MM:SS"}]
}

If the content doesn't reveal any qualifying in-game events, use the following format:
{
    "events": []
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
