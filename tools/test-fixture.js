import { getEventsFromHTML } from '../src/utils/chat-gpt.js';
import { getHTMLFixture } from '../src/utils/utils.js';

// Invoke via `npm run test:fixture -- 20230727_news-release-date.html`

const file = process.argv[2];

if (!file) {
    console.error('Fixture argument not found');
    process.exit(1);
}

async function testArticle() {
    console.log(`Loading fixture/${file}`);
    const { data: articleHTML } = getHTMLFixture(file);
    const events = await getEventsFromHTML(articleHTML, true);
    console.log(events.length, events);
}

testArticle(file);
