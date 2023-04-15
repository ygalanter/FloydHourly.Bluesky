import bsky from '@atproto/api';
const { BskyAgent } = bsky;
import * as dotenv from 'dotenv';
import process from 'node:process';
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

dotenv.config();

const agent = new BskyAgent({
  service: 'https://bsky.social',
});

await agent.login({
  identifier: process.env.BSKY_USERNAME!,
  password: process.env.BSKY_PASSWORD!,
});

class Song {
  readonly album: string;
  readonly title: string;
  readonly lyrics: string[];

  constructor(rawSong: string[]) {
    this.album = rawSong[0];
    this.title = rawSong[1];
    this.lyrics = rawSong[3]
      .replace('\n\n', '\n')
      .split('\n')
      .filter((line) => line.trim().length > 20); // removing small lines
  }
}

function sanitize(str: string): string {
  return str.replace(/[` .,-?'’()]/g, '');
}

function loadSongs() {
  const csv: string[][] = parse(fs.readFileSync('./pink_floyd_lyrics.csv', 'utf-8')); // reading and parsing CSV file
  const rawSongs = csv.filter((row) => row[3].trim() != ''); // removing songs with empty lyrics (instrumentals)
  const songs = rawSongs.map((rawSong) => new Song(rawSong));

  return songs;
}

function doQuote(songs: Song[], reply?: any) {
  const songIndex = Math.floor(Math.random() * songs.length);
  const song = songs[songIndex];

  if (song.lyrics.length != 0) {
    const lineIndex = Math.floor(Math.random() * song.lyrics.length);
    const line = song.lyrics[lineIndex];

    const post = `${line}\n\n${song.title} - ${song.album}`;

    console.log(`${new Date().toLocaleString()}: ${post}\n`);

    agent
      .post({
        $type: 'app.bsky.feed.post',
        text: post,
        createdAt: new Date().toISOString(),
        reply,
      })
      .catch((err) => console.error(err));

    song.lyrics.splice(lineIndex, 1);
    console.log(`- ${song.lyrics.length} lyric lines remaining in this song`);
  }

  if (song.lyrics.length === 0) {
    songs.splice(songIndex, 1);
    console.log(`- removing song with empty lyrics, ${songs.length} songs remaining`);
  }

  return songs.length;
}

console.log(`${new Date().toLocaleString()}: ****** Floyd Quoter Started *****\n`);

let songs = loadSongs();

doQuote(songs);

setInterval(() => {
  const sonCount = doQuote(songs);
  if (sonCount === 0) {
    console.log(`- reloading songs`);
    songs = loadSongs();
  }
}, 60 * 60 * 1000 * 2);

// ****** Reply to notifications part

const paginateAll = async <T extends { cursor?: string }>(
  fn: (cursor?: string) => Promise<T>,
  limit = Infinity,
): Promise<T[]> => {
  const results: T[] = [];
  let cursor;
  do {
    const res = await fn(cursor);
    results.push(res);
    cursor = res.cursor;
  } while (cursor && results.length < limit);
  return results;
};

const paginator = async (cursor?: string) => {
  const res = await agent.listNotifications({ cursor });
  return res.data;
};

setInterval(async () => {
  const allNotifications = (await paginateAll(paginator)).map((r) => r.notifications).flat();

  allNotifications
    .filter((n) => n.reason == 'mention' && !n.isRead)
    .forEach(async (n) => {
      console.log('**** Replying!!!');
      const parent = { uri: n.uri, cid: n.cid };

      // @ts-ignore
      const root = n.record.reply?.root
        ? // @ts-ignore
          { uri: n.record.reply?.root.uri, cid: n.record.reply?.root.cid }
        : parent;

      const reply = { root, parent };

      const sonCount = doQuote(songs, reply);
      if (sonCount === 0) {
        console.log(`- reloading songs`);
        songs = loadSongs();
      }
    });

  await agent.updateSeenNotifications();

}, 5000);
