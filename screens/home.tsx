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
  Modal,
  ScrollView,
} from 'react-native';
import { usePokeDexApi, PokemonData } from '../hooks/usePokeApi';
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

// Type color mapping
const TYPE_COLORS: { [key: string]: string } = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

function Home() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [offset, setOffset] = useState(0);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonData | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);

  const { data, isLoading, error, isRefetching, refetch } = usePokeDexApi(
    20,
    offset,
    true, // Changed to true to fetch detailed data
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

  const handlePokemonPress = (item: PokemonData) => {
    setSelectedPokemon(item);
    setModalVisible(true);
  };

  const renderFooter = () => (
    <Text style={styles.footerText}>
      Pull down from the top to refresh Pokédex
    </Text>
  );

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
                onPress={() => handlePokemonPress(item)}
                accessibilityRole="button"
                accessibilityLabel={`View details for ${item.name}`}
              >
                <Text style={styles.pokemonId}>#{id.padStart(3, '0')}</Text>
                <Image
                  source={{
                    uri:
                      item.sprites?.official_artwork ||
                      getPokemonImageUrl(item.url),
                  }}
                  style={styles.image}
                />
                <Text style={styles.name}>{item.name}</Text>
                {item.types && (
                  <View style={styles.typesContainer}>
                    {item.types.map((type, index) => (
                      <View
                        key={index}
                        style={[
                          styles.typeBadge,
                          { backgroundColor: TYPE_COLORS[type] || '#777' },
                        ]}
                      >
                        <Text style={styles.typeText}>{type}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          style={{ width: '100%' }}
          contentContainerStyle={{}}
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          ListFooterComponent={renderFooter}
        />
      </View>

      {/* Pokemon Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedPokemon && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {selectedPokemon.name}
                    </Text>
                    <Text style={styles.modalId}>
                      #{getPokemonId(selectedPokemon.url).padStart(3, '0')}
                    </Text>
                  </View>

                  <Image
                    source={{
                      uri:
                        selectedPokemon.sprites?.official_artwork ||
                        getPokemonImageUrl(selectedPokemon.url),
                    }}
                    style={styles.modalImage}
                  />

                  {/* Types */}
                  {selectedPokemon.types && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Types</Text>
                      <View style={styles.typesRow}>
                        {selectedPokemon.types.map((type, index) => (
                          <View
                            key={index}
                            style={[
                              styles.typeBadgeLarge,
                              { backgroundColor: TYPE_COLORS[type] || '#777' },
                            ]}
                          >
                            <Text style={styles.typeBadgeLargeText}>
                              {type}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Stats */}
                  {selectedPokemon.stats && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Base Stats</Text>
                      {Object.entries(selectedPokemon.stats).map(
                        ([key, value]) => (
                          <View key={key} style={styles.statRow}>
                            <Text style={styles.statName}>
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </Text>
                            <View style={styles.statBarContainer}>
                              <View
                                style={[
                                  styles.statBar,
                                  { width: `${(value / 255) * 100}%` },
                                ]}
                              />
                            </View>
                            <Text style={styles.statValue}>{value}</Text>
                          </View>
                        ),
                      )}
                    </View>
                  )}

                  {/* Abilities */}
                  {selectedPokemon.abilities && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Abilities</Text>
                      {selectedPokemon.abilities.map((ability, index) => (
                        <Text key={index} style={styles.abilityText}>
                          • {ability}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* AR Button */}
                  <TouchableOpacity
                    style={styles.arButton}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('PokemonAR', {
                        pokemonid: getPokemonId(selectedPokemon.url),
                      });
                    }}
                  >
                    <Text style={styles.arButtonText}>View in AR</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  },
  card: {
    flex: 1,
    height: 240,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    width: '80%',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  pokemonId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    position: 'absolute',
    top: 8,
    right: 8,
  },
  typesContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  footerText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
    fontSize: 14,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    textTransform: 'capitalize',
  },
  modalId: {
    fontSize: 20,
    fontWeight: '700',
    color: '#666',
  },
  modalImage: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  typesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  typeBadgeLargeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statName: {
    width: 120,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'capitalize',
  },
  statBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  statBar: {
    height: '100%',
    backgroundColor: '#DC0A2D',
    borderRadius: 4,
  },
  statValue: {
    width: 40,
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    textAlign: 'right',
  },
  abilityText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  arButton: {
    backgroundColor: '#DC0A2D',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  arButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
