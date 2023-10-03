<p align="center">
  <img
    src="./assets/monster-hunter-now-logo.png"
    alt="Monster Hunter Now Logo" />
</p>

# Monster Hunter Now Events Calendar

This is a calendar subscription file for events that [Monster Hunter Now](https://monsterhunternow.com/) is running.

The events still need to be manually added (albeit in an easier manner) to the [events.txt](../events.txt) document, but when this file is modified it will automatically update the ICS file for anyone subscribed.

I created this because ultimately I'm lazy and wanted to subscribe to a feed instead of adding the events manually to my phone's calendar.

If you aren't playing yet, [feel free to join](https://apps.apple.com/us/app/monster-hunter-now/id6445906110) and use my referral code for free items and zenny, `89K5MKCF`.

## Subscribe to Calendar

Add the [ICS file](https://seriouslysean.github.io/monster-hunter-now-events/dist/events.ics) to your calendar app.

```
https://seriouslysean.github.io/monster-hunter-now-events/dist/events.ics
```

## Run Locally

### Generate Feed

1. Run `npm start` or `npm run generate:feed`

File is output to `dist/events.ics`.

### Generate Events (JSON)

1. `npm run generate:events`

File is output to `dist/events.json`.

## References

- https://monsterhunternow.com/news
- https://en.wikipedia.org/wiki/ICalendar
