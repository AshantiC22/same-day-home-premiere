// Researched details for each movie, keyed by lowercase title.
// Every fact here comes from the sources listed at the bottom of each entry.
// Scores are as of Oct 2026 and will drift. Text is paraphrased, not copied.
// TODO: move all of this into real columns/tables on the backend
// (genre, year, rating, runtime, director, cast, crew) as feature loops.

export type Person = {
  name: string
  role: string
  dub?: string // English dub actor, for anime
}

export type Credit = {
  job: string
  names: string
}

export type Score = {
  source: string
  value: string
  note: string
}

export type Similar = {
  title: string
  year: number
  by: string
  kind: string
  why: string
}

export type Trailer = {
  title: string
  query: string // opens a YouTube search until we host real trailers
}

export type Source = {
  label: string
  url: string
}

export type MovieInfo = {
  year: number
  runtime: string
  rating: string
  ratingNote: string
  genres: string[]
  short: string
  overview: string[]
  released: string[]
  studio: string
  country: string
  language: string
  director: string
  writers: string
  castNote: string | null
  cast: Person[]
  crew: Credit[]
  scores: Score[]
  reception: string[]
  awards: string[]
  facts: string[]
  similar: Similar[]
  trailers: Trailer[]
  sources: Source[]
}

const redline: MovieInfo = {
  year: 2009,
  runtime: '1h 42m',
  rating: 'NR',
  ratingNote: 'No US rating listed',
  genres: ['Action', 'Sci-Fi', 'Anime'],
  short:
    'A pompadoured street racer gets a last-minute shot at the Redline, the most dangerous race in the galaxy, and it is being held on a planet that wants it shut down.',
  overview: [
    'Every five years, racers from across the galaxy line up for the Redline, an anything-goes race where the machines fly, the stakes are deadly and winning makes you a legend. JP, a pompadoured driver on parole for fixing races, only gets a spot because two other drivers drop out.',
    'This year the course runs across Roboworld, a planet run by cyborg militarists who have threatened to stop the race by force. While the field gathers, JP is also tangled up in a mob deal, leaning on his friend Frisbee, and falling for fellow racer Sonoshee McLaren. The plot is thin on purpose. The point is speed, style and a finish line that keeps getting more dangerous to reach.',
  ],
  released: ['Premiere: Aug 14, 2009 (Locarno Film Festival)', 'Japan: Oct 9, 2010'],
  studio: 'Madhouse',
  country: 'Japan',
  language: 'Japanese, with an English dub',
  director: 'Takeshi Koike',
  writers: 'Katsuhito Ishii, Yōji Enokido, Yoshiki Sakurai',
  castNote: 'Japanese voice actors are listed first. The English dub actor is shown under each role.',
  cast: [
    { name: 'Takuya Kimura', role: '"Sweet" JP', dub: 'Patrick Seitz' },
    { name: 'Yū Aoi', role: 'Sonoshee McLaren', dub: 'Michelle Ruff' },
    { name: 'Tadanobu Asano', role: 'Frisbee', dub: "Liam O'Brien" },
    { name: 'Kanji Tsuda', role: 'Trava', dub: 'Joey Morris' },
    { name: 'Yoshiyuki Morishita', role: 'Shinkai', dub: 'Tony Oliver' },
    { name: 'Kenyu Horiuchi', role: 'Secretary of Defense Titan', dub: 'Doug Erholtz' },
    { name: 'Akane Sakai', role: 'Boiboi', dub: 'Lauren Landa' },
    { name: 'Akemi', role: 'Bosbos', dub: 'Laura Post' },
    { name: 'Unshō Ishizuka', role: 'Colonel Volton' },
    { name: 'Kōsei Hirota', role: 'Roboworld President', dub: 'David Lodge' },
    { name: 'Kōji Ishii', role: 'Machine Head', dub: 'Michael McConnohie' },
    { name: 'Takeshi Aono', role: 'Old Man Mole', dub: 'Steve Kramer' },
  ],
  crew: [
    { job: 'Director', names: 'Takeshi Koike (also storyboards and animation director)' },
    { job: 'Original story and characters', names: 'Katsuhito Ishii' },
    { job: 'Screenplay', names: 'Katsuhito Ishii, Yōji Enokido, Yoshiki Sakurai' },
    { job: 'Music', names: 'James Shimoji' },
    { job: 'Art', names: 'Yūko Kobari' },
    { job: 'Cinematography', names: 'Ryu Takizawa' },
    { job: 'Editing', names: 'Satoshi Terauchi, Naoki Kawanishi' },
    { job: 'Sound direction', names: 'Katsuhito Ishii, Youji Shimizu' },
    { job: 'Producers', names: 'Yukiko Koike, Kentarō Yoshida' },
    { job: 'Executive producer', names: 'Masahiro Fukushima' },
    { job: 'Studio', names: 'Madhouse' },
    { job: 'English dub direction', names: 'Alex Von David (Bang Zoom!)' },
  ],
  scores: [
    { source: 'Rotten Tomatoes audience', value: '84%', note: '1,000+ ratings. No critic score listed.' },
    { source: 'Anime News Network', value: 'A+', note: 'Overall grade. Animation A+, art A+, music A, story B+.' },
    { source: 'The Fandom Post', value: 'B+', note: 'Content grade from a home video review.' },
  ],
  reception: [
    'Anime News Network gave it an A+ and called the look unlike other anime. The reviewer also liked the techno soundtrack, and said the thin story works because it is animated.',
    'The Fandom Post enjoyed the hand-drawn action and humor, but said the story never fully pulled them in.',
    'Syfy Wire called it an underrated gem and read the underdog racer story as a critique of fascism and the military-industrial complex.',
    'It did not do well in theaters. It built a cult following on home video.',
  ],
  awards: [
    'Best Feature audience award, Los Angeles Animation Festival (Dec 2010)',
    'Festival run: Locarno (2009), then Sci-Fi-London, Annecy (out of competition) and Fantastic Fest (2010)',
  ],
  facts: [
    'It took about seven years to make and uses more than 100,000 hand-drawn frames.',
    'It is Takeshi Koike\'s first feature as director. He storyboarded it and led the animation himself.',
    'Koike has said Frank Miller\'s Sin City influenced how the film uses heavy blacks for shadow.',
    'A 2003 short, Trava: Fist Planet, introduced two of the characters, Trava and Shinkai.',
    'Critics have compared its energy to Wacky Races, Speed Racer, Jack Kirby comics and Quentin Tarantino.',
    'The 42-track soundtrack by James Shimoji came out in Japan in October 2010.',
  ],
  similar: [
    {
      title: 'Speed Racer',
      year: 2008,
      by: 'The Wachowskis',
      kind: 'Live action',
      why: 'Critics put it next to Redline. Another candy-colored racing movie where the cars do impossible things, with a much lighter tone.',
    },
    {
      title: 'Akira',
      year: 1988,
      by: 'Katsuhiro Ōtomo',
      kind: 'Anime',
      why: 'Ōtomo is one of the artists a critic saw in Redline. Hand-drawn, fast and aimed at adults.',
    },
    {
      title: 'Dead Leaves',
      year: 2004,
      by: 'Hiroyuki Imaishi',
      kind: 'Anime',
      why: 'Koike worked on it as a key animator. Same all-out, over-the-top energy, with no brakes at all.',
    },
    {
      title: 'Mad Max: Fury Road',
      year: 2015,
      by: 'George Miller',
      kind: 'Live action',
      why: 'One long chase across hostile land, built on real stunts and almost nothing but momentum.',
    },
    {
      title: 'Cowboy Bebop: The Movie',
      year: 2001,
      by: 'Shinichirō Watanabe',
      kind: 'Anime',
      why: 'Stylish sci-fi action where the music matters as much as the animation. Koike previously worked on Watanabe\'s Samurai Champloo.',
    },
  ],
  trailers: [
    { title: 'Official trailer', query: 'Redline 2009 anime official trailer' },
    { title: 'Director interview', query: 'Takeshi Koike Redline interview' },
    { title: 'Soundtrack highlights', query: 'Redline 2009 James Shimoji soundtrack' },
  ],
  sources: [
    { label: 'Wikipedia: Redline (2009 film)', url: 'https://en.wikipedia.org/wiki/Redline_(2009_film)' },
    { label: 'Anime News Network: review', url: 'https://www.animenewsnetwork.com/review/redline' },
    { label: 'Rotten Tomatoes: Redline', url: 'https://www.rottentomatoes.com/m/redline_2009' },
    { label: 'The Fandom Post: DVD review', url: 'https://www.fandompost.com/2012/01/04/redline-anime-dvd-review/' },
    {
      label: 'Syfy Wire: Redline is the best animated movie you\'ve never heard of',
      url: 'https://www.syfy.com/syfy-wire/redline-is-the-best-animated-movie-youve-never-heard-of',
    },
    {
      label: 'Reactor: interview with Takeshi Koike',
      url: 'https://reactormag.com/why-you-cant-miss-redline-an-interview-with-director-takeshi-koike',
    },
    {
      label: 'Anime News Network: LA Animation Festival award',
      url: 'https://animenewsnetwork.com/news/2010-12-13/redline-wins-audience-award-at-la-animation-fest',
    },
  ],
}

