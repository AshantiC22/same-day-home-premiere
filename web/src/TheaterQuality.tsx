// TODO: the background is a gradient stand-in for a photo.
const features = [
  {
    title: 'Same Day Releases',
    text: 'No waiting. Watch it the day it hits theaters.',
    icon: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  },
  {
    title: 'Partnered Theaters',
    text: 'Supports real cinemas and the movie industry.',
    icon: <path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-6 10 6z" />,
  },
  {
    title: 'HD / 4K Streaming',
    text: 'Stunning quality on all your devices.',
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <text x="12" y="15.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" stroke="none">
          4K
        </text>
      </>
    ),
  },
  {
    title: 'Multi-Device Access',
    text: 'TV, phone, tablet, computer.',
    icon: (
      <>
        <rect x="2" y="4" width="14" height="10" rx="1.5" />
        <path d="M6 18h6M9 14v4" />
        <rect x="17" y="8" width="5" height="10" rx="1" />
      </>
    ),
  },
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

        <ul className="features">
          {features.map((f) => (
            <li key={f.title}>
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {f.icon}
              </svg>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default TheaterQuality