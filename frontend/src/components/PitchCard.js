import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, SPORT_CONFIG, SURFACE_LABELS } from '../config/theme';

const { width } = Dimensions.get('window');

export default function PitchCard({ pitch, onPress, compact = false }) {
  const primarySport = pitch.sport_types?.[0] || 'football';
  const sportConfig = SPORT_CONFIG[primarySport] || SPORT_CONFIG.football;

  if (compact) {
    return (
      <TouchableOpacity style={styles.compact} onPress={onPress}>
        <Image
          source={{ uri: pitch.cover_image || 'https://via.placeholder.com/150x100?text=Terrain' }}
          style={styles.compactImage}
        />
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>{pitch.name}</Text>
          <Text style={styles.compactLocation} numberOfLines={1}>
            <Ionicons name="location-sharp" size={12} color={COLORS.textLight} />
            {' '}{pitch.neighborhood || pitch.city_name}
          </Text>
          <Text style={styles.compactPrice}>
            <Text style={styles.priceValue}>{pitch.price_per_hour}</Text>
            <Text style={styles.priceCurrency}> MAD/h</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: pitch.cover_image || `https://via.placeholder.com/400x200?text=${pitch.name}` }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Sport Badge */}
        <View style={[styles.sportBadge, { backgroundColor: sportConfig.color }]}>
          <Text style={styles.sportBadgeText}>{sportConfig.label}</Text>
        </View>
        {/* Rating */}
        {pitch.average_rating > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFB300" />
            <Text style={styles.ratingText}>{parseFloat(pitch.average_rating).toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{pitch.name}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={14} color={COLORS.textLight} />
          <Text style={styles.location} numberOfLines={1}>
            {pitch.neighborhood ? `${pitch.neighborhood}, ` : ''}{pitch.city_name || 'Maroc'}
          </Text>
          {pitch.distance_km && (
            <Text style={styles.distance}> • {parseFloat(pitch.distance_km).toFixed(1)} km</Text>
          )}
        </View>

        {/* Details Row */}
        <View style={styles.detailsRow}>
          {pitch.pitch_size && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{pitch.pitch_size}</Text>
            </View>
          )}
          {pitch.surface_type && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{SURFACE_LABELS[pitch.surface_type] || pitch.surface_type}</Text>
            </View>
          )}
          {pitch.has_lighting && (
            <View style={styles.tag}>
              <Ionicons name="flashlight" size={11} color={COLORS.textSecondary} />
              <Text style={styles.tagText}> Éclairage</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Amenities */}
          <View style={styles.amenities}>
            {pitch.has_parking && <Ionicons name="car" size={16} color={COLORS.textLight} />}
            {pitch.has_showers && <Ionicons name="water" size={16} color={COLORS.textLight} />}
            {pitch.has_cafe && <Ionicons name="cafe" size={16} color={COLORS.textLight} />}
            {pitch.has_changing_rooms && <Ionicons name="shirt" size={16} color={COLORS.textLight} />}
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceValue}>{pitch.price_per_hour}</Text>
            <Text style={styles.priceCurrency}> MAD/h</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden', ...SHADOWS.md,
  },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 180 },
  sportBadge: {
    position: 'absolute', top: SPACING.sm, left: SPACING.sm,
    borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4,
  },
  sportBadgeText: { color: '#fff', fontSize: FONTS.sizes.xs, fontWeight: '700' },
  ratingBadge: {
    position: 'absolute', top: SPACING.sm, right: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  ratingText: { color: '#fff', fontSize: FONTS.sizes.xs, fontWeight: '700' },
  content: { padding: SPACING.md },
  name: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  location: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, flex: 1 },
  distance: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  detailsRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap', marginBottom: SPACING.sm },
  tag: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 3,
  },
  tagText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amenities: { flexDirection: 'row', gap: SPACING.sm },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  priceValue: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.primary },
  priceCurrency: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },

  // Compact
  compact: {
    width: 200, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden', ...SHADOWS.md, marginHorizontal: SPACING.xs,
  },
  compactImage: { width: '100%', height: 110 },
  compactContent: { padding: SPACING.sm },
  compactName: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary },
  compactLocation: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 2 },
  compactPrice: { marginTop: 4 },
});
