// Real art, by movie title. Files live in web/public/posters/.
// TODO: replace both lookups with poster_url and backdrop_url columns on Movie
// once the add-movie form exists.
const posters: Record<string, string> = {
  redline: '/posters/redline.png',
  'batman begins': '/posters/batman-begins.png',
}

// Wide pictures for the top of the movie page.
const backdrops: Record<string, string> = {
  redline: '/posters/redline-hero.png',
}

function key(title: string): string {
  return title.trim().toLowerCase()
}

export function posterFor(title: string): string | undefined {
  return posters[key(title)]
}

export function backdropFor(title: string): string | undefined {
  return backdrops[key(title)]
}