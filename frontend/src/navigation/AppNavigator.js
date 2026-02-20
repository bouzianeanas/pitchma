import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../config/theme';

// Auth Screens
import PhoneScreen from '../screens/auth/PhoneScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import CompleteProfileScreen from '../screens/auth/CompleteProfileScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import PitchDetailScreen from '../screens/PitchDetailScreen';
import BookingScreen from '../screens/BookingScreen';
import BookingConfirmScreen from '../screens/BookingConfirmScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OpenGamesScreen from '../screens/OpenGamesScreen';

// Manager Screens
import ManagerDashboardScreen from '../screens/manager/ManagerDashboardScreen';
import ManagePitchesScreen from '../screens/manager/ManagePitchesScreen';
import CreatePitchScreen from '../screens/manager/CreatePitchScreen';
import ManageAvailabilityScreen from '../screens/manager/ManageAvailabilityScreen';
import ManagerBookingsScreen from '../screens/manager/ManagerBookingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createStackNavigator();
const ManagerTab = createBottomTabNavigator();

// ============================================
// AUTH STACK
// ============================================
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Phone" component={PhoneScreen} />
    <AuthStack.Screen name="OTP" component={OTPScreen} />
    <AuthStack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
  </AuthStack.Navigator>
);

// ============================================
// PLAYER TAB NAVIGATOR
// ============================================
const PlayerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textLight,
      tabBarStyle: {
        borderTopColor: COLORS.border,
        paddingBottom: 5,
        height: 60,
      },
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        switch (route.name) {
          case 'Home': iconName = focused ? 'home' : 'home-outline'; break;
          case 'Explore': iconName = focused ? 'search' : 'search-outline'; break;
          case 'OpenGames': iconName = focused ? 'people' : 'people-outline'; break;
          case 'MyBookings': iconName = focused ? 'calendar' : 'calendar-outline'; break;
          case 'Profile': iconName = focused ? 'person' : 'person-outline'; break;
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
    <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: 'Explorer' }} />
    <Tab.Screen name="OpenGames" component={OpenGamesScreen} options={{ title: 'Matchs' }} />
    <Tab.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'Réservations' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
  </Tab.Navigator>
);

// ============================================
// MANAGER TAB NAVIGATOR
// ============================================
const ManagerTabs = () => (
  <ManagerTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textLight,
      tabBarStyle: { borderTopColor: COLORS.border, paddingBottom: 5, height: 60 },
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        switch (route.name) {
          case 'Dashboard': iconName = focused ? 'grid' : 'grid-outline'; break;
          case 'MyPitches': iconName = focused ? 'location' : 'location-outline'; break;
          case 'Bookings': iconName = focused ? 'calendar' : 'calendar-outline'; break;
          case 'ManagerProfile': iconName = focused ? 'person' : 'person-outline'; break;
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <ManagerTab.Screen name="Dashboard" component={ManagerDashboardScreen} options={{ title: 'Tableau de bord' }} />
    <ManagerTab.Screen name="MyPitches" component={ManagePitchesScreen} options={{ title: 'Mes Terrains' }} />
    <ManagerTab.Screen name="Bookings" component={ManagerBookingsScreen} options={{ title: 'Réservations' }} />
    <ManagerTab.Screen name="ManagerProfile" component={ProfileScreen} options={{ title: 'Profil' }} />
  </ManagerTab.Navigator>
);

// ============================================
// MAIN APP NAVIGATOR
// ============================================
const AppNavigator = () => {
  const { isAuthenticated, isLoading, isManager } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : isManager ? (
          <>
            <Stack.Screen name="ManagerMain" component={ManagerTabs} />
            <Stack.Screen name="CreatePitch" component={CreatePitchScreen} />
            <Stack.Screen name="ManageAvailability" component={ManageAvailabilityScreen} />
            <Stack.Screen name="PitchDetail" component={PitchDetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="PlayerMain" component={PlayerTabs} />
            <Stack.Screen name="PitchDetail" component={PitchDetailScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} />
            <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
