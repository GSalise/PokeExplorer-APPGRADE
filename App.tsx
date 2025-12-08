import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Camera from './screens/camera';
import PokemonAR from './screens/pokemon-AR';
import Home from './screens/home';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const queryClient = new QueryClient();

function DrawerScreens() {
  return (    
    <Drawer.Navigator screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="Home" component={Home} />
      <Drawer.Screen name="PokemonAR" component={PokemonAR} />
    </Drawer.Navigator>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false}}>
          <Stack.Screen name="Screens" component={DrawerScreens} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

export default App;
