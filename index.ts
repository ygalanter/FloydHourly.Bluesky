import bsky from '@atproto/api';
const { BskyAgent } = bsky;
import * as dotenv from 'dotenv';
import process from 'node:process';
import fs from 'node:fs';
import { parse } from 'csv-parse/sync'

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
  readonly lyrics: string[]

  constructor(rawSong: string[]) {
    this.album = rawSong[0];
    this.title = rawSong[1];
    this.lyrics = rawSong[3].replace('\n\n', '\n').split('\n').filter(line => line.trim().length > 20); // removing small lines
  }
}

function sanitize(str: string): string {
  return str.replace(/[` .,-?'’()]/g, '')
}


function loadSongs() {
  const csv: string[][] = parse(fs.readFileSync('./pink_floyd_lyrics.csv', 'utf-8')); // reading and parsing CSV file
  const rawSongs = csv.filter(row => row[3].trim() != '') // removing songs with empty lyrics (instrumentals)
  const songs = rawSongs.map(rawSong => new Song(rawSong))

  return songs
}


function doQuote(songs: Song[]) {

  const songIndex = Math.floor(Math.random() * songs.length)
  const song = songs[songIndex];

  if (song.lyrics.length != 0) {

    const lineIndex = Math.floor(Math.random() * song.lyrics.length)
    const line = song.lyrics[lineIndex];

    const post = `${line}\n\n${song.title} - ${song.album}`

    console.log(`\n${(new Date()).toLocaleString()}: ${post}`);

    agent.post({
      $type: 'app.bsky.feed.post',
      text: post,
      createdAt: new Date().toISOString(),
    }).catch(err => console.error(err))

    song.lyrics.splice(lineIndex, 1)
    console.log(`- ${song.lyrics.length} lyric lines remaining in this song`)
  }

  if (song.lyrics.length === 0) {
    songs.splice(songIndex, 1);
    console.log(`- removing song with empty lyrics, ${songs.length} songs remaining`)
  }

  return songs.length

}

console.log(`${(new Date()).toLocaleString()}: ****** Floyd Quoter Started *****\n`)

let songs = loadSongs()

doQuote(songs);

setInterval(() => {
  const sonCount = doQuote(songs);
  if (sonCount === 0) {
    console.log(`- reloading songs`)
    songs = loadSongs()
  }
}, 60 * 60 * 1000 * 2);

