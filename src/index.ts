import { agent } from './bsky.js';
import { Song, loadSongs } from './songs.js';

const doQuote = (songs: Song[], reply?: any) => {
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
};

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

setInterval(async () => {
  const { data } = await agent.listNotifications();

  data.notifications
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
