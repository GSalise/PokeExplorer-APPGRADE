import MapView, { PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Geolocation from '@react-native-community/geolocation';
import React, { useEffect, useState, useRef } from 'react';
import { Marker } from 'react-native-maps';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
});

const requestLocationPermission = async () => {
  //   if (Platform.OS === 'ios') {
  //     const auth = await Geolocation.requestAuthorization('whenInUse');
  //     return auth === 'granted';
  //   }

  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message:
          'This app needs access to your location to show you on the map.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  return false;
};

interface LatLng {
  latitude: number;
  longitude: number;
}

interface Geofence {
  id: string;
  center: LatLng;
  radius: number;
  title: string;
}

function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (x: number): number => (x * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Map() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [region, setRegion] = useState({
    latitude: 10.352166718021245,
    longitude: 123.9133411900118,
    latitudeDelta: 0.015,
    longitudeDelta: 0.0121,
  });

  // Track which geofences user is currently inside
  const insideGeofences = useRef<Set<string>>(new Set());

  const markers = [
    {
      latlng: { latitude: 10.352166718021245, longitude: 123.9133411900118 },
      title: 'USC Talamban',
      description: 'USC Talamban Campus',
    },
    {
      latlng: { latitude: 10.324941518519026, longitude: 123.93484586106506 },
      title: 'Parkmall',
      description: 'A mall in Mandaue City',
    },
  ];

  // Define geofences with realistic radii (in meters)
  const geofences: Geofence[] = [
    {
      id: 'usc-talamban',
      center: { latitude: 10.352166718021245, longitude: 123.9133411900118 },
      radius: 200,
      title: 'USC Talamban Campus',
    },
    {
      id: 'parkmall',
      center: { latitude: 10.324941518519026, longitude: 123.93484586106506 },
      radius: 100,
      title: 'Parkmall',
    },
  ];

  useEffect(() => {
    const getLocation = async () => {
      const hasPermission = await requestLocationPermission();
      setHasLocationPermission(hasPermission);

      if (hasPermission) {
        Geolocation.getCurrentPosition(
          position => {
            setRegion({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.0121,
            });
          },
          error => {
            console.log('Location error:', error.code, error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          },
        );
      }
    };

    getLocation();
  }, []);

  useEffect(() => {
    if (!hasLocationPermission) return;

    const watchId = Geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;

        geofences.forEach(fence => {
          const distance = getDistanceMeters(
            latitude,
            longitude,
            fence.center.latitude,
            fence.center.longitude,
          );

          const isInside = distance <= fence.radius;
          const wasInside = insideGeofences.current.has(fence.id);

          // Trigger events only on state changes
          if (isInside && !wasInside) {
            // Just entered the geofence
            insideGeofences.current.add(fence.id);
            console.log(`✅ ENTERED geofence: ${fence.title}`);
            console.log(
              `Distance: ${distance.toFixed(2)}m (within ${fence.radius}m)`,
            );

            Alert.alert('Geofence Entry', `You entered ${fence.title}`, [
              { text: 'OK' },
            ]);
          } else if (!isInside && wasInside) {
            // Just exited the geofence
            insideGeofences.current.delete(fence.id);
            console.log(`❌ EXITED geofence: ${fence.title}`);
            console.log(
              `Distance: ${distance.toFixed(2)}m (outside ${fence.radius}m)`,
            );

            Alert.alert('Geofence Exit', `You left ${fence.title}`, [
              { text: 'OK' },
            ]);
          }
        });
      },
      error => {
        console.log('Location error:', error.code, error.message);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000, // Check every 5 seconds
      },
    );

    return () => {
      Geolocation.clearWatch(watchId);
      insideGeofences.current.clear();
    };
  }, [hasLocationPermission]);

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity
          style={styles.hamburger}
          onPress={() => navigation.openDrawer()}
          accessibilityLabel="Open drawer menu"
        >
          <View style={styles.bar} />
          <View style={styles.bar} />
          <View style={styles.bar} />
        </TouchableOpacity>
      </View>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={true}
      >
        {/* Render markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={marker.latlng}
            title={marker.title}
            description={marker.description}
          />
        ))}

        {/* Visualize geofences as circles */}
        {geofences.map(fence => (
          <Circle
            key={fence.id}
            center={fence.center}
            radius={fence.radius}
            strokeColor="rgba(0, 122, 255, 0.5)"
            fillColor="rgba(0, 122, 255, 0.1)"
            strokeWidth={2}
          />
        ))}
      </MapView>
    </View>
  );
}
