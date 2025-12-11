// import MapView, { PROVIDER_GOOGLE, Circle } from 'react-native-maps';
// import {
//   View,
//   StyleSheet,
//   TouchableOpacity,
//   Platform,
//   PermissionsAndroid,
//   Alert,
//   Image,
//   Text,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { DrawerNavigationProp } from '@react-navigation/drawer';
// import Geolocation from '@react-native-community/geolocation';
// import React, { useEffect, useState, useRef } from 'react';
// import { Marker } from 'react-native-maps';

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   map: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   topbar: {
//     position: 'absolute',
//     top: 50,
//     left: 0,
//     right: 0,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'flex-start',
//     height: 60,
//     paddingHorizontal: 16,
//     zIndex: 1,
//   },
//   hamburger: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 20,
//   },
//   bar: {
//     width: 20,
//     height: 3,
//     backgroundColor: '#333',
//     marginVertical: 2,
//     borderRadius: 2,
//   },
//   centerButton: {
//     position: 'absolute',
//     bottom: 100,
//     right: 16,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 25,
//     zIndex: 1,
//   },
//   debugText: {
//     position: 'absolute',
//     top: 120,
//     left: 16,
//     right: 16,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     color: 'white',
//     padding: 8,
//     borderRadius: 8,
//     zIndex: 1,
//   },
//   spawnButton: {
//     position: 'absolute',
//     bottom: 160,
//     right: 16,
//     backgroundColor: 'rgba(255, 100, 100, 0.9)',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 25,
//     zIndex: 1,
//   },
// });

// const requestLocationPermission = async () => {
//   //   if (Platform.OS === 'ios') {
//   //     const auth = await Geolocation.requestAuthorization('whenInUse');
//   //     return auth === 'granted';
//   //   }

//   if (Platform.OS === 'android') {
//     const granted = await PermissionsAndroid.request(
//       PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       {
//         title: 'Location Permission',
//         message:
//           'This app needs access to your location to show you on the map.',
//         buttonNeutral: 'Ask Me Later',
//         buttonNegative: 'Cancel',
//         buttonPositive: 'OK',
//       },
//     );
//     return granted === PermissionsAndroid.RESULTS.GRANTED;
//   }

//   return false;
// };

// interface LatLng {
//   latitude: number;
//   longitude: number;
// }

// interface Geofence {
//   id: string;
//   center: LatLng;
//   radius: number;
//   title: string;
// }

// // Add Pokemon type
// interface Pokemon {
//   id: string;
//   name: string;
//   latitude: number;
//   longitude: number;
//   spriteUrl: string;
// }

// function getDistanceMeters(
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number,
// ): number {
//   const toRad = (x: number): number => (x * Math.PI) / 180;
//   const R = 6371000; // Earth radius in meters
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRad(lat1)) *
//       Math.cos(toRad(lat2)) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// export default function Map() {
//   const navigation = useNavigation<DrawerNavigationProp<any>>();
//   const [hasLocationPermission, setHasLocationPermission] = useState(false);
//   const [region, setRegion] = useState({
//     latitude: 10.352166718021245,
//     longitude: 123.9133411900118,
//     latitudeDelta: 0.015,
//     longitudeDelta: 0.0121,
//   });
//   const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);

//   // Track which geofences user is currently inside
//   const insideGeofences = useRef<Set<string>>(new Set());

//   const markers = [
//     {
//       latlng: { latitude: 10.352166718021245, longitude: 123.9133411900118 },
//       title: 'USC Talamban',
//       description: 'USC Talamban Campus',
//     },
//     {
//       latlng: { latitude: 10.324941518519026, longitude: 123.93484586106506 },
//       title: 'Parkmall',
//       description: 'A mall in Mandaue City',
//     },
//   ];

//   // Define geofences with realistic radii (in meters)
//   const geofences: Geofence[] = [
//     {
//       id: 'usc-talamban',
//       center: { latitude: 10.352166718021245, longitude: 123.9133411900118 },
//       radius: 200,
//       title: 'USC Talamban Campus',
//     },
//     {
//       id: 'parkmall',
//       center: { latitude: 10.324941518519026, longitude: 123.93484586106506 },
//       radius: 100,
//       title: 'Parkmall',
//     },
//   ];

//   // Add state for wild Pokemon
//   const [wildPokemon, setWildPokemon] = useState<Pokemon[]>([]);
//   const hasSpawned = useRef(false); // Add this to track if we've spawned

