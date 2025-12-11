import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { signOut } from 'firebase/auth';
import Camera from './screens/camera';
import PokemonAR from './screens/pokemon-AR';
import Home from './screens/home';
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import LogoutScreen from './screens/logout';
import Map from './screens/map';
import { useAuthState } from './hooks/useStateAuth';
import { UserProfileProvider } from './context/userProfileContext';
export type RootStackParamList = {
  Screens: undefined;
  Home: undefined;
  PokemonAR: undefined;
  Login: undefined;
  SignUp: undefined;
  Camera: undefined;
  Logout: undefined;
  Map: undefined;
};

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function DrawerScreens() {
  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="Home" component={Home} />
      <Drawer.Screen name="Map" component={Map} />
      <Drawer.Screen name="PokemonAR" component={PokemonAR} />
      <Drawer.Screen name="Camera" component={Camera} />
      <Drawer.Screen name="Logout" component={LogoutScreen} />
    </Drawer.Navigator>
  );
}

function AppNavigation() {
  const { user, loading } = useAuthState();

  if (loading) {
    return null; // Or splash/loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Authenticated → show Drawer
        <Stack.Screen name="Screens" component={DrawerScreens} />
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

// function AppNavigation() {
//   const { user, loading } = useAuthState();

//   if (loading) {
//     return null; // Or splash/loading screen
//   }

//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       {/* Temporarily skip authentication */}
//       <Stack.Screen name="Screens" component={DrawerScreens} />
//     </Stack.Navigator>
//   );
// }

// ...existing code...

export default function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <UserProfileProvider>
      <NavigationContainer>
        <AppNavigation />
      </NavigationContainer>
      </UserProfileProvider>
    </QueryClientProvider>
  );
}
