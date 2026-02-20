// ExploreScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pitchesAPI } from '../config/api';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';
import PitchCard from '../components/PitchCard';

export default function ExploreScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [pitches, setPitches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ sport_type: null, surface_type: null, max_price: null });
  const [date, setDate] = useState('');

  const doSearch = async () => {
    setIsLoading(true);
    try {
      const params = { search, ...filters };
      if (date) params.date = date;
      const res = await pitchesAPI.getAll(params);
      setPitches(res.data.pitches);
    } catch {} finally { setIsLoading(false); }
  };

  useEffect(() => { doSearch(); }, [search, filters, date]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorer</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Nom, quartier, ville..."
            placeholderTextColor={COLORS.textLight}
            returnKeyType="search"
          />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close" size={18} color={COLORS.textLight} /></TouchableOpacity> : null}
        </View>
        <View style={styles.filtersRow}>
          <TextInput
            style={styles.dateInput}
            value={date}
            onChangeText={setDate}
            placeholder="📅 Date (YYYY-MM-DD)"
            placeholderTextColor={COLORS.textLight}
          />
          {['football', 'basketball', 'tennis', 'padel'].map(sport => (
            <TouchableOpacity
              key={sport}
              style={[styles.filterChip, filters.sport_type === sport && styles.filterChipActive]}
              onPress={() => setFilters(f => ({ ...f, sport_type: f.sport_type === sport ? null : sport }))}
            >
              <Text style={[styles.filterText, filters.sport_type === sport && styles.filterTextActive]}>
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={pitches}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PitchCard pitch={item} onPress={() => navigation.navigate('PitchDetail', { pitchId: item.id })} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!isLoading && <View style={styles.empty}><Text style={styles.emptyText}>Aucun terrain trouvé</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.surface, padding: SPACING.base, paddingTop: SPACING.xxxl, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 10, gap: SPACING.sm, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.textPrimary },
  filtersRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap' },
  dateInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 6, fontSize: FONTS.sizes.xs, color: COLORS.textPrimary },
  filterChip: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 6 },
  filterChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  filterText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.primary, fontWeight: '700' },
  list: { padding: SPACING.base, gap: SPACING.md },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base },
});
