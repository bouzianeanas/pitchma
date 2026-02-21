import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { managerAPI, pitchesAPI } from '../../config/api';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS, SPORT_CONFIG } from '../../config/theme';

const SURFACE_OPTIONS = [
  { key: 'natural_grass', label: '🌱 Gazon naturel' },
  { key: 'artificial_turf', label: '🟩 Synthétique' },
  { key: 'concrete', label: '🏢 Béton' },
  { key: 'indoor', label: '🏠 Indoor' },
];

const SIZE_OPTIONS = ['5v5', '6v6', '7v7', '8v8', '11v11'];

export default function CreatePitchScreen({ navigation, route }) {
  const isEditing = route.params?.editing;
  const pitchId = route.params?.pitchId;
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', address: '', neighborhood: '',
    city_id: '', latitude: '', longitude: '',
    sport_types: ['football'], surface_type: 'artificial_turf',
    pitch_size: '5v5', capacity: '10', price_per_hour: '',
    has_changing_rooms: false, has_showers: false,
    has_parking: false, has_lighting: false, has_cafe: false, cover_image: '',
  });

  useEffect(() => {
    pitchesAPI.getCities().then(res => setCities(res.data.cities)).catch(() => {});
  }, []);

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleSport = (sport) => {
    const current = form.sport_types;
    if (current.includes(sport)) {
      if (current.length > 1) setField('sport_types', current.filter(s => s !== sport));
    } else {
      setField('sport_types', [...current, sport]);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.price_per_hour) {
      Alert.alert('Erreur', 'Champs obligatoires: nom, adresse, prix');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        ...form,
        capacity: parseInt(form.capacity) || 10,
        price_per_hour: parseFloat(form.price_per_hour),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        city_id: form.city_id || null,
      };
      if (isEditing) {
        await managerAPI.updatePitch(pitchId, payload);
        Alert.alert('Succès', 'Terrain mis à jour !', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await managerAPI.createPitch(payload);
        Alert.alert('Terrain créé !', 'Il sera visible après validation par l\'admin.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Modifier le terrain' : 'Nouveau terrain'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Informations générales</Text>
          {[
            { label: 'Nom du terrain *', field: 'name', placeholder: 'Ex: Terrain Atlas Casablanca' },
            { label: 'Description', field: 'description', placeholder: 'Décrivez votre terrain...', multiline: true },
          ].map(f => (
            <View key={f.field} style={styles.field}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput
                style={[styles.input, f.multiline && styles.inputMultiline]}
                value={form[f.field]}
                onChangeText={v => setField(f.field, v)}
                placeholder={f.placeholder}
                multiline={f.multiline}
                numberOfLines={f.multiline ? 3 : 1}
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          ))}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Localisation</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Adresse complète *</Text>
            <TextInput style={styles.input} value={form.address} onChangeText={v => setField('address', v)} placeholder="Rue, quartier, ville" placeholderTextColor={COLORS.textLight} />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Quartier</Text>
            <TextInput style={styles.input} value={form.neighborhood} onChangeText={v => setField('neighborhood', v)} placeholder="Ex: Hay Mohammadi" placeholderTextColor={COLORS.textLight} />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Ville</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionsRow}>
                {cities.map(city => (
                  <TouchableOpacity
                    key={city.id}
                    style={[styles.option, form.city_id === city.id && styles.optionSelected]}
                    onPress={() => setField('city_id', city.id)}
                  >
                    <Text style={[styles.optionText, form.city_id === city.id && styles.optionTextSelected]}>
                      {city.name_fr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          <View style={styles.rowFields}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Latitude</Text>
              <TextInput style={styles.input} value={form.latitude} onChangeText={v => setField('latitude', v)} placeholder="33.5731" keyboardType="numeric" placeholderTextColor={COLORS.textLight} />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Longitude</Text>
              <TextInput style={styles.input} value={form.longitude} onChangeText={v => setField('longitude', v)} placeholder="-7.5898" keyboardType="numeric" placeholderTextColor={COLORS.textLight} />
            </View>
          </View>
          <Text style={styles.fieldHint}>💡 Trouvez les coordonnées sur Google Maps (appui long sur votre terrain)</Text>
        </View>

        {/* Pitch Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚽ Caractéristiques</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Sports disponibles</Text>
            <View style={styles.optionsRow}>
              {Object.entries(SPORT_CONFIG).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.option, form.sport_types.includes(key) && styles.optionSelected]}
                  onPress={() => toggleSport(key)}
                >
                  <Text style={[styles.optionText, form.sport_types.includes(key) && styles.optionTextSelected]}>
                    {config.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Type de surface</Text>
            <View style={styles.optionsRow}>
              {SURFACE_OPTIONS.map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.option, form.surface_type === s.key && styles.optionSelected]}
                  onPress={() => setField('surface_type', s.key)}
                >
                  <Text style={[styles.optionText, form.surface_type === s.key && styles.optionTextSelected]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Taille du terrain</Text>
            <View style={styles.optionsRow}>
              {SIZE_OPTIONS.map(size => (
                <TouchableOpacity
                  key={size}
                  style={[styles.option, form.pitch_size === size && styles.optionSelected]}
                  onPress={() => setField('pitch_size', size)}
                >
                  <Text style={[styles.optionText, form.pitch_size === size && styles.optionTextSelected]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Tarification</Text>
          <View style={styles.rowFields}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Prix par heure (MAD) *</Text>
              <TextInput style={styles.input} value={form.price_per_hour} onChangeText={v => setField('price_per_hour', v)} placeholder="150" keyboardType="numeric" placeholderTextColor={COLORS.textLight} />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Capacité (joueurs)</Text>
              <TextInput style={styles.input} value={form.capacity} onChangeText={v => setField('capacity', v)} placeholder="10" keyboardType="numeric" placeholderTextColor={COLORS.textLight} />
            </View>
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏪 Équipements</Text>
          {[
            { key: 'has_changing_rooms', label: '👕 Vestiaires' },
            { key: 'has_showers', label: '🚿 Douches' },
            { key: 'has_parking', label: '🚗 Parking' },
            { key: 'has_lighting', label: '💡 Éclairage nocturne' },
            { key: 'has_cafe', label: '☕ Café / Snack' },
          ].map(amenity => (
            <View key={amenity.key} style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>{amenity.label}</Text>
              <Switch
                value={form[amenity.key]}
                onValueChange={v => setField(amenity.key, v)}
                trackColor={{ true: COLORS.primary }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Cover Image */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📷 Image de couverture</Text>
          <TextInput
            style={styles.input}
            value={form.cover_image}
            onChangeText={v => setField('cover_image', v)}
            placeholder="URL de l'image (https://...)"
            placeholderTextColor={COLORS.textLight}
          />
          <Text style={styles.fieldHint}>💡 Utilisez Cloudinary ou Imgur pour héberger vos images</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Ionicons name={isEditing ? 'save' : 'add-circle'} size={22} color="#fff" />
          <Text style={styles.submitBtnText}>
            {isLoading ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Créer le terrain'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.base, paddingTop: SPACING.xxxl, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { padding: SPACING.base },
  section: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  field: { marginBottom: SPACING.sm },
  fieldLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 6 },
  fieldHint: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONTS.sizes.base, color: COLORS.textPrimary },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  rowFields: { flexDirection: 'row', gap: SPACING.sm },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  option: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 6 },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  optionText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  optionTextSelected: { color: COLORS.primary, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  toggleLabel: { fontSize: FONTS.sizes.base, color: COLORS.textPrimary },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700' },
});
