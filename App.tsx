import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { signOut } from 'firebase/auth';
import PokemonAR from './screens/pokemon-AR';
import Home from './screens/home';
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import LogoutScreen from './screens/logout';
import Map from './screens/map';
import Profile from './screens/profile';
import { useAuthState } from './hooks/useStateAuth';
import Ionicons from 'react-native-vector-icons/Ionicons';

export type RootStackParamList = {
  Screens: undefined;
  Home: undefined;
  PokemonAR: undefined;
  Login: undefined;
  SignUp: undefined;
  Camera: undefined;
  Logout: undefined;
  Map: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tabs = createBottomTabNavigator();

// function TabScreens() {
//   return (
//     <Tabs.Navigator screenOptions={{ headerShown: false }}>
//       <Tabs.Screen name="Home" component={Home} />
//       <Tabs.Screen name="Map" component={Map} />
//       <Tabs.Screen name="PokemonAR" component={PokemonAR} />
//       <Tabs.Screen name="Profile" component={Profile} />
//     </Tabs.Navigator>
//   );
// }

function TabScreens() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'help-circle-outline';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'PokemonAR') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
      })}
    >
      <Tabs.Screen name="Home" component={Home} />
      <Tabs.Screen name="Map" component={Map} />
      <Tabs.Screen name="PokemonAR" component={PokemonAR} />
      <Tabs.Screen name="Profile" component={Profile} />
    </Tabs.Navigator>
  );
}

// function DrawerScreens() {
//   return (
//     <Drawer.Navigator screenOptions={{ headerShown: false }}>
//       <Drawer.Screen name="Home" component={Home} />
//       <Drawer.Screen name="Map" component={Map} />
//       <Drawer.Screen name="PokemonAR" component={PokemonAR} />
//       <Drawer.Screen name="Camera" component={Camera} />
//       <Drawer.Screen name="Logout" component={LogoutScreen} />
//     </Drawer.Navigator>
//   );
// }

// Origintal AppNavigation with auth check
// function AppNavigation() {
//   const { user, loading } = useAuthState();

//   if (loading) {
//     return null; // Or splash/loading screen
//   }

//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       {user ? (
//         // Authenticated → show Drawer
//         <Stack.Screen name="Screens" component={TabScreens} />
//       ) : (
//         // Not authenticated → show Login + Signup
//         <>
//           <Stack.Screen name="Login" component={Login} />
//           <Stack.Screen name="SignUp" component={SignUp} />
//         </>
//       )}
//     </Stack.Navigator>
//   );
// }

function AppNavigation() {
  const { user, loading } = useAuthState();

  if (loading) {
    return null; // Or splash/loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Authenticated → show Drawer
        <Stack.Screen name="Screens" component={TabScreens} />
      ) : (
        // Not authenticated → show Login + Signup
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
        </>
      )}
    </Stack.Navigator>
  );
}

// ...existing code...

// function AppNavigation() {
//   const { user, loading } = useAuthState();

//   if (loading) {
//     return null; // Or splash/loading screen
//   }

//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       {/* Temporarily skip authentication */}
//       <Stack.Screen name="Screens" component={TabScreens} />
//     </Stack.Navigator>
//   );
// }

export default function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <AppNavigation />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
