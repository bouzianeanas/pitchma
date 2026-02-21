import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/fr';
import { bookingsAPI } from '../config/api';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

moment.locale('fr');

const PAYMENT_METHODS = [
  { id: 'cash', icon: 'cash', label: 'Espèces sur place', desc: 'Payez à l\'arrivée' },
  { id: 'card', icon: 'card', label: 'Carte bancaire', desc: 'Visa, Mastercard' },
  { id: 'cmi', icon: 'phone-portrait', label: 'CMI / Maroc Pay', desc: 'Paiement mobile marocain' },
];

export default function BookingScreen({ navigation, route }) {
  const { slot, pitch } = route.params;
  const [selectedSlot, setSelectedSlot] = useState(slot);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [playersCount, setPlayersCount] = useState(1);
  const [isOpenGame, setIsOpenGame] = useState(false);
  const [openGameSpots, setOpenGameSpots] = useState(0);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!selectedSlot) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Réserver</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.center}>
          <Text>Veuillez sélectionner un créneau depuis la page du terrain.</Text>
        </View>
      </View>
    );
  }

  const slotPrice = selectedSlot.price_override || pitch.price_per_hour;
  const hours = selectedSlot.duration_minutes / 60;
  const totalPrice = slotPrice * hours;
  const commissionRate = 0.08;
  const commission = totalPrice * commissionRate;

  const handleBook = async () => {
    setIsLoading(true);
    try {
      const response = await bookingsAPI.create({
        slot_id: selectedSlot.id,
        payment_method: paymentMethod,
        players_count: playersCount,
        is_open_game: isOpenGame,
        open_game_spots: isOpenGame ? openGameSpots : 0,
        notes,
      });

      navigation.replace('BookingConfirm', {
        booking: response.data.booking,
        pitch,
      });
    } catch (error) {
      const msg = error.response?.data?.message || 'La réservation a échoué';
      Alert.alert('Erreur', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const dateStr = moment(selectedSlot.date?.toString()).format('dddd D MMMM YYYY');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmer la réservation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Pitch Summary */}
        <View style={styles.pitchCard}>
          <View style={styles.pitchIconContainer}>
            <Text style={styles.pitchIcon}>⚽</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pitchName}>{pitch.name}</Text>
            <Text style={styles.pitchAddress}>{pitch.address}</Text>
          </View>
        </View>

        {/* Slot Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Créneau sélectionné</Text>
          <View style={styles.slotCard}>
            <View style={styles.slotRow}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.slotText} numberOfLines={1}>{dateStr}</Text>
            </View>
            <View style={styles.slotRow}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <Text style={styles.slotText}>
                {selectedSlot.start_time?.slice(0, 5)} — {selectedSlot.end_time?.slice(0, 5)}
                {'  '}({selectedSlot.duration_minutes} min)
              </Text>
            </View>
          </View>
        </View>

        {/* Players Count */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nombre de joueurs</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setPlayersCount(Math.max(1, playersCount - 1))}
            >
              <Ionicons name="remove" size={22} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{playersCount}</Text>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setPlayersCount(Math.min(pitch.capacity || 22, playersCount + 1))}
            >
              <Ionicons name="add" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Open Game Toggle */}
        <View style={styles.section}>
          <View style={styles.openGameRow}>
            <View>
              <Text style={styles.sectionTitle}>Match ouvert</Text>
              <Text style={styles.openGameDesc}>Permettre à d'autres joueurs de rejoindre</Text>
            </View>
            <Switch
              value={isOpenGame}
              onValueChange={setIsOpenGame}
              trackColor={{ true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>

          {isOpenGame && (
            <View style={styles.counterRow}>
              <Text style={styles.openGameLabel}>Places disponibles:</Text>
              <TouchableOpacity style={styles.counterBtn} onPress={() => setOpenGameSpots(Math.max(1, openGameSpots - 1))}>
                <Ionicons name="remove" size={22} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{openGameSpots}</Text>
              <TouchableOpacity style={styles.counterBtn} onPress={() => setOpenGameSpots(Math.min(10, openGameSpots + 1))}>
                <Ionicons name="add" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mode de paiement</Text>
          {PAYMENT_METHODS.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[styles.paymentOption, paymentMethod === method.id && styles.paymentOptionSelected]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <View style={styles.paymentIcon}>
                <Ionicons name={method.icon} size={24} color={paymentMethod === method.id ? COLORS.primary : COLORS.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentLabel, paymentMethod === method.id && styles.paymentLabelSelected]}>
                  {method.label}
                </Text>
                <Text style={styles.paymentDesc}>{method.desc}</Text>
              </View>
              {paymentMethod === method.id && (
                <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Location ({hours}h × {slotPrice} MAD)</Text>
              <Text style={styles.priceValue}>{totalPrice.toFixed(2)} MAD</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Frais de service (8%)</Text>
              <Text style={styles.priceValue}>{commission.toFixed(2)} MAD</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{(totalPrice + commission).toFixed(2)} MAD</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total à payer</Text>
          <Text style={styles.footerPrice}>{(totalPrice + commission).toFixed(2)} MAD</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, isLoading && styles.confirmBtnDisabled]}
          onPress={handleBook}
          disabled={isLoading}
        >
          <Text style={styles.confirmBtnText}>{isLoading ? 'Réservation...' : 'Confirmer'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.base, paddingTop: SPACING.xxxl, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { padding: SPACING.base },
  pitchCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, gap: SPACING.md, ...SHADOWS.sm, marginBottom: SPACING.md,
  },
  pitchIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  pitchIcon: { fontSize: 24 },
  pitchName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  pitchAddress: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  section: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  slotCard: { gap: SPACING.sm },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  slotText: { fontSize: FONTS.sizes.base, color: COLORS.textPrimary, flex: 1 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  counterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  counterValue: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, minWidth: 40, textAlign: 'center' },
  openGameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  openGameDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  openGameLabel: { fontSize: FONTS.sizes.base, color: COLORS.textPrimary, flex: 1 },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.md,
  },
  paymentOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  paymentIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  paymentLabel: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.textPrimary },
  paymentLabelSelected: { color: COLORS.primary },
  paymentDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  priceCard: { gap: SPACING.sm },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  priceValue: { fontSize: FONTS.sizes.sm, color: COLORS.textPrimary },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm, marginTop: SPACING.xs },
  totalLabel: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  totalValue: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.primary },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surface, padding: SPACING.base, paddingBottom: SPACING.xl,
    borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOWS.lg,
  },
  footerLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  footerPrice: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  confirmBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  confirmBtnDisabled: { opacity: 0.7 },
  confirmBtnText: { color: '#fff', fontSize: FONTS.sizes.base, fontWeight: '700' },
});
