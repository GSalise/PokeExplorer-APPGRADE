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
  // Extract the Pokémon ID from the URL
  const idMatch = url.match(/\/pokemon\/(\d+)\//);
  const id = idMatch ? idMatch[1] : '';
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
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
    <LinearGradient colors={['#ff0000', '#fff']} style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.hamburger}
            onPress={() => navigation.openDrawer()}
            accessibilityLabel="Open drawer menu"
          >
            <View style={styles.bar} />
            <View style={styles.bar} />
            <View style={styles.bar} />
          </TouchableOpacity>
          <Text style={styles.title}>Pokédex</Text>
          {/* To make things even */}
          <TouchableOpacity style={styles.hamburger}></TouchableOpacity>
        </View>
        <FlatList
          data={data?.results}
          keyExtractor={item => item.name}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image
                source={{ uri: getPokemonImageUrl(item.url) }}
                style={styles.image}
              />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={[styles.flavor_text, { marginTop: 10 }]}>
                {item.flavor_text}
              </Text>
            </View>
          )}
          style={{ width: '100%' }}
          contentContainerStyle={{}}
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </LinearGradient>
  );
}

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 32,
  },
  innerContainer: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    height: 400,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    elevation: 2,
  },
  image: {
    width: 160,
    height: 160,
    marginBottom: 12,
    // borderColor: 'red',
    // borderWidth: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    width: '80%',
    textAlign: 'left',
    textTransform: 'capitalize',
  },
  flavor_text: {
    fontSize: 12,
    fontStyle: 'italic',
    width: '80%',
    // borderColor: 'red',
    // borderWidth: 4,
    textAlign: 'left',
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  hamburger: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bar: {
    width: 24,
    height: 3,
    backgroundColor: 'black',
    marginVertical: 2,
    borderRadius: 2,
  },
});