//   // Function to spawn random Pokemon near user
//   const spawnPokemonNearby = (userLat: number, userLon: number) => {
//     const pokemonCount = 5; // Spawn 5 Pokemon
//     const spawnRadius = 0.005; // ~500m radius

//     const newPokemon: Pokemon[] = [];

//     for (let i = 0; i < pokemonCount; i++) {
//       // Random offset within radius
//       const latOffset = (Math.random() - 0.5) * spawnRadius;
//       const lonOffset = (Math.random() - 0.5) * spawnRadius;

//       // Random Pokemon ID (1-151 for Gen 1)
//       const randomId = Math.floor(Math.random() * 151) + 1;

//       newPokemon.push({
//         id: `pokemon-${Date.now()}-${i}`,
//         name: `Pokemon #${randomId}`,
//         latitude: userLat + latOffset,
//         longitude: userLon + lonOffset,
//         spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${randomId}.png`,
//       });
//     }

//     console.log(`🎮 Spawned ${newPokemon.length} Pokémon at`, userLat, userLon);
//     setWildPokemon(newPokemon);
//   };

//   const centerOnCurrentLocation = () => {
//     if (currentLocation) {
//       setRegion({
//         latitude: currentLocation.latitude,
//         longitude: currentLocation.longitude,
//         latitudeDelta: 0.015,
//         longitudeDelta: 0.0121,
//       });
//     }
//   };

//   // Check if user is near a Pokemon
//   const checkPokemonProximity = (userLat: number, userLon: number) => {
//     wildPokemon.forEach(pokemon => {
//       const distance = getDistanceMeters(
//         userLat,
//         userLon,
//         pokemon.latitude,
//         pokemon.longitude,
//       );

//       // If within 20 meters, trigger encounter
//       if (distance <= 20) {
//         Alert.alert('Wild Pokémon Appeared!', `You found ${pokemon.name}!`, [
//           {
//             text: 'Catch',
//             onPress: () => {
//               // Remove caught Pokemon
//               setWildPokemon(prev => prev.filter(p => p.id !== pokemon.id));
//               Alert.alert('Success!', `You caught ${pokemon.name}!`);
//             },
//           },
//           { text: 'Run', style: 'cancel' },
//         ]);
//       }
//     });
//   };

//   useEffect(() => {
//     const getLocation = async () => {
//       const hasPermission = await requestLocationPermission();
//       setHasLocationPermission(hasPermission);

//       if (hasPermission) {
//         Geolocation.getCurrentPosition(
//           position => {
//             setRegion({
//               latitude: position.coords.latitude,
//               longitude: position.coords.longitude,
//               latitudeDelta: 0.015,
//               longitudeDelta: 0.0121,
//             });
//           },
//           error => {
//             console.log('Location error:', error.code, error.message);
//           },
//           {
//             enableHighAccuracy: true,
//             timeout: 15000,
//             maximumAge: 10000,
//           },
//         );
//       }
//     };

//     getLocation();
//   }, []);

//   useEffect(() => {
//     console.log('🔍 hasLocationPermission:', hasLocationPermission);
//     if (!hasLocationPermission) return;

//     const watchId = Geolocation.watchPosition(
//       position => {
//         const { latitude, longitude } = position.coords;
//         console.log('📍 Position update:', latitude, longitude);

//         setCurrentLocation({ latitude, longitude });

//         // Spawn Pokemon on first location update
//         if (!hasSpawned.current) {
//           console.log('🎯 About to spawn Pokemon...');
//           hasSpawned.current = true;
//           spawnPokemonNearby(latitude, longitude);
//         } else {
//           console.log('⏭️ Already spawned, skipping');
//         }

//         // Check Pokemon proximity
//         checkPokemonProximity(latitude, longitude);

//         geofences.forEach(fence => {
//           const distance = getDistanceMeters(
//             latitude,
//             longitude,
//             fence.center.latitude,
//             fence.center.longitude,
//           );

//           const isInside = distance <= fence.radius;
//           const wasInside = insideGeofences.current.has(fence.id);

//           // Trigger events only on state changes
//           if (isInside && !wasInside) {
//             // Just entered the geofence
//             insideGeofences.current.add(fence.id);
//             console.log(`✅ ENTERED geofence: ${fence.title}`);
//             console.log(
//               `Distance: ${distance.toFixed(2)}m (within ${fence.radius}m)`,
//             );

