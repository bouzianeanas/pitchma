import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, FlatList, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/fr';
import { pitchesAPI } from '../config/api';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, SURFACE_LABELS } from '../config/theme';

moment.locale('fr');
const { width } = Dimensions.get('window');

export default function PitchDetailScreen({ navigation, route }) {
  const { pitchId } = route.params;
  const [pitch, setPitch] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const next7Days = Array.from({ length: 14 }, (_, i) => moment().add(i, 'days'));

  useEffect(() => {
    loadPitch();
  }, []);

  useEffect(() => {
    if (pitch) loadSlots();
  }, [selectedDate]);

  const loadPitch = async () => {
    try {
      const res = await pitchesAPI.getOne(pitchId, { date: selectedDate });
      setPitch(res.data.pitch);
      setReviews(res.data.reviews);
      setSlots(res.data.slots);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le terrain');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      const res = await pitchesAPI.getSlots(pitchId, { date: selectedDate, days: 1 });
      const daySlots = res.data.slots[selectedDate] || [];
      setSlots(daySlots);
    } catch {}
  };

  const availableSlots = slots.filter(s => s.status === 'available');

  if (isLoading || !pitch) {
    return <View style={styles.loading}><Text>Chargement...</Text></View>;
  }

  const allImages = [pitch.cover_image, ...(pitch.images || [])].filter(Boolean);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.gallery}>
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
          >
            {(allImages.length > 0 ? allImages : ['https://via.placeholder.com/400x250']).map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.galleryImage} />
            ))}
          </ScrollView>

          {/* Image indicators */}
          {allImages.length > 1 && (
            <View style={styles.indicators}>
              {allImages.map((_, i) => (
                <View key={i} style={[styles.indicator, i === activeImageIndex && styles.indicatorActive]} />
              ))}
            </View>
          )}

          {/* Back Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title & Rating */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{pitch.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={14} color={COLORS.primary} />
                <Text style={styles.location}>{pitch.neighborhood || ''} {pitch.city_name}</Text>
              </View>
            </View>
            {pitch.average_rating > 0 && (
              <View style={styles.ratingBox}>
                <Text style={styles.ratingValue}>{parseFloat(pitch.average_rating).toFixed(1)}</Text>
                <Ionicons name="star" size={14} color="#FFB300" />
                <Text style={styles.ratingCount}>({pitch.total_reviews})</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {pitch.surface_type && (
              <View style={styles.tag}>
                <Ionicons name="layers" size={13} color={COLORS.primary} />
                <Text style={styles.tagText}>{SURFACE_LABELS[pitch.surface_type]}</Text>
              </View>
            )}
            {pitch.pitch_size && (
              <View style={styles.tag}>
                <Ionicons name="people" size={13} color={COLORS.primary} />
                <Text style={styles.tagText}>{pitch.pitch_size}</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Prix par heure</Text>
            <Text style={styles.price}>{pitch.price_per_hour} <Text style={styles.priceCurrency}>MAD</Text></Text>
          </View>

          {/* Amenities */}
          <Text style={styles.sectionTitle}>Équipements</Text>
          <View style={styles.amenitiesGrid}>
            {[
              { key: 'has_changing_rooms', icon: 'shirt', label: 'Vestiaires' },
              { key: 'has_showers', icon: 'water', label: 'Douches' },
              { key: 'has_parking', icon: 'car', label: 'Parking' },
              { key: 'has_lighting', icon: 'flashlight', label: 'Éclairage' },
              { key: 'has_cafe', icon: 'cafe', label: 'Café' },
            ].map(amenity => (
              <View key={amenity.key} style={[styles.amenityItem, !pitch[amenity.key] && styles.amenityDisabled]}>
                <Ionicons name={amenity.icon} size={20} color={pitch[amenity.key] ? COLORS.primary : COLORS.textLight} />
                <Text style={[styles.amenityText, !pitch[amenity.key] && styles.amenityTextDisabled]}>
                  {amenity.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Date Picker */}
          <Text style={styles.sectionTitle}>Choisir une date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datePicker}>
            {next7Days.map(day => {
              const dateStr = day.format('YYYY-MM-DD');
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === moment().format('YYYY-MM-DD');
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <Text style={[styles.dateDow, isSelected && styles.dateTextSelected]}>
                    {isToday ? 'Auj.' : day.format('ddd')}
                  </Text>
                  <Text style={[styles.dateNum, isSelected && styles.dateTextSelected]}>
                    {day.format('D')}
                  </Text>
                  <Text style={[styles.dateMon, isSelected && styles.dateTextSelected]}>
                    {day.format('MMM')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Time Slots */}
          <Text style={styles.sectionTitle}>
            Créneaux disponibles ({availableSlots.length})
          </Text>

          {slots.length === 0 ? (
            <View style={styles.noSlots}>
              <Text style={styles.noSlotsText}>Aucun créneau pour cette date</Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {slots.map(slot => {
                const isAvailable = slot.status === 'available';
                const slotPrice = slot.price_override || pitch.price_per_hour;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[styles.slotItem, !isAvailable && styles.slotBooked]}
                    disabled={!isAvailable}
                    onPress={() => navigation.navigate('Booking', { slot, pitch })}
                  >
                    <Text style={[styles.slotTime, !isAvailable && styles.slotTimeDim]}>
                      {slot.start_time?.slice(0, 5)}
                    </Text>
                    <Text style={[styles.slotDuration, !isAvailable && styles.slotTimeDim]}>
                      {slot.duration_minutes}min
                    </Text>
                    {isAvailable ? (
                      <Text style={styles.slotPrice}>{slotPrice} MAD</Text>
                    ) : (
                      <Text style={styles.slotTaken}>Pris</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Description */}
          {pitch.description && (
            <>
              <Text style={styles.sectionTitle}>À propos</Text>
              <Text style={styles.description}>{pitch.description}</Text>
            </>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Avis ({reviews.length})</Text>
              {reviews.map((review, i) => (
                <View key={i} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.full_name}</Text>
                    <View style={styles.stars}>
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Ionicons key={s} name="star" size={12} color={s < review.rating ? '#FFB300' : COLORS.border} />
                      ))}
                    </View>
                  </View>
                  {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                </View>
              ))}
            </>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Book Button */}
      {availableSlots.length > 0 && (
        <View style={styles.bookBar}>
          <View>
            <Text style={styles.bookPriceLabel}>À partir de</Text>
            <Text style={styles.bookPrice}>{pitch.price_per_hour} MAD<Text style={styles.bookPriceUnit}>/h</Text></Text>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => navigation.navigate('Booking', { pitch, slot: null })}
          >
            <Text style={styles.bookBtnText}>Réserver</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gallery: { position: 'relative' },
  galleryImage: { width, height: 260, resizeMode: 'cover' },
  backBtn: {
    position: 'absolute', top: SPACING.xxxl, left: SPACING.base,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: SPACING.sm,
  },
  indicators: { position: 'absolute', bottom: SPACING.sm, flexDirection: 'row', alignSelf: 'center', gap: 4 },
  indicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  indicatorActive: { backgroundColor: '#fff', width: 16 },
  content: { padding: SPACING.base },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm },
  name: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  location: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md },
  ratingValue: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.primary },
  ratingCount: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  tagsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.base },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  tagText: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '600' },
  priceCard: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    ...SHADOWS.sm, marginBottom: SPACING.base,
  },
  priceLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  price: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.primary },
  priceCurrency: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm, marginTop: SPACING.base },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  amenityItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, minWidth: '45%' },
  amenityDisabled: { backgroundColor: COLORS.surfaceAlt },
  amenityText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  amenityTextDisabled: { color: COLORS.textLight, textDecorationLine: 'line-through' },
  datePicker: { marginBottom: SPACING.sm },
  dateItem: { alignItems: 'center', marginRight: SPACING.sm, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, minWidth: 56 },
  dateItemSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  dateDow: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, textTransform: 'capitalize' },
  dateNum: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary },
  dateMon: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, textTransform: 'capitalize' },
  dateTextSelected: { color: '#fff' },
  noSlots: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, alignItems: 'center' },
  noSlotsText: { color: COLORS.textSecondary },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  slotItem: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, alignItems: 'center', minWidth: '30%', flex: 1, backgroundColor: COLORS.primaryLight },
  slotBooked: { borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
  slotTime: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.primary },
  slotTimeDim: { color: COLORS.textLight },
  slotDuration: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  slotPrice: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  slotTaken: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  description: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, lineHeight: 22 },
  reviewCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewerName: { fontWeight: '700', color: COLORS.textPrimary },
  stars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  bookBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface, padding: SPACING.base,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOWS.lg,
    paddingBottom: SPACING.xl,
  },
  bookPriceLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  bookPrice: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  bookPriceUnit: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  bookBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  bookBtnText: { color: '#fff', fontSize: FONTS.sizes.base, fontWeight: '700' },
});
