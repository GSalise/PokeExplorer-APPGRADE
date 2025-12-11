import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const CACHE_PREFIX = 'pokemonListCache';

export interface PokemonData {
  name: string;
  url: string;
  types?: string[];
  abilities?: string[];
  stats?: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  sprites?: {
    front_default: string;
    front_shiny?: string;
    official_artwork?: string;
  };
}

interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<PokemonData>;
}

// Fetch Pokemon list without details (faster)
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

// Fetch Pokemon list with full details (types, abilities, stats, sprites)
const fetchPokemonWithDetails = async (limit: number, offset: number) => {
  const cacheKey = `${CACHE_PREFIX}_detailed_${limit}_${offset}`;
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

  // Fetch detailed info for each Pokémon
  const detailed = await Promise.all(
    results.map(async (p: { name: string; url: string }) => {
      const pokeResp = await axios.get(p.url);
      const pokeData = pokeResp.data;

      // Extract types
      const types = pokeData.types.map(
        (t: { type: { name: string } }) => t.type.name,
      );

      // Extract abilities
      const abilities = pokeData.abilities.map(
        (a: { ability: { name: string } }) => a.ability.name,
      );

      // Extract stats
      const stats = {
        hp: pokeData.stats[0].base_stat,
        attack: pokeData.stats[1].base_stat,
        defense: pokeData.stats[2].base_stat,
        specialAttack: pokeData.stats[3].base_stat,
        specialDefense: pokeData.stats[4].base_stat,
        speed: pokeData.stats[5].base_stat,
      };

      // Extract sprites
      const sprites = {
        front_default: pokeData.sprites.front_default,
        front_shiny: pokeData.sprites.front_shiny,
        official_artwork:
          pokeData.sprites.other?.['official-artwork']?.front_default,
      };

      return {
        name: p.name,
        url: p.url,
        types,
        abilities,
        stats,
        sprites,
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
  detailed: boolean = true,
) => {
  const query = useQuery<PokemonListResponse>({
    queryKey: ['pokemonList', limit, offset, detailed],
    queryFn: () =>
      detailed
        ? fetchPokemonWithDetails(limit, offset)
        : fetchPokemonSimple(limit, offset),
  });
  return query;
};
