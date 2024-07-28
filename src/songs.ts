import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

/** Transforms raw song text into album/title/lyrics construct */
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

export class SongCollection {
  private _songs: Song[];

  private loadSongs() {
    const csv: string[][] = parse(fs.readFileSync('./pink_floyd_lyrics.csv', 'utf-8')); // reading and parsing CSV file
    const rawSongs = csv.filter((row) => row[3].trim() != ''); // removing songs with empty lyrics (instrumentals)
    const songs = rawSongs.map((rawSong) => new Song(rawSong));

    return songs;
  }

  constructor() {
    this._songs = this.loadSongs();
  }

  get song(): string {
    // random song
    const songIndex = Math.floor(Math.random() * this._songs.length);
    const song = this._songs[songIndex];

    // random lyrics line within the song
    const lineIndex = Math.floor(Math.random() * song.lyrics.length);
    const line = song.lyrics[lineIndex];

    // preparing the skeet to be posted
    const skeet = `${line}\n\n${song.title} - ${song.album}`;
    console.log(`${new Date().toLocaleString()}: ${skeet}\n`);

    // removing the line from the song
    song.lyrics.splice(lineIndex, 1);
    console.log(`- ${song.lyrics.length} lyric lines remaining in this song\n`);

    if (song.lyrics.length === 0) {
      this._songs.splice(songIndex, 1);
      console.log(`- removing song with empty lyrics, ${this._songs.length} songs remaining\n`);
    }

    if (this._songs.length === 0) {
      console.log(`*** Used all songs - reloading songs\n`);
      this._songs = this.loadSongs();
    }

    if (line === undefined) {
      return this.song;
    } else {
      return skeet;
    }
  }
}
