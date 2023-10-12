import { Command } from 'commander';

import { version } from '../src/utils/config';

import { getArticles } from '../src/utils/article-utils';

// Invoke via `npm run fetch:all-articles`
// Invoke via `npm run fetch:article -- --force` to force process all articles

const program = new Command();

program
    .name('fetch-articles')
    .description('Fetch and process all articles')
    .option('-f, --force')
    .version(version);

program.parse();
const { force } = program.opts();

getArticles(force);
