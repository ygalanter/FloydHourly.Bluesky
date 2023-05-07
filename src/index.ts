import { BskyBot, Events } from 'easy-bsky-bot-sdk';
import { SongCollection } from './songs.js';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';

dotenv.config();

// initializing bot
BskyBot.setOwner({ handle: process.env.BSKY_OWNER_HANDLE!, contact: process.env.BSKY_OWNER_EMAIL! });
const bot = new BskyBot({ handle: process.env.BSKY_BOT_HANDLE!, useNonBotHandle: true });
await bot.login(process.env.BSKY_BOT_PASSWORD!);

// initializing song collection
const songCollection = new SongCollection();

// replying to mentions
bot.setHandler(Events.MENTION, async ({ post }) => {
  console.log(`In reply to @${post.author.handle}: ${post.text}`);
  await bot.like(post);
  await bot.reply(songCollection.song, post);
});
bot.startPolling();

// posting a skeet every 2 hours
const job = new CronJob('0 */2 * * *', async () => {
  await bot.post(songCollection.song);
});

console.log(`${new Date().toLocaleString()}: ****** Floyd Quoter Started *****\n`);
job.start();
