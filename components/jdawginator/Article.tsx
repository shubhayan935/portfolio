export const ARTICLE = {
  date: "22 Nov 2026",
  readTime: "5 min read",
}

export default function Article() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-40 pt-14 md:px-8">
      <div className="grid gap-10 md:grid-cols-[180px_1fr]">
        <aside className="space-y-4 border-t border-white/15 pt-4 text-[13px] text-white/55 md:sticky md:top-24 md:self-start">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Published</div>
            <div className="mt-1 text-white/80">{ARTICLE.date}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Author</div>
            <div className="mt-1 text-white/80">Shubhayan Srivastava</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Reading time</div>
            <div className="mt-1 text-white/80">{ARTICLE.readTime}</div>
          </div>
        </aside>

        <article className="jd-prose max-w-[680px] border-t border-white/15 pt-4">
          <p className="jd-lede">
            This is where the story of the set goes: the night, the room, the crowd, and why these records ended up next to each other.
            Hit play above and the recording keeps going while you read, like a radio left on in the next room.
          </p>

          <h2>The set</h2>
          <p>
            Write about how the set was built: the opening records, how the energy was paced, where the peak was meant to land, and the
            transitions you are proudest of (or the ones that nearly fell apart).
          </p>

          <h2>Tracklist</h2>
          <ol>
            <li>Artist — Track</li>
            <li>Artist — Track</li>
            <li>Artist — Track</li>
          </ol>

          <h2>About the header</h2>
          <p>
            The club above is a Three.js scene built entirely from voxels. Nothing in it is keyframed: the recording is analysed in the browser
            as it plays. A beat tracker locks onto the kick drum and estimates tempo, and the crowd, the DJ, the moving heads, the lasers and the
            LED wall all follow that beat grid.
          </p>
          <p>
            The set&apos;s structure drives the show. When the bass drops out for a breakdown, the room goes dark, the mirror ball takes over and the
            crowd starts clapping as the tension builds. When the bass comes back, the drop fires the CO₂ jets, the confetti and a full-white strobe.
            The camera cuts between shots on phrase boundaries; you can also choose a shot yourself or click the room to fire the jets.
          </p>
        </article>
      </div>
    </main>
  )
}
