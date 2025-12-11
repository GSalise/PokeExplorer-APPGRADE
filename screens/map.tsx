import React, { useRef, useState, useEffect } from 'react';
import MapView, {
  PROVIDER_GOOGLE,
  Region,
  Marker,
  Circle,
} from 'react-native-maps';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePokeDexApi } from '../hooks/usePokeApi';
import { calculateDistance } from '../utils/calculateDistance';
import { Pokemon } from '../types/pokemon';
import { CachedLocation } from '../types/cachedLoaction';
import { getPokemonId, getPokemonImageUrl } from '../utils/pokeApiUtils';
import LinearGradient from 'react-native-linear-gradient';

// Initial region centered at USC
const INITIAL_REGION = {
  latitude: 10.352120359529026,
  longitude: 123.91325350658207,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const LOCATION_CACHE_KEY = '@user_last_location';
const LOCATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const GEOFENCE_RADIUS = 10; // 10 meters

// Helper to extract the numeric id for navigation

const PermissionPage = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Location permission is required to use the map.</Text>
  </View>
);

const requestLocationPermission = async () => {
  if (Platform.OS === 'ios') {
    Geolocation.requestAuthorization();
    return true;
  }

  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'PokeExplorer needs access to your location to show nearby Pokémon',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return false;
};

