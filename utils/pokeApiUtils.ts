export function getPokemonImageUrl(url: string) {
  const idMatch = url.match(/\/pokemon\/(\d+)\//);
  const id = idMatch ? idMatch[1] : '';
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function getPokemonId(url: string) {
  const m = url.match(/\/pokemon\/(\d+)\//);
  return m ? m[1] : '';
}
