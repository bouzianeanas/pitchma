import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/fr';
import { managerAPI } from '../../config/api';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, STATUS_COLORS } from '../../config/theme';

moment.locale('fr');

export default function ManagerBookingsScreen({ navigation, route }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState(route.params?.filter || null);

  useEffect(() => { loadBookings(); }, [filterStatus]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await managerAPI.getBookings(params);
      setBookings(res.data.bookings);
    } catch {} finally { setIsLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadBookings(); setRefreshing(false); };

  const handleConfirm = async (id) => {
    try {
      await managerAPI.confirmBooking(id);
      loadBookings();
    } catch { Alert.alert('Erreur', 'Confirmation échouée'); }
  };

  const TABS = [
    { key: null, label: 'Toutes' },
    { key: 'pending', label: 'En attente' },
    { key: 'confirmed', label: 'Confirmées' },
    { key: 'completed', label: 'Terminées' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Réservations</Text>
      </View>

      <FlatList
        horizontal data={TABS} keyExtractor={t => t.key || 'all'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={styles.tabsScroll}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, filterStatus === item.key && styles.tabActive]}
            onPress={() => setFilterStatus(item.key)}
          >
            <Text style={[styles.tabText, filterStatus === item.key && styles.tabTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <View style={styles.bookingCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.pitchName}>{item.pitch_name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[item.status]}20` }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.playerRow}>
              <Ionicons name="person" size={14} color={COLORS.textLight} />
              <Text style={styles.playerName}>{item.player_name}</Text>
              <Text style={styles.playerPhone}>{item.player_phone}</Text>
            </View>
            <View style={styles.timeRow}>
              <View style={styles.timeChip}>
                <Ionicons name="calendar" size={13} color={COLORS.primary} />
                <Text style={styles.timeText}>{moment(item.booking_date).format('D MMM')}</Text>
              </View>
              <View style={styles.timeChip}>
                <Ionicons name="time" size={13} color={COLORS.primary} />
                <Text style={styles.timeText}>{item.start_time?.slice(0, 5)} — {item.end_time?.slice(0, 5)}</Text>
              </View>
              <Text style={styles.price}>{parseFloat(item.manager_earnings || item.total_price).toFixed(0)} MAD</Text>
            </View>
            {item.status === 'pending' && (
              <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(item.id)}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.confirmBtnText}>Confirmer la réservation</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={!isLoading && (
          <View style={styles.empty}><Text style={styles.emptyText}>Aucune réservation</Text></View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.surface, padding: SPACING.base, paddingTop: SPACING.xxxl, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  tabsScroll: { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabs: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, gap: SPACING.xs },
  tab: { paddingVertical: 6, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border },
  tabActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  tabText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  list: { padding: SPACING.base, gap: SPACING.md },
  bookingCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, ...SHADOWS.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  pitchName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  statusBadge: { borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  playerName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  playerPhone: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  timeText: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '600' },
  price: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.primary, marginLeft: 'auto' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginTop: SPACING.sm },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base },
});