//             Alert.alert('Geofence Entry', `You entered ${fence.title}`, [
//               { text: 'OK' },
//             ]);
//           } else if (!isInside && wasInside) {
//             // Just exited the geofence
//             insideGeofences.current.delete(fence.id);
//             console.log(`❌ EXITED geofence: ${fence.title}`);
//             console.log(
//               `Distance: ${distance.toFixed(2)}m (outside ${fence.radius}m)`,
//             );

//             Alert.alert('Geofence Exit', `You left ${fence.title}`, [
//               { text: 'OK' },
//             ]);
//           }
//         });
//       },
//       error => {
//         console.log('❌ Location error:', error.code, error.message);
//       },
//       {
//         enableHighAccuracy: true,
//         distanceFilter: 10,
//         interval: 5000,
//       },
//     );

//     return () => {
//       Geolocation.clearWatch(watchId);
//       insideGeofences.current.clear();
//       hasSpawned.current = false;
//     };
//   }, [hasLocationPermission]);

//   // Manual spawn function for testing
//   const manualSpawn = () => {
//     if (!currentLocation) {
//       Alert.alert('No Location', 'Waiting for GPS signal. Please wait...');
//       return;
//     }

//     const lat = currentLocation.latitude;
//     const lon = currentLocation.longitude;

//     console.log('🎮 Manual spawn at:', lat, lon);
//     spawnPokemonNearby(lat, lon);
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.topbar}>
//         <TouchableOpacity
//           style={styles.hamburger}
//           onPress={() => navigation.openDrawer()}
//           accessibilityLabel="Open drawer menu"
//         >
//           <View style={styles.bar} />
//           <View style={styles.bar} />
//           <View style={styles.bar} />
//         </TouchableOpacity>
//       </View>

//       {/* Debug info */}
//       <Text style={styles.debugText}>
//         Pokémon spawned: {wildPokemon.length}
//         {currentLocation &&
//           `\nLat: ${currentLocation.latitude.toFixed(
//             6,
//           )}, Lon: ${currentLocation.longitude.toFixed(6)}`}
//         {wildPokemon.length > 0 &&
//           `\nFirst Pokemon: ${wildPokemon[0].latitude.toFixed(
//             6,
//           )}, ${wildPokemon[0].longitude.toFixed(6)}`}
//       </Text>

//       {/* Spawn button for testing */}
//       <TouchableOpacity style={styles.spawnButton} onPress={manualSpawn}>
//         <Text>🎮 Spawn Pokémon</Text>
//       </TouchableOpacity>

//       {/* Center button */}
//       <TouchableOpacity
//         style={styles.centerButton}
//         onPress={centerOnCurrentLocation}
//       >
//         <Text>📍 Center on Me</Text>
//       </TouchableOpacity>

//       <MapView
//         provider={PROVIDER_GOOGLE}
//         style={styles.map}
//         region={region}
//         showsUserLocation={true}
//         showsMyLocationButton={true}
//         followsUserLocation={true}
//       >
//         {/* Render markers */}
//         {markers.map((marker, index) => (
//           <Marker
//             key={index}
//             coordinate={marker.latlng}
//             title={marker.title}
//             description={marker.description}
//           />
//         ))}

//         {/* Wild Pokemon markers - make them more visible */}
//         {wildPokemon.map(pokemon => (
//           <Marker
//             key={pokemon.id}
//             coordinate={{
//               latitude: pokemon.latitude,
//               longitude: pokemon.longitude,
//             }}
//             title={pokemon.name}
//             description={`Distance: ~${Math.floor(Math.random() * 500)}m`}
//           >
//             <View
//               style={{
//                 backgroundColor: 'rgba(255, 0, 0, 0.8)',
//                 padding: 8,
//                 borderRadius: 20,
//                 borderWidth: 2,
//                 borderColor: 'white',
//               }}
//             >
//               <Image
//                 source={{ uri: pokemon.spriteUrl }}
//                 style={{ width: 50, height: 50 }}
//               />
//             </View>
//           </Marker>
//         ))}

//         {/* Visualize geofences as circles */}
//         {geofences.map(fence => (
//           <Circle
//             key={fence.id}
//             center={fence.center}
//             radius={fence.radius}
//             strokeColor="rgba(0, 122, 255, 0.5)"
//             fillColor="rgba(0, 122, 255, 0.1)"
//             strokeWidth={2}
//           />
//         ))}
//       </MapView>
//     </View>
//   );
// }
