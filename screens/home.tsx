import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
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
    false,
  );

  console.log('Pokedex error:', error);

  if (isLoading) {
    return (
      <LinearGradient colors={['#DC0A2D', '#FF6B6B']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Pokédex...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#DC0A2D', '#FF6B6B']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorMessage}>Failed to load Pokédex</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
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
      <StatusBar barStyle="light-content" />
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 32,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  retryText: {
    color: '#DC0A2D',
    fontSize: 16,
    fontWeight: '700',
  },
});
