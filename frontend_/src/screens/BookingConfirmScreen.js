import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/fr';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

moment.locale('fr');

export default function BookingConfirmScreen({ navigation, route }) {
  const { booking, pitch } = route.params;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Success Icon */}
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color={COLORS.primary} />
          </View>
          <Text style={styles.successTitle}>Réservation confirmée ! 🎉</Text>
          <Text style={styles.successSub}>Votre terrain est réservé. À bientôt sur le terrain !</Text>
        </View>

        {/* Booking Card */}
        <View style={styles.bookingCard}>
          <Text style={styles.cardTitle}>Détails de la réservation</Text>

          <View style={styles.row}>
            <Ionicons name="location-sharp" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Terrain</Text>
              <Text style={styles.rowValue}>{pitch.name}</Text>
              <Text style={styles.rowSub}>{pitch.address}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="calendar" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Date</Text>
              <Text style={styles.rowValue}>
                {moment(booking.booking_date).format('dddd D MMMM YYYY')}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="time" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Heure</Text>
              <Text style={styles.rowValue}>
                {booking.start_time?.slice(0, 5)} — {booking.end_time?.slice(0, 5)}
              </Text>
              <Text style={styles.rowSub}>{booking.duration_minutes} minutes</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="cash" size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Montant total</Text>
              <Text style={styles.rowValue}>{parseFloat(booking.total_price).toFixed(2)} MAD</Text>
              <Text style={styles.rowSub}>
                Paiement: {booking.payment_method === 'cash' ? 'Espèces sur place' : booking.payment_method}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.refRow}>
            <Text style={styles.rowLabel}>Référence</Text>
            <Text style={styles.refValue}>{booking.id?.slice(0, 8).toUpperCase()}</Text>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 À savoir</Text>
          {[
            'Arrivez 10 minutes avant votre créneau',
            'Apportez votre propre ballon si disponible',
            'La réservation peut être annulée jusqu\'à 2h avant',
          ].map((tip, i) => (
            <View key={i} style={styles.tipItem}>
              <Ionicons name="information-circle" size={16} color={COLORS.primary} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('MyBookings')}
        >
          <Text style={styles.secondaryBtnText}>Mes réservations</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.primaryBtnText}>Accueil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.base },
  successSection: { alignItems: 'center', paddingVertical: SPACING.xxl },
  successIcon: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
  },
  successTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  successSub: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
  bookingCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, ...SHADOWS.md, marginBottom: SPACING.md },
  cardTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  row: { flexDirection: 'row', gap: SPACING.md, paddingVertical: SPACING.sm },
  rowLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowValue: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.textPrimary, marginTop: 2 },
  rowSub: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 1 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.xs },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.sm },
  refValue: { fontFamily: 'monospace', fontSize: FONTS.sizes.sm, backgroundColor: COLORS.background, padding: SPACING.sm, borderRadius: BORDER_RADIUS.sm },
  tipsCard: { backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.xl },
  tipsTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.sm },
  tipItem: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xs },
  tipText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, flex: 1 },
  actions: {
    flexDirection: 'row', gap: SPACING.md, padding: SPACING.base, paddingBottom: SPACING.xl,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  secondaryBtn: { flex: 1, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  secondaryBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.base },
  primaryBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
});
