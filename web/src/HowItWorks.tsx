// TODO: step 2 still says "Subscribe". Rewrite it when checkout exists.
// TODO: the right side is a stand-in for the cinema artwork.
const steps = [
  { title: 'Choose a Movie', text: 'Browse same day releases and find your next favorite.' },
  { title: 'Sign In / Subscribe', text: 'Create an account and pick a plan that fits you.' },
  { title: 'Watch Instantly', text: 'Stream at home, on any device.' },
  { title: 'Support Real Theaters', text: 'Your subscription helps fund local theaters and keeps the movie experience alive.' },
]

function HowItWorks() {
  return (
    <section className="band how">
      <div className="container how-grid">
        <div>
          <h2 className="row-title">How It Works</h2>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="step-number">{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="how-art" aria-hidden="true">
          <span className="neon">Cinema</span>
          <span className="how-brand">Same Day Premiere</span>
          <span className="how-tagline">Same Movies. Same Day. A Bigger Impact.</span>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks