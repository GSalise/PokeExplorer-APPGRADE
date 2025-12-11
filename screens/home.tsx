import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { usePokeDexApi } from '../hooks/usePokeApi';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

function getPokemonImageUrl(url: string) {
  const idMatch = url.match(/\/pokemon\/(\d+)\//);
  const id = idMatch ? idMatch[1] : '';
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

// Helper to extract the numeric id for navigation
function getPokemonId(url: string) {
  const m = url.match(/\/pokemon\/(\d+)\//);
  return m ? m[1] : '';
}

function Home() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [offset, setOffset] = useState(0);
  const { data, isLoading, error, isRefetching, refetch } = usePokeDexApi(
    20,
    offset,
  );

  console.log('Pokedex error:', error);

  if (isLoading) {
    return (
      <LinearGradient colors={['#ff0000', '#fff']} style={styles.container}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size={64} color="#ff0000" />
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#ff0000', '#fff']} style={styles.container}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text>Error loading Pokédex.</Text>
        </View>
      </LinearGradient>
    );
  }

  const handleRefresh = () => {
    const maxOffset = 1328 - 28;
    const newOffset = Math.floor(Math.random() * maxOffset);
    setOffset(newOffset);
    refetch();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#DC0A2D', '#FF6B6B']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Pokédex</Text>
        </View>
      </LinearGradient>
      <View style={styles.innerContainer}>
        <FlatList
          data={data?.results}
          keyExtractor={item => item.name}
          renderItem={({ item }) => {
            const id = getPokemonId(item.url);
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('PokemonAR', { pokemonid: id })
                }
                accessibilityRole="button"
                accessibilityLabel={`Open AR for ${item.name}`}
              >
                <Text style={styles.pokemonId}>#{id.padStart(3, '0')}</Text>
                <Image
                  source={{ uri: getPokemonImageUrl(item.url) }}
                  style={styles.image}
                />
                <Text style={styles.name}>{item.name}</Text>
              </TouchableOpacity>
            );
          }}
          style={{ width: '100%' }}
          contentContainerStyle={{}}
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          numColumns={2}
        />
      </View>
    </View>
  );
}

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerGradient: {
    paddingTop: 48,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  innerContainer: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
    paddingHorizontal: 10,
  },
  card: {
    flex: 1,
    height: 240,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 5,
    elevation: 2,
  },
  image: {
    width: 160,
    height: 160,
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    width: '80%',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  pokemonId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    position: 'absolute',
    top: 8,
    right: 8,
  },
  flavor_text: {
    fontSize: 12,
    fontStyle: 'italic',
    width: '80%',
    textAlign: 'left',
  },
});
