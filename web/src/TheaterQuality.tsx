// TODO: the background is a gradient stand-in for a photo.
// Set like the end credits of a film: the job on the left, who does it on the right.
const credits = [
  { role: 'Same Day Releases', text: 'No waiting. Watch it the day it hits theaters.' },
  { role: 'Partnered Theaters', text: 'Supports real cinemas and the movie industry.' },
  { role: 'HD / 4K Streaming', text: 'Stunning quality on all your devices.' },
  { role: 'Multi-Device Access', text: 'TV, phone, tablet, computer.' },
]

function TheaterQuality() {
  return (
    <section className="band theater">
      <div className="container">
        <h2 className="band-title">
          Theater quality.
          <br />
          At home.
        </h2>
        <p className="theater-text">
          Same Day Premiere brings the theater to you. Watch the latest blockbusters on your TV, phone, or
          tablet, the same day they hit the big screen.
        </p>

        <dl className="credits">
          {credits.map((c) => (
            <div className="credit" key={c.role}>
              <dt>{c.role}</dt>
              <dd>{c.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export default TheaterQuality