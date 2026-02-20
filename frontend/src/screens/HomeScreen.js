import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, RefreshControl, Dimensions, Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { pitchesAPI } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import PitchCard from '../components/PitchCard';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [pitches, setPitches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    loadCities();
    requestLocation();
  }, []);

  useEffect(() => {
    loadPitches();
  }, [location, selectedCity]);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(loc.coords);
      }
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const loadCities = async () => {
    try {
      const res = await pitchesAPI.getCities();
      setCities(res.data.cities);
    } catch {}
  };

  const loadPitches = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (location) { params.lat = location.latitude; params.lng = location.longitude; }
      if (selectedCity) params.city_id = selectedCity;
      const res = await pitchesAPI.getAll(params);
      setPitches(res.data.pitches);
    } catch (error) {
      console.error('Load pitches error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPitches();
    setRefreshing(false);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const TODAY = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}, {user?.full_name?.split(' ')[0]} 👋</Text>
          <Text style={styles.headerSub}>Trouvez votre terrain idéal</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('Explore')}
      >
        <Ionicons name="search" size={20} color={COLORS.textLight} />
        <Text style={styles.searchPlaceholder}>Chercher un terrain, quartier...</Text>
      </TouchableOpacity>

      {/* View Toggle */}
      <View style={styles.toggleRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityScroll}>
          <TouchableOpacity
            style={[styles.cityChip, !selectedCity && styles.cityChipActive]}
            onPress={() => setSelectedCity(null)}
          >
            <Text style={[styles.cityChipText, !selectedCity && styles.cityChipTextActive]}>
              Toutes
            </Text>
          </TouchableOpacity>
          {cities.map(city => (
            <TouchableOpacity
              key={city.id}
              style={[styles.cityChip, selectedCity === city.id && styles.cityChipActive]}
              onPress={() => setSelectedCity(city.id)}
            >
              <Text style={[styles.cityChipText, selectedCity === city.id && styles.cityChipTextActive]}>
                {city.name_fr}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={18} color={viewMode === 'list' ? COLORS.primary : COLORS.textLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map" size={18} color={viewMode === 'map' ? COLORS.primary : COLORS.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'map' ? (
        /* MAP VIEW */
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude: location?.latitude || 33.5731,
              longitude: location?.longitude || -7.5898, // Casablanca default
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
          >
            {pitches.map(pitch => pitch.latitude && (
              <Marker
                key={pitch.id}
                coordinate={{ latitude: parseFloat(pitch.latitude), longitude: parseFloat(pitch.longitude) }}
                onPress={() => navigation.navigate('PitchDetail', { pitchId: pitch.id })}
              >
                <View style={styles.mapMarker}>
                  <Text style={styles.mapMarkerText}>{pitch.price_per_hour}MAD</Text>
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Bottom Sheet for pitches */}
          <FlatList
            style={styles.mapBottomList}
            data={pitches}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <PitchCard
                pitch={item}
                compact
                onPress={() => navigation.navigate('PitchDetail', { pitchId: item.id })}
              />
            )}
            contentContainerStyle={{ padding: SPACING.sm }}
          />
        </View>
      ) : (
        /* LIST VIEW */
        <FlatList
          data={pitches}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PitchCard
              pitch={item}
              onPress={() => navigation.navigate('PitchDetail', { pitchId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListHeaderComponent={
            <View>
              {/* Quick Availability */}
              <Text style={styles.sectionTitle}>⚡ Disponibles aujourd'hui</Text>
            </View>
          }
          ListEmptyComponent={
            !isLoading && (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>⚽</Text>
                <Text style={styles.emptyText}>Aucun terrain trouvé</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.base, paddingTop: SPACING.xxxl + SPACING.lg,
    paddingBottom: SPACING.md, backgroundColor: COLORS.surface,
  },
  greeting: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  notifBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    margin: SPACING.base, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    gap: SPACING.sm, ...SHADOWS.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  searchPlaceholder: { fontSize: FONTS.sizes.base, color: COLORS.textLight, flex: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: SPACING.base, paddingBottom: SPACING.sm },
  cityScroll: { flex: 1 },
  cityChip: {
    borderRadius: BORDER_RADIUS.full, paddingVertical: 6, paddingHorizontal: SPACING.md,
    marginRight: SPACING.xs, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  cityChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  cityChipText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  cityChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  viewToggle: { flexDirection: 'row', marginRight: SPACING.base, gap: 4 },
  toggleBtn: { padding: 8, borderRadius: BORDER_RADIUS.sm },
  toggleBtnActive: { backgroundColor: COLORS.primaryLight },
  listContent: { padding: SPACING.base, gap: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  mapMarker: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 2, borderColor: '#fff', ...SHADOWS.md,
  },
  mapMarkerText: { color: '#fff', fontSize: FONTS.sizes.xs, fontWeight: '700' },
  mapBottomList: { position: 'absolute', bottom: 20, left: 0, right: 0, maxHeight: 200 },
  empty: { alignItems: 'center', marginTop: 60, gap: SPACING.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary },
});
