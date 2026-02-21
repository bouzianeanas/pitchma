import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import 'moment/locale/fr';
import { managerAPI, pitchesAPI } from '../../config/api';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, STATUS_COLORS } from '../../config/theme';

moment.locale('fr');

export default function ManageAvailabilityScreen({ navigation, route }) {
  const { pitchId, pitchName } = route.params;
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);

  // New slot form
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [duration, setDuration] = useState('60');
  const [priceOverride, setPriceOverride] = useState('');

  // Generate form
  const [genStartDate, setGenStartDate] = useState(moment().format('YYYY-MM-DD'));
  const [genEndDate, setGenEndDate] = useState(moment().add(7, 'days').format('YYYY-MM-DD'));
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [slotDuration, setSlotDuration] = useState('60');

  useEffect(() => { loadSlots(); }, [selectedDate]);

  const loadSlots = async () => {
    try {
      const res = await pitchesAPI.getSlots(pitchId, { date: selectedDate, days: 1 });
      setSlots(res.data.slots[selectedDate] || []);
    } catch {}
  };

  const handleAddSlot = async () => {
    if (!startTime || !endTime || !duration) {
      Alert.alert('Erreur', 'Remplissez tous les champs obligatoires');
      return;
    }

    try {
      setIsLoading(true);
      await managerAPI.addSlots(pitchId, [{
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: parseInt(duration),
        price_override: priceOverride ? parseFloat(priceOverride) : null,
      }]);
      setShowAddSlot(false);
      setStartTime('08:00');
      setEndTime('09:00');
      setDuration('60');
      setPriceOverride('');
      loadSlots();
      Alert.alert('Succès', 'Créneau ajouté !');
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de l\'ajout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const res = await managerAPI.generateSlots(pitchId, {
        start_date: genStartDate,
        end_date: genEndDate,
        open_time: openTime,
        close_time: closeTime,
        slot_duration: parseInt(slotDuration),
      });
      setShowGenerate(false);
      loadSlots();
      Alert.alert('Succès', `${res.data.created} créneaux générés !`);
    } catch {
      Alert.alert('Erreur', 'Génération échouée');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = (slotId, status) => {
    if (status === 'booked') {
      Alert.alert('Impossible', 'Ce créneau est déjà réservé');
      return;
    }
    Alert.alert('Supprimer', 'Supprimer ce créneau ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await managerAPI.deleteSlot(slotId);
        loadSlots();
      }},
    ]);
  };

  const handleBlockSlot = async (slotId) => {
    try {
      await managerAPI.blockSlot(slotId);
      loadSlots();
    } catch {
      Alert.alert('Erreur', 'Impossible de bloquer ce créneau');
    }
  };

  const markedDates = {
    [selectedDate]: { selected: true, selectedColor: COLORS.primary },
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Disponibilités</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{pitchName}</Text>
        </View>
        <TouchableOpacity style={styles.genBtn} onPress={() => setShowGenerate(!showGenerate)}>
          <Ionicons name="refresh" size={18} color={COLORS.secondary} />
          <Text style={styles.genBtnText}>Générer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Calendar */}
        <Calendar
          current={selectedDate}
          onDayPress={day => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          minDate={moment().format('YYYY-MM-DD')}
          theme={{
            selectedDayBackgroundColor: COLORS.primary,
            todayTextColor: COLORS.primary,
            arrowColor: COLORS.primary,
            textDayFontWeight: '600',
          }}
        />

        {/* Generate Form */}
        {showGenerate && (
          <View style={styles.generateForm}>
            <Text style={styles.formTitle}>Génération automatique de créneaux</Text>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Date début</Text>
                <TextInput style={styles.input} value={genStartDate} onChangeText={setGenStartDate} placeholder="YYYY-MM-DD" />
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Date fin</Text>
                <TextInput style={styles.input} value={genEndDate} onChangeText={setGenEndDate} placeholder="YYYY-MM-DD" />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Ouverture</Text>
                <TextInput style={styles.input} value={openTime} onChangeText={setOpenTime} placeholder="08:00" />
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Fermeture</Text>
                <TextInput style={styles.input} value={closeTime} onChangeText={setCloseTime} placeholder="22:00" />
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Durée (min)</Text>
                <TextInput style={styles.input} value={slotDuration} onChangeText={setSlotDuration} keyboardType="numeric" />
              </View>
            </View>
            <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={isLoading}>
              <Text style={styles.generateBtnText}>
                {isLoading ? 'Génération...' : '⚡ Générer les créneaux'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Slots for selected date */}
        <View style={styles.slotsSection}>
          <View style={styles.slotsSectionHeader}>
            <Text style={styles.slotsDate}>{moment(selectedDate).format('dddd D MMMM')}</Text>
            <TouchableOpacity style={styles.addSlotBtn} onPress={() => setShowAddSlot(!showAddSlot)}>
              <Ionicons name="add" size={18} color={COLORS.primary} />
              <Text style={styles.addSlotBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          {/* Add Slot Form */}
          {showAddSlot && (
            <View style={styles.addSlotForm}>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Début</Text>
                  <TextInput style={styles.input} value={startTime} onChangeText={setStartTime} placeholder="08:00" />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Fin</Text>
                  <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} placeholder="09:00" />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Durée</Text>
                  <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="60" />
                </View>
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Prix spécial (MAD, optionnel)</Text>
                <TextInput style={styles.input} value={priceOverride} onChangeText={setPriceOverride} keyboardType="numeric" placeholder="Laisser vide = prix par défaut" />
              </View>
              <TouchableOpacity style={styles.saveSlotBtn} onPress={handleAddSlot} disabled={isLoading}>
                <Text style={styles.saveSlotBtnText}>Enregistrer le créneau</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Slots List */}
          {slots.length === 0 ? (
            <View style={styles.noSlots}>
              <Text style={styles.noSlotsIcon}>📅</Text>
              <Text style={styles.noSlotsText}>Aucun créneau pour cette date</Text>
              <Text style={styles.noSlotsHint}>Appuyez sur "+ Ajouter" pour créer des créneaux</Text>
            </View>
          ) : (
            slots.map(slot => (
              <View key={slot.id} style={[styles.slotItem, slot.status === 'booked' && styles.slotBooked]}>
                <View style={styles.slotLeft}>
                  <Text style={styles.slotTime}>
                    {slot.start_time?.slice(0, 5)} — {slot.end_time?.slice(0, 5)}
                  </Text>
                  <Text style={styles.slotDuration}>{slot.duration_minutes} min</Text>
                </View>
                <View style={styles.slotMiddle}>
                  <View style={[styles.slotStatusBadge, { backgroundColor: `${STATUS_COLORS[slot.status]}20` }]}>
                    <Text style={[styles.slotStatusText, { color: STATUS_COLORS[slot.status] }]}>
                      {slot.status === 'available' ? 'Libre' :
                       slot.status === 'booked' ? 'Réservé' :
                       slot.status === 'blocked' ? 'Bloqué' : slot.status}
                    </Text>
                  </View>
                  {slot.price_override && (
                    <Text style={styles.slotPriceOverride}>{slot.price_override} MAD</Text>
                  )}
                </View>
                {slot.status === 'available' && (
                  <View style={styles.slotActions}>
                    <TouchableOpacity style={styles.slotBlockBtn} onPress={() => handleBlockSlot(slot.id)}>
                      <Ionicons name="lock-closed" size={16} color={COLORS.warning} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.slotDeleteBtn} onPress={() => handleDeleteSlot(slot.id, slot.status)}>
                      <Ionicons name="trash" size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.base,
    paddingTop: SPACING.xxxl, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  genBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: COLORS.secondary, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: 6 },
  genBtnText: { fontSize: FONTS.sizes.sm, color: COLORS.secondary, fontWeight: '600' },
  generateForm: { backgroundColor: COLORS.surface, margin: SPACING.base, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, ...SHADOWS.sm },
  formTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  formRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  formField: { flex: 1 },
  fieldLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 8, fontSize: FONTS.sizes.sm, color: COLORS.textPrimary },
  generateBtn: { backgroundColor: COLORS.secondary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
  slotsSection: { padding: SPACING.base },
  slotsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  slotsDate: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, textTransform: 'capitalize' },
  addSlotBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: 6 },
  addSlotBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: FONTS.sizes.sm },
  addSlotForm: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
  saveSlotBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  saveSlotBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
  noSlots: { alignItems: 'center', padding: SPACING.xxl, gap: SPACING.sm },
  noSlotsIcon: { fontSize: 40 },
  noSlotsText: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.textPrimary },
  noSlotsHint: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'center' },
  slotItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm,
  },
  slotBooked: { backgroundColor: '#FFF5F5' },
  slotLeft: { flex: 1 },
  slotTime: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary },
  slotDuration: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  slotMiddle: { flex: 1, alignItems: 'center' },
  slotStatusBadge: { borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  slotStatusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  slotPriceOverride: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  slotActions: { flexDirection: 'row', gap: SPACING.sm },
  slotBlockBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF8E1', justifyContent: 'center', alignItems: 'center' },
  slotDeleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' },
});
