import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const CACHE_PREFIX = 'pokemonListCache';

export interface PokemonData {
  name: string;
  url: string;
  flavor_text?: string;
}

interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<PokemonData>;
}

interface PokemonSpeciesResponse {
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }>;
}

// Fetch Pokemon list without flavor text (faster)
const fetchPokemonSimple = async (limit: number, offset: number) => {
  const cacheKey = `${CACHE_PREFIX}_simple_${limit}_${offset}`;
  const cached = await AsyncStorage.getItem(cacheKey);

  if (cached) {
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      return data;
    }
  }

  const listResp = await axios.get(
    `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`,
  );

  const data = {
    count: listResp.data.count,
    next: listResp.data.next,
    previous: listResp.data.previous,
    results: listResp.data.results,
  };

  await AsyncStorage.setItem(
    cacheKey,
    JSON.stringify({ timestamp: Date.now(), data }),
  );

  return data;
};

// Fetch Pokemon list with flavor text (slower)
const fetchPokemonWithFlavor = async (limit: number, offset: number) => {
  const cacheKey = `${CACHE_PREFIX}_${limit}_${offset}`;
  const cached = await AsyncStorage.getItem(cacheKey);

  if (cached) {
    const { timestamp, data } = JSON.parse(cached);
    // Invalidate cache after 24 hours
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      return data;
    }
  }

  const listResp = await axios.get(
    `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`,
  );
  const results = listResp.data.results;

  // Fetches the flavor_text of the pokemon
  const detailed = await Promise.all(
    results.map(async (p: { name: string; url: string }) => {
      const pokeResp = await axios.get(p.url);
      const speciesUrl = pokeResp.data.species.url;

      const speciesResp = await axios.get(speciesUrl);
      const entries = speciesResp.data
        .flavor_text_entries as PokemonSpeciesResponse['flavor_text_entries'];

      // Pick English flavor text
      const engEntry = entries.find(e => e.language.name === 'en');
      const flavorText = engEntry ? engEntry.flavor_text : '';

      return {
        name: p.name,
        url: p.url,
        flavor_text: flavorText,
      };
    }),
  );

  const data = {
    count: listResp.data.count,
    next: listResp.data.next,
    previous: listResp.data.previous,
    results: detailed,
  };

  await AsyncStorage.setItem(
    cacheKey,
    JSON.stringify({ timestamp: Date.now(), data }),
  );

  return data;
};

export const usePokeDexApi = (
  limit: number = 20,
  offset: number = 0,
  withFlavor: boolean = true,
) => {
  const query = useQuery<PokemonListResponse>({
    queryKey: ['pokemonList', limit, offset, withFlavor],
    queryFn: () =>
      withFlavor
        ? fetchPokemonWithFlavor(limit, offset)
        : fetchPokemonSimple(limit, offset),
  });
  return query;
};
