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
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { usePokeDexApi, PokemonData } from '../hooks/usePokeApi';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getPokemonId, getPokemonImageUrl } from '../utils/pokeApiUtils';
import axios from 'axios';

const searchIcon = <Ionicons name="search" size={24} color="#fff" />;
const closeIcon = <Ionicons name="close" size={24} color="#fff" />;
const micIcon = <Ionicons name="mic" size={20} color="#333" />;

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
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PokemonData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const searchWidth = useState(new Animated.Value(0))[0];

  const { data, isLoading, error, isRefetching, refetch } = usePokeDexApi(
    20,
    offset,
    true,
  );

  console.log('Pokedex error:', error);

  const toggleSearch = () => {
    if (searchExpanded) {
      // Collapse
      Animated.timing(searchWidth, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setSearchExpanded(false);
        setSearchQuery('');
        setSearchMode(false);
        setSearchResults([]);
      });
    } else {
      // Expand
      setSearchExpanded(true);
      Animated.timing(searchWidth, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleVoiceSearch = () => {
    // TODO: Implement voice search functionality
    console.log('Voice search triggered');
  };

  const handleSearchNow = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Empty Search', 'Please enter a Pokémon name or ID');
      return;
    }

    setIsSearching(true);
    setSearchMode(true);

    try {
      // Search by name or ID
      const query = searchQuery.toLowerCase().trim();
      const response = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${query}`,
      );

      const pokeData = response.data;

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

      const pokemon: PokemonData = {
        name: pokeData.name,
        url: `https://pokeapi.co/api/v2/pokemon/${pokeData.id}/`,
        types,
        abilities,
        stats,
        sprites,
      };

      setSearchResults([pokemon]);
    } catch (err: any) {
      if (err.response?.status === 404) {
        Alert.alert(
          'Not Found',
          `No Pokémon found with name or ID "${searchQuery}" \n\nPlease ensure the name/ID is correct and try again.`,
        );
      } else {
        Alert.alert('Error', 'Failed to search for Pokémon. Please try again.');
      }
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchMode(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Use search results if in search mode, otherwise use normal data
  const displayData = searchMode ? searchResults : data?.results;

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
    if (searchMode) {
      handleClearSearch();
    }
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
    <View>
      {searchMode && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={handleClearSearch}
        >
          <Text style={styles.clearSearchText}>Clear Search</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.footerText}>
        Pull down from the top to refresh Pokédex
      </Text>
    </View>
  );

  // const interpolatedWidth = searchWidth.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: ['0%', '100%'],
  // });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#DC0A2D', '#FF6B6B']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          {!searchExpanded && <Text style={styles.title}>Pokédex</Text>}

          <View
            style={[
              styles.searchContainer,
              searchExpanded && { flex: 1, marginLeft: 10 },
            ]}
          >
            {searchExpanded && (
              <Animated.View style={[styles.searchBar, { flex: 1 }]}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search Pokémon..."
                  placeholderTextColor="#ccc"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  returnKeyType="search"
                  onSubmitEditing={handleSearchNow}
                />
                {/* kapoy naman */}
                {/* <TouchableOpacity
                  style={styles.voiceButton}
                  onPress={handleVoiceSearch}
                >
                  {micIcon}
                </TouchableOpacity> */}
                <TouchableOpacity
                  style={styles.searchNowButton}
                  onPress={handleSearchNow}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <ActivityIndicator size="small" color="#DC0A2D" />
                  ) : (
                    <Ionicons name="arrow-forward" size={20} color="#DC0A2D" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}

            <TouchableOpacity
              style={styles.searchIconButton}
              onPress={toggleSearch}
            >
              {searchExpanded ? closeIcon : searchIcon}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      <View style={styles.innerContainer}>
        {searchMode && searchResults.length === 0 && !isSearching && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No results found</Text>
          </View>
        )}
        <FlatList
          data={displayData}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 44,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    color: '#333',
    fontSize: 16,
    paddingVertical: 8,
  },
  voiceButton: {
    padding: 4,
    marginRight: 4,
  },
  searchNowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(220, 10, 45, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceIcon: {
    fontSize: 20,
  },
  searchIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 20,
  },
  innerContainer: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  clearSearchButton: {
    backgroundColor: '#DC0A2D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: 'center',
    marginVertical: 16,
  },
  clearSearchText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
