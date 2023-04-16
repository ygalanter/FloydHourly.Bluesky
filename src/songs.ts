import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

export class Song {
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

export function loadSongs() {
  const csv: string[][] = parse(fs.readFileSync('./pink_floyd_lyrics.csv', 'utf-8')); // reading and parsing CSV file
  const rawSongs = csv.filter((row) => row[3].trim() != ''); // removing songs with empty lyrics (instrumentals)
  const songs = rawSongs.map((rawSong) => new Song(rawSong));

  return songs;
}
