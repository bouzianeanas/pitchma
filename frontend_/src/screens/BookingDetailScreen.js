import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/fr';
import { bookingsAPI } from '../config/api';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

moment.locale('fr');

export default function BookingDetailScreen({ navigation, route }) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    bookingsAPI.getOne(bookingId)
      .then(res => setBooking(res.data.booking))
      .catch(() => navigation.goBack());
  }, []);

  if (!booking) {
    return <View style={styles.loading}><Text>Chargement...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail réservation</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.pitchName}>{booking.pitch_name}</Text>
          <Text style={styles.address}>{booking.address}</Text>
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.label}>Date:</Text><Text style={styles.value}>{moment(booking.booking_date).format('dddd D MMMM YYYY')}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Heure:</Text><Text style={styles.value}>{booking.start_time?.slice(0, 5)} — {booking.end_time?.slice(0, 5)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Durée:</Text><Text style={styles.value}>{booking.duration_minutes} min</Text></View>
          <View style={styles.row}><Text style={styles.label}>Paiement:</Text><Text style={styles.value}>{booking.payment_method}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Montant:</Text><Text style={[styles.value, { color: COLORS.primary, fontWeight: '800' }]}>{parseFloat(booking.total_price).toFixed(2)} MAD</Text></View>
          <View style={styles.row}><Text style={styles.label}>Statut:</Text><Text style={styles.value}>{booking.status}</Text></View>
          <View style={styles.divider} />
          <Text style={styles.ref}>Réf: {booking.id?.slice(0, 8).toUpperCase()}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.base, paddingTop: SPACING.xxxl, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { padding: SPACING.base },
  card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, ...SHADOWS.md },
  pitchName: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  address: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  value: { fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, fontWeight: '600' },
  ref: { textAlign: 'center', fontSize: FONTS.sizes.xs, color: COLORS.textLight, fontFamily: 'monospace' },
});
