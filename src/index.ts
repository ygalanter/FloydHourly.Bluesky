import { Bot, Post } from '@skyware/bot';
import { SongCollection } from './songs.js';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';

const reply = async (mention: Post) => {
  await mention.like();
  console.log(`\nIn reply to @${mention.author.handle}: ${mention.text}\n`);
  await mention.reply({
    text: songCollection.song,
  });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createBot = async () => {
  const bot = new Bot();

  try {
    await bot.login({
      identifier: process.env.BSKY_BOT_HANDLE!,
      password: process.env.BSKY_BOT_PASSWORD!,
    });
  } catch (error) {
    console.error(`\n*** ${new Date().toLocaleString()}: Error logging in. Retrying in 1 minute.\n`);
    await sleep(60000);
    await bot.login({
      identifier: process.env.BSKY_BOT_HANDLE!,
      password: process.env.BSKY_BOT_PASSWORD!,
    });
  }

  bot.on('mention', reply);

  return bot;
};

dotenv.config();

const songCollection = new SongCollection();

let dynamicBot = await createBot();

// posting a skeet every 2 hours
const job = new CronJob('0 */2 * * *', async () => {
  dynamicBot = await createBot();

  try {
    await dynamicBot.post({
      text: songCollection.song,
    });
  } catch (error) {
    console.error(`\n*** ${new Date().toLocaleString()}: Error posting. Retrying in 1 minute.\n`);
    await sleep(60000);
    await dynamicBot.post({
      text: songCollection.song,
    });
  }
});

console.log(`\n${new Date().toLocaleString()}: ****** Floyd Quoter Started *****\n`);

job.start();