export default function Map() {
  const mapRef = useRef<MapView>(null);
  const [randomOffset, setRandomOffset] = useState(
    Math.floor(Math.random() * 148),
  );
  const { data, refetch } = usePokeDexApi(3, randomOffset, false);
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const hasSpawned = useRef(false);
  const insideGeofences = useRef(new Set<string>()); // Track which geofences user is inside
  const [lastStaticLocation, setLastStaticLocation] = useState<Region | null>(
    null,
  );
  const [lastMovedAt, setLastMovedAt] = useState(Date.now());

  // Load cached location
  const loadCachedLocation = async () => {
    try {
      const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
      if (cached) {
        const cachedData: CachedLocation = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid (within 5 minutes)
        if (now - cachedData.timestamp < LOCATION_CACHE_DURATION) {
          console.log(
            'Using cached location:',
            cachedData.latitude,
            cachedData.longitude,
          );
          setUserRegion({
            latitude: cachedData.latitude,
            longitude: cachedData.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          return cachedData;
        } else {
          console.log('Cache expired');
        }
      }
    } catch (error) {
      console.warn('Error loading cached location:', error);
    }
    return null;
  };

  // Save location to cache
  const saveCachedLocation = async (latitude: number, longitude: number) => {
    try {
      const cachedData: CachedLocation = {
        latitude,
        longitude,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        LOCATION_CACHE_KEY,
        JSON.stringify(cachedData),
      );
      console.log('Saved location to cache');
    } catch (error) {
      console.warn('Error saving location:', error);
    }
  };

  const spawnPokemon = async (latitude: number, longitude: number) => {
    if (!data?.results) return;

    const spawnRadius = 0.0009;
    const newPokemons: Pokemon[] = [];

    for (let i = 0; i < data.results.length; i++) {
      const poke = data.results[i];
      const id = getPokemonId(poke.url);
      const spriteUrl = getPokemonImageUrl(poke.url);

      // Prefetch the image
      await Image.prefetch(spriteUrl);

      const latOffset = (Math.random() - 0.5) * spawnRadius;
      const lonOffset = (Math.random() - 0.5) * spawnRadius;

      newPokemons.push({
        id: `pokemon-${Date.now()}-${i}`,
        pokedexId: id, // Store the actual Pokedex ID
        latitude: latitude + latOffset,
        longitude: longitude + lonOffset,
        spriteUrl,
        name: poke.name,
      });
    }

    setPokemons(newPokemons);
    hasSpawned.current = true;
  };

  // Check if user is inside the pokemon's geofence
  const checkPokemonProximity = (userLat: number, userLon: number) => {
    pokemons.forEach(pokemon => {
      const distance = calculateDistance(
        userLat,
        userLon,
        pokemon.latitude,
        pokemon.longitude,
      );

      const isInside = distance <= GEOFENCE_RADIUS;
      const wasInside = insideGeofences.current.has(pokemon.id);

      // User just entered geofence
      if (isInside && !wasInside) {
        insideGeofences.current.add(pokemon.id);
        Alert.alert(
          'Wild Pokémon Nearby!',
          `A wild ${pokemon.name || 'Pokémon'} appeared! Distance: ${Math.round(
            distance,
          )}m`,
          [
            {
              text: 'Catch!',
              onPress: () =>
                navigation.navigate('PokemonAR', {
                  pokemonid: pokemon.pokedexId, // Use the actual Pokedex ID
                }),
            },
            { text: 'OK' },
          ],
        );
        console.log(
          `Entered geofence for ${pokemon.name} at ${Math.round(distance)}m`,
        );
      }
      // User left geofence
      else if (!isInside && wasInside) {
        insideGeofences.current.delete(pokemon.id);
        console.log(`Left geofence for ${pokemon.name}`);
      }
    });
  };

  // Checks if location permission is granted and gets current location
  useEffect(() => {
    const initializeLocation = async () => {
      const granted = await requestLocationPermission();
      setHasLocationPermission(granted);

      if (!granted) {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use this feature.',
        );
        return;
      }

      // Try to load cached location first for immediate display
      const cachedLocation = await loadCachedLocation();

      // Always try to get fresh location
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          console.log('Got fresh location:', latitude, longitude);
          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setUserRegion(newRegion);
          saveCachedLocation(latitude, longitude);
        },
        error => {
          console.warn('Location error:', error);
          if (error.code === 2) {
            Alert.alert(
              'Turn On Location',
              'Please enable your Location Services to continue.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ],
            );
          } else if (error.code === 3) {
            console.log('⏱Location timeout, retrying...');
            // Retry with longer timeout if it timed out
            Geolocation.getCurrentPosition(
              position => {
                const { latitude, longitude } = position.coords;
                console.log('Got location on retry:', latitude, longitude);
                setUserRegion({
                  latitude,
                  longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });
                saveCachedLocation(latitude, longitude);
              },
              err => console.warn('Retry failed:', err),
              { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 },
            );
          }

          // If we have cached location, use it as fallback
          if (cachedLocation && !userRegion) {
            console.log('Using cached location as fallback');
            setUserRegion({
              latitude: cachedLocation.latitude,
              longitude: cachedLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000, // Increased to 20 seconds
          maximumAge: 0,
        },
      );
    };

    initializeLocation();
  }, []);

  // Watch position updates and refresh cache every 5 minutes
  useEffect(() => {
    if (!hasLocationPermission) return;

    const watchId = Geolocation.watchPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        // If user moved more than 10 meters, update lastMovedAt
        if (
          !lastStaticLocation ||
          calculateDistance(
            lastStaticLocation.latitude,
            lastStaticLocation.longitude,
            latitude,
            longitude,
          ) > 10
        ) {
          setLastMovedAt(Date.now());
          setLastStaticLocation(newRegion);
        }

        setUserRegion(newRegion);
        saveCachedLocation(latitude, longitude);
        checkPokemonProximity(latitude, longitude);
      },
      err => console.warn('Watch error:', err),
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 2000,
      },
    );

    return () => {
      Geolocation.clearWatch(watchId);
      insideGeofences.current.clear();
    };
  }, [hasLocationPermission, pokemons, lastStaticLocation]);

  // Timer to refresh spawn every 5 minutes if user hasn't moved beyond 10 meters
  useEffect(() => {
    const interval = setInterval(() => {
      // 5 minutes = 300000 ms
      if (Date.now() - lastMovedAt > 300000) {
        handleRefreshSpawn();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lastMovedAt, userRegion]);

  // Spawn Pokémon on initial load only
  useEffect(() => {
    if (!hasLocationPermission) return;
    if (!userRegion) return;
    if (!data?.results) return;

    // Only spawn if we haven't spawned yet
    if (!hasSpawned.current) {
      spawnPokemon(userRegion.latitude, userRegion.longitude);
    }
  }, [hasLocationPermission, userRegion, data]);

  // Manual refresh pokemon spawn
  const handleRefreshSpawn = async (manual: boolean = false) => {
    if (userRegion) {
      // Generate new random offset (0-148 for 151 total Pokemon)
      const newOffset = Math.floor(Math.random() * 148);
      console.log(`🔄 Fetching new Pokemon with offset: ${newOffset}`);

      setRandomOffset(newOffset);
      insideGeofences.current.clear(); // Clear geofence tracking
      hasSpawned.current = false; // Reset spawn flag so it can spawn again

      // Refetch with new offset
      const result = await refetch();

      // Manually spawn after refetch completes
      if (result.data?.results) {
        spawnPokemon(userRegion.latitude, userRegion.longitude);
      }

      if (manual) {
        Alert.alert('Spawned!', 'New Pokémon have appeared nearby!');
      }
    } else {
      Alert.alert(
        'No Location',
        'Please wait for your location to be detected.',
      );
    }
  };

  return (
    <View style={styles.container}>
      {!hasLocationPermission ? (
        <PermissionPage />
      ) : (
        <>
          <StatusBar barStyle="light-content" />
          <LinearGradient
            colors={['#DC0A2D', '#FF6B6B']}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <Text style={styles.title}>PokéMap</Text>
            </View>
          </LinearGradient>
          {/* Debug Button - Refresh spawn button */}
          {/* <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => handleRefreshSpawn(true)}
          >
            <Text style={styles.refreshButtonText}>DEBUG - Refresh Spawn</Text>
          </TouchableOpacity> */}

          {/* Map Container */}
          <View style={styles.mapContainer}>
            <MapView
              style={styles.mapSmall}
              provider={PROVIDER_GOOGLE}
              initialRegion={userRegion || INITIAL_REGION}
              showsUserLocation
              showsMyLocationButton
              ref={mapRef}
            >
              {/* Display Pokémon markers with geofence circles */}
              {pokemons.map(pokemon => (
                <React.Fragment key={pokemon.id}>
                  {/* Geofence circle */}
                  <Circle
                    center={{
                      latitude: pokemon.latitude,
                      longitude: pokemon.longitude,
                    }}
                    radius={GEOFENCE_RADIUS}
                    fillColor="rgba(255, 0, 0, 0.33)"
                    strokeColor="rgba(255, 0, 0, 0.3)"
                    strokeWidth={2}
                  />

                  {/* Pokemon marker */}
                  <Marker
                    coordinate={{
                      latitude: pokemon.latitude,
                      longitude: pokemon.longitude,
                    }}
                    title={
                      pokemon.name
                        ? pokemon.name.charAt(0).toUpperCase() +
                          pokemon.name.slice(1)
                        : 'Wild Pokémon'
                    }
                    description={`Go to this location to encounter!`}
                    anchor={{ x: 0.5, y: 0.5 }}
                    centerOffset={{ x: 0, y: 0 }}
                  >
                    <View
                      style={{
                        backgroundColor: 'rgba(255, 0, 0, 0.8)',
                        borderRadius: 25,
                        padding: 5,
                        borderWidth: 2,
                        borderColor: 'white',
                      }}
                    >
                      <Image
                        source={{ uri: pokemon.spriteUrl }}
                        style={{ width: 40, height: 40 }}
                      />
                    </View>
                  </Marker>
                </React.Fragment>
              ))}
            </MapView>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
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
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    backgroundColor: '#fff',
  },
  mapSmall: {
    width: '100%',
    height: '100%',
  },
  topbar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 60,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  hamburger: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  bar: {
    width: 20,
    height: 3,
    backgroundColor: '#333',
    marginVertical: 2,
    borderRadius: 2,
  },
  debugBox: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 8,
    zIndex: 1,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
