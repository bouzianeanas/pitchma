import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/fr';
import { managerAPI } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';

moment.locale('fr');

export default function ManagerDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const res = await managerAPI.getDashboard();
      setStats(res.data.stats);
      setUpcomingBookings(res.data.upcoming_bookings);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      await managerAPI.confirmBooking(bookingId);
      loadDashboard();
    } catch {}
  };

  const StatCard = ({ icon, label, value, color = COLORS.primary, sub }) => (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user?.full_name?.split(' ')[0]} 👋</Text>
          <Text style={styles.headerDate}>{moment().format('dddd D MMMM YYYY')}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreatePitch')}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Aperçu</Text>
      <View style={styles.statsGrid}>
        <StatCard icon="calendar" label="Réservations aujourd'hui" value={stats?.today_bookings || 0} />
        <StatCard icon="cash" label="Gains ce mois" value={`${parseFloat(stats?.month_earnings || 0).toFixed(0)} MAD`} color={COLORS.secondary} />
        <StatCard icon="hourglass" label="En attente" value={stats?.pending_bookings || 0} color={COLORS.warning} />
        <StatCard icon="location" label="Mes terrains" value={stats?.total_pitches || 0} color={COLORS.accent} />
      </View>

      {/* Pending bookings alert */}
      {parseInt(stats?.pending_bookings) > 0 && (
        <TouchableOpacity
          style={styles.alert}
          onPress={() => navigation.navigate('Bookings', { filter: 'pending' })}
        >
          <Ionicons name="warning" size={20} color={COLORS.warning} />
          <Text style={styles.alertText}>
            {stats.pending_bookings} réservation(s) en attente de confirmation
          </Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Upcoming Bookings */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Prochaines réservations</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      {upcomingBookings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucune réservation à venir</Text>
        </View>
      ) : (
        upcomingBookings.slice(0, 5).map(booking => (
          <View key={booking.id} style={styles.bookingItem}>
            {/* Time */}
            <View style={styles.bookingTime}>
              <Text style={styles.bookingDate}>{moment(booking.booking_date).format('D MMM')}</Text>
              <Text style={styles.bookingHour}>{booking.start_time?.slice(0, 5)}</Text>
            </View>

            {/* Info */}
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingPitch}>{booking.pitch_name}</Text>
              <Text style={styles.bookingPlayer}>
                <Ionicons name="person" size={12} color={COLORS.textLight} />
                {' '}{booking.player_name} • {booking.player_phone}
              </Text>
              <Text style={styles.bookingDuration}>{booking.duration_minutes} min</Text>
            </View>

            {/* Actions */}
            <View style={styles.bookingActions}>
              {booking.status === 'pending' ? (
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => handleConfirmBooking(booking.id)}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </TouchableOpacity>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: booking.status === 'confirmed' ? COLORS.primaryLight : COLORS.surfaceAlt }]}>
                  <Text style={[styles.statusText, { color: booking.status === 'confirmed' ? COLORS.primary : COLORS.textSecondary }]}>
                    {booking.status === 'confirmed' ? '✓' : booking.status}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Actions rapides</Text>
      <View style={styles.quickActions}>
        {[
          { icon: 'add-circle', label: 'Nouveau terrain', onPress: () => navigation.navigate('CreatePitch'), color: COLORS.primary },
          { icon: 'calendar', label: 'Gérer disponibilités', onPress: () => navigation.navigate('MyPitches'), color: COLORS.secondary },
          { icon: 'stats-chart', label: 'Réservations', onPress: () => navigation.navigate('Bookings'), color: COLORS.accent },
        ].map((action, i) => (
          <TouchableOpacity key={i} style={styles.quickAction} onPress={action.onPress}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
              <Ionicons name={action.icon} size={24} color={action.color} />
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surface, padding: SPACING.base, paddingTop: SPACING.xxxl,
  },
  greeting: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerDate: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  addBtn: { backgroundColor: COLORS.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, paddingHorizontal: SPACING.base, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: SPACING.base },
  seeAll: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.sm, gap: SPACING.sm },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, borderTopWidth: 3, ...SHADOWS.sm,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  statValue: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  statSub: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  alert: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: '#FFF8E1',
    margin: SPACING.base, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.warning,
  },
  alertText: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.warning, fontWeight: '600' },
  bookingItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.base, marginBottom: SPACING.sm, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, gap: SPACING.md, ...SHADOWS.sm,
  },
  bookingTime: { alignItems: 'center', minWidth: 48 },
  bookingDate: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, textTransform: 'capitalize' },
  bookingHour: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.primary },
  bookingInfo: { flex: 1 },
  bookingPitch: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary },
  bookingPlayer: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  bookingDuration: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  bookingActions: {},
  confirmBtn: { backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  statusBadge: { borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  empty: { alignItems: 'center', padding: SPACING.xl },
  emptyText: { color: COLORS.textSecondary },
  quickActions: { flexDirection: 'row', paddingHorizontal: SPACING.base, gap: SPACING.sm },
  quickAction: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, alignItems: 'center', gap: SPACING.sm, ...SHADOWS.sm },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  quickActionLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textPrimary, fontWeight: '600', textAlign: 'center' },
});
