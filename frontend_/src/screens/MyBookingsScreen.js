import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/fr';
import { bookingsAPI } from '../config/api';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, STATUS_COLORS } from '../config/theme';

moment.locale('fr');

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  completed: 'Terminé',
  no_show: 'Absent',
};

const TABS = [
  { key: null, label: 'Toutes' },
  { key: 'confirmed', label: 'Confirmées' },
  { key: 'pending', label: 'En attente' },
  { key: 'completed', label: 'Terminées' },
  { key: 'cancelled', label: 'Annulées' },
];

export default function MyBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    loadBookings();
  }, [activeTab]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (activeTab) params.status = activeTab;
      const res = await bookingsAPI.getAll(params);
      setBookings(res.data.bookings);
    } catch (error) {
      console.error('Load bookings error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleCancel = (bookingId) => {
    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette réservation?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingsAPI.cancel(bookingId, 'Annulé par le joueur');
              loadBookings();
            } catch {
              Alert.alert('Erreur', 'Impossible d\'annuler');
            }
          },
        },
      ]
    );
  };

  const renderBooking = ({ item }) => {
    const isPast = moment(item.booking_date).isBefore(moment(), 'day');
    const statusColor = STATUS_COLORS[item.status] || COLORS.textSecondary;
    const canCancel = ['pending', 'confirmed'].includes(item.status) && !isPast;

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.status, { color: statusColor }]}>{STATUS_LABELS[item.status]}</Text>
          <Text style={styles.ref}>#{item.id?.slice(0, 8).toUpperCase()}</Text>
        </View>

        {/* Pitch */}
        <Text style={styles.pitchName}>{item.pitch_name}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="location-sharp" size={13} color={COLORS.textLight} />
          <Text style={styles.infoText}>{item.address}</Text>
        </View>

        {/* Time */}
        <View style={styles.timeRow}>
          <View style={styles.timeChip}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
            <Text style={styles.timeText}>
              {moment(item.booking_date).format('D MMM YYYY')}
            </Text>
          </View>
          <View style={styles.timeChip}>
            <Ionicons name="time-outline" size={14} color={COLORS.primary} />
            <Text style={styles.timeText}>
              {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.price}>{parseFloat(item.total_price).toFixed(2)} MAD</Text>
          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          )}
          {item.status === 'completed' && !item.review_id && (
            <TouchableOpacity style={styles.reviewBtn}>
              <Ionicons name="star-outline" size={14} color={COLORS.primary} />
              <Text style={styles.reviewBtnText}>Donner un avis</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes réservations</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal data={TABS} keyExtractor={t => t.key || 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item.key && styles.tabActive]}
              onPress={() => setActiveTab(item.key)}
            >
              <Text style={[styles.tabText, activeTab === item.key && styles.tabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Bookings List */}
      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        renderItem={renderBooking}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>Aucune réservation</Text>
              <Text style={styles.emptyText}>Réservez un terrain pour commencer à jouer !</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.emptyBtnText}>Trouver un terrain</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING.base, paddingTop: SPACING.xxxl, paddingBottom: SPACING.md },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  tabsWrapper: { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabs: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.sm, gap: SPACING.xs },
  tab: { paddingVertical: 6, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border },
  tabActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  tabText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  list: { padding: SPACING.base, gap: SPACING.md },
  bookingCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, ...SHADOWS.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  status: { fontSize: FONTS.sizes.sm, fontWeight: '700', flex: 1 },
  ref: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, fontFamily: 'monospace' },
  pitchName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.sm },
  infoText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, flex: 1 },
  timeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  timeText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: SPACING.sm },
  price: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.textPrimary },
  cancelBtn: { borderWidth: 1, borderColor: COLORS.error, borderRadius: BORDER_RADIUS.sm, paddingVertical: 4, paddingHorizontal: SPACING.sm },
  cancelBtnText: { color: COLORS.error, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.primary, borderRadius: BORDER_RADIUS.sm, paddingVertical: 4, paddingHorizontal: SPACING.sm },
  reviewBtnText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60, gap: SPACING.md, padding: SPACING.xl },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, textAlign: 'center' },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
});