const batmanBegins: MovieInfo = {
  year: 2005,
  runtime: '2h 20m',
  rating: 'PG-13',
  ratingNote: 'Intense action violence, disturbing images and some thematic elements',
  genres: ['Action', 'Fantasy', 'Adventure'],
  short:
    'After his parents are murdered, Bruce Wayne trains overseas, then comes home to fight the crime and corruption eating Gotham City as Batman.',
  overview: [
    'Bruce Wayne watched his parents die in Gotham City, and he never stopped asking what fear does to people. He leaves home, spends years among criminals trying to understand them, and ends up training with Henri Ducard and the League of Shadows.',
    'Back in Gotham, with help from his butler Alfred and Wayne Enterprises engineer Lucius Fox, he builds the Batman: a costume, a car and a symbol meant to scare the people who prey on the city. Then he finds out the mob is only part of the problem. Dr. Jonathan Crane is turning a fear toxin into a weapon, and the League of Shadows has a plan for Gotham of its own.',
  ],
  released: ['Premiere: May 31, 2005 (Tokyo)', 'US: Jun 15, 2005', 'UK: Jun 17, 2005'],
  studio: 'Warner Bros. Pictures, Syncopy, Patalex III Productions',
  country: 'United States, United Kingdom',
  language: 'English',
  director: 'Christopher Nolan',
  writers: 'Christopher Nolan, David S. Goyer (story by David S. Goyer)',
  castNote: null,
  cast: [
    { name: 'Christian Bale', role: 'Bruce Wayne / Batman' },
    { name: 'Michael Caine', role: 'Alfred Pennyworth' },
    { name: 'Liam Neeson', role: 'Henri Ducard / Ra\'s al Ghul' },
    { name: 'Katie Holmes', role: 'Rachel Dawes' },
    { name: 'Gary Oldman', role: 'James Gordon' },
    { name: 'Cillian Murphy', role: 'Dr. Jonathan Crane / Scarecrow' },
    { name: 'Morgan Freeman', role: 'Lucius Fox' },
    { name: 'Tom Wilkinson', role: 'Carmine Falcone' },
    { name: 'Rutger Hauer', role: 'William Earle' },
    { name: 'Ken Watanabe', role: 'Decoy Ra\'s al Ghul' },
  ],
  crew: [
    { job: 'Director', names: 'Christopher Nolan' },
    { job: 'Screenplay', names: 'Christopher Nolan, David S. Goyer' },
    { job: 'Story', names: 'David S. Goyer' },
    { job: 'Producers', names: 'Charles Roven, Emma Thomas, Larry Franco' },
    { job: 'Music', names: 'Hans Zimmer, James Newton Howard' },
    { job: 'Cinematography', names: 'Wally Pfister' },
    { job: 'Editing', names: 'Lee Smith' },
    { job: 'Production design', names: 'Nathan Crowley' },
    { job: 'Production companies', names: 'Warner Bros. Pictures, Syncopy, Patalex III Productions' },
  ],
  scores: [
    { source: 'Rotten Tomatoes critics', value: '85%', note: '285 reviews' },
    { source: 'Rotten Tomatoes audience', value: '94%', note: '250,000+ ratings' },
    { source: 'Metacritic', value: '70', note: 'Out of 100, from 41 critics. "Generally favorable."' },
    { source: 'CinemaScore', value: 'A', note: 'Opening-weekend audience grade' },
  ],
  reception: [
    'Critics at release welcomed it as a revival of the Batman series. They said Nolan gave the character emotional weight, and that the focus on the origin story set it above the earlier films.',
    'The Rotten Tomatoes critics consensus calls it dark and brooding, but also exciting and smart.',
    'It earned about $375.6 million worldwide, including a 2012 re-release, on a $150 million budget.',
  ],
  awards: [
    'Academy Award nomination: Best Cinematography (Wally Pfister)',
    'Saturn Awards: Best Fantasy Film, Best Screenplay and Best Actor (Christian Bale)',
    'MTV Movie Award: Best Hero (Christian Bale)',
    'BAFTA nominations: Production Design, Sound and Visual Effects',
  ],
  facts: [
    'Nolan wanted a grounded Batman, so he leaned on real stunts and miniatures and kept CGI to a minimum. He has named Richard Donner\'s Superman as an inspiration.',
    'The Tumbler, the film\'s Batmobile, took nine months to build. It runs a 5.7-liter Chevy V8 with Baja racing truck suspension.',
    'Iceland\'s Vatnajökull glacier stood in for Bhutan, the Batcave was built at Shepperton Studios, and Mentmore Towers played Wayne Manor.',
    'Hans Zimmer wrote the action music and James Newton Howard wrote the dramatic scenes, recorded with a 90-piece orchestra.',
    'Warner Bros. required that the film not be rated R.',
    'It is often credited with popularizing the word "reboot" in Hollywood.',
  ],
  similar: [
    {
      title: 'The Dark Knight',
      year: 2008,
      by: 'Christopher Nolan',
      kind: 'Sequel',
      why: 'Same grounded Gotham and the same director, with Bruce Wayne now facing the Joker.',
    },
    {
      title: 'The Dark Knight Rises',
      year: 2012,
      by: 'Christopher Nolan',
      kind: 'Sequel',
      why: 'Finishes the trilogy that Batman Begins starts.',
    },
    {
      title: 'Casino Royale',
      year: 2006,
      by: 'Martin Campbell',
      kind: 'Reboot',
      why: 'Another franchise reboot that strips the hero back to his beginnings, with a gritty, physical tone.',
    },
    {
      title: 'Iron Man',
      year: 2008,
      by: 'Jon Favreau',
      kind: 'Origin story',
      why: 'A hero builds his own gear and his own identity. Lighter in tone, same origin-story structure.',
    },
    {
      title: 'The Prestige',
      year: 2006,
      by: 'Christopher Nolan',
      kind: 'Thriller',
      why: 'Nolan reunites with Christian Bale and Michael Caine for a darker, twistier story.',
    },
  ],
  trailers: [
    { title: 'Official trailer', query: 'Batman Begins 2005 official trailer' },
    { title: 'The Tumbler', query: 'Batman Begins Tumbler how it was built' },
    { title: 'Nolan on making the film', query: 'Christopher Nolan Batman Begins interview' },
  ],
  sources: [
    { label: 'Wikipedia: Batman Begins', url: 'https://en.wikipedia.org/wiki/Batman_Begins' },
    { label: 'Rotten Tomatoes: Batman Begins', url: 'https://www.rottentomatoes.com/m/batman_begins' },
    {
      label: 'Rotten Tomatoes: Critical Consensus',
      url: 'https://editorial.rottentomatoes.com/article/critical-consensus-does-batman-begins-achieve-perfection-does-the-perfect-man-soar',
    },
  ],
}

const info: Record<string, MovieInfo> = {
  redline,
  'batman begins': batmanBegins,
}

export function infoFor(title: string): MovieInfo | undefined {
  return info[title.trim().toLowerCase()]
}