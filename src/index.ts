import { Bot } from '@skyware/bot';
import { SongCollection } from './songs.js';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import { text } from 'stream/consumers';

dotenv.config();

const bot = new Bot();
await bot.login({
  identifier: process.env.BSKY_BOT_HANDLE!,
  password: process.env.BSKY_BOT_PASSWORD!,
});

// initializing song collection
const songCollection = new SongCollection();

// replying to mentions
bot.on('mention', async (mention) => {
  await mention.like();
  console.log(`In reply to @${mention.author.handle}: ${mention.text}`);
  await mention.reply({
    text: songCollection.song,
  });
});

// posting a skeet every 2 hours
const job = new CronJob('0 */2 * * *', async () => {
  await bot.post({
    text: songCollection.song,
  });
});

console.log(`${new Date().toLocaleString()}: ****** Floyd Quoter Started *****\n`);

// posting initial skeet, and starting the job
await bot.post({
  text: songCollection.song,
});
job.start();
