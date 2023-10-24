<p align="center">
  <img
    src="./assets/monster-hunter-now-logo.png"
    alt="Monster Hunter Now Logo" />
</p>

# Monster Hunter Now Events

* Subscribe to Calendar
* Run Locally
  - Open AI Key
  - Generate ICS File
  - Tools
* References

This is a calendar subscription file for events in [Monster Hunter Now](https://monsterhunternow.com/).

If you aren't playing yet, [feel free to join](https://apps.apple.com/us/app/monster-hunter-now/id6445906110) and use my referral code for free items and zenny, `89K5MKCF`.

I created this because I didn't want to add events to a shared calendar for my friends and I any longer and it's also a great way to test out how beneficial AI is in coding via dialogue with ChatGPT, and an excuse to utilize the OpenAI API.

## Subscribe to Calendar

Add the [ICS file](https://seriouslysean.github.io/monster-hunter-now-events/dist/events.ics) to your calendar app.

```
https://seriouslysean.github.io/monster-hunter-now-events/dist/events.ics
```

## Run Locally

### Open AI Key

1. Sign up for an OpenAI API key, https://platform.openai.com/account/api-keys
2. Add tokens if needed, https://platform.openai.com/account/billing/overview

### Generate ICS File

Run `npm start`

This will do three things:
1. `npm run fetch:all-articles`
  - Look for new articles
  - Download article HTML
  - Parse events from the article content
  - Save article JSON
2. `npm run generate:events-json`
  - Loop through all `fixtures/**/events.json` files
  - Generate a combined `dist/events.raw.json` file
  - Combine similar events from the raw JSON file
  - Generate a deduped `dist/events.json` file
3. `npm run generate:events-ics`
  - Generate the `dist/events.ics` file

### Tools

Download, Parse and Save One Article
- `npm run fetch:article -- -u <url>`

Download, Parse and Save ALL New Articles
- `npm run fetch:all-articles`

Article `index.html` and `events.json` are output to `fixtures/{date}_news-{slug}`.

## References

- https://monsterhunternow.com/news
- https://en.wikipedia.org/wiki/ICalendar
- https://chat.openai.com/
