import Ticket from './Ticket'

// TODO: step 2 still says "Subscribe". Rewrite it when checkout exists.
const steps = [
  { title: 'Choose a Movie', text: 'Browse same day releases and find your next favorite.' },
  { title: 'Sign In / Subscribe', text: 'Create an account and pick a plan that fits you.' },
  { title: 'Watch Instantly', text: 'Stream at home, on any device.' },
  { title: 'Support Real Theaters', text: 'Your subscription helps fund local theaters and keeps the movie experience alive.' },
]

// What a ticket looks like, for the picture beside the steps.
const sampleFields = [
  { label: 'Date', value: 'Tonight' },
  { label: 'Time', value: '7:00 PM' },
  { label: 'Window', value: '7 days' },
  { label: 'Seat', value: 'Your couch' },
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

        <div className="how-ticket">
          <Ticket
            decorative
            title="Opening night"
            serial={7}
            fields={sampleFields}
            note="Same Movies. Same Day. A Bigger Impact."
          />
        </div>
      </div>
    </section>
  )
}

export default HowItWorks