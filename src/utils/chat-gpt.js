import { parse } from 'node-html-parser';
import OpenAI from 'openai';

export const OPENAI_CHAT_ENDPOINT =
    'https://api.openai.com/v1/chat/completions';

export async function askGPTChat(question, debug) {
    const apiKey = process.env.API_KEY_OPENAI;
    try {
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY env required');
        }

        if (debug) {
            console.log('-----Question-----');
            console.log(question);
            console.log('');
        }

        const openai = new OpenAI({ apiKey });
        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: question }],
        });
        const response = chatCompletion.choices?.[0]?.message?.content?.trim();
        if (!response) {
            throw new Error('Invalid response');
        }

        if (debug) {
            console.log('-----Response-----');
            console.log(response);
            console.log('');
        }

        const events = JSON.parse(response);
        return events;
    } catch (err) {
        console.error(err);
        return { events: [] };
    }
}

export async function getEventsFromHTML(html, debug = false) {
    // No content found, get outta here
    if (!html) {
        console.log('!!! No html');
        return [];
    }

    const document = parse(html);
    // Get main content for the blog post
    const article = document.querySelector('#main article');
    // Remove share content
    article.querySelector('#share')?.remove();
    // Remove next article content
    article.querySelector('#next-article')?.remove();
    // Convert to text and remove extra whitespace
    const content = article.textContent.replace(/\n{2,}/g, '\n').trim();

    // Prompt AI to find events in the content from the news articles
    const question = `Given the content below, identify ONLY the in-game events that occur strictly inside the digital application of "Monster Hunter Now". These could be events such as hunting specific monsters, joining time-limited quests, or participating in in-game challenges.

DO NOT identify:
- Sales, promotions, or item announcements.
- Any events or promotions that manifest in the real world, even if they pertain to the game.
- Please provide the identified events in a consolidated JSON structure under the key "events". If no events are identified, return an empty array. The event format should be:

{
    "summary": "Event Name",
    "description": "Description of the event",
    "dates": [
        {
            "start": "YYYY-MM-DD h:mm AM/PM",
            "end": "YYYY-MM-DD h:mm AM/PM"
        }
    ]
}

Content:
${content}`;
    const response = await askGPTChat(question, debug);
    return response?.events ?? [];
}
