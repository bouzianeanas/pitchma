import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Image, ScrollView, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../config/api';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';

const COUNTRY_CODES = [
  { code: '+212', flag: '🇲🇦', country: 'Maroc' },
  { code: '+33', flag: '🇫🇷', country: 'France' },
  { code: '+34', flag: '🇪🇸', country: 'Espagne' },
];

export default function PhoneScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [selectedCode, setSelectedCode] = useState(COUNTRY_CODES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCodePicker, setShowCodePicker] = useState(false);

  const handleSendOTP = async () => {
    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.length < 9) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro valide');
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = `${selectedCode.code}${cleanPhone.replace(/^0/, '')}`;
      await authAPI.sendOTP(fullPhone);
      navigation.navigate('OTP', { phone: fullPhone });
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'envoyer le code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>⚽</Text>
          </View>
          <Text style={styles.appName}>PitchMA</Text>
          <Text style={styles.tagline}>Réservez votre terrain en quelques secondes</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>Entrez votre numéro</Text>
          <Text style={styles.subtitle}>Nous vous enverrons un code de vérification</Text>

          {/* Phone Input */}
          <View style={styles.phoneInputContainer}>
            <TouchableOpacity
              style={styles.countryCode}
              onPress={() => setShowCodePicker(!showCodePicker)}
            >
              <Text style={styles.flag}>{selectedCode.flag}</Text>
              <Text style={styles.codeText}>{selectedCode.code}</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="06 12 34 56 78"
              keyboardType="phone-pad"
              maxLength={12}
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          {/* Country Code Picker */}
          {showCodePicker && (
            <View style={styles.codePicker}>
              {COUNTRY_CODES.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={styles.codePickerItem}
                  onPress={() => { setSelectedCode(item); setShowCodePicker(false); }}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={styles.codePickerText}>{item.country}</Text>
                  <Text style={styles.codePickerCode}>{item.code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.buttonText}>Envoi en cours...</Text>
            ) : (
              <>
                <Text style={styles.buttonText}>Recevoir le code</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.terms}>
            En continuant, vous acceptez nos{' '}
            <Text style={styles.link}>Conditions d'utilisation</Text> et notre{' '}
            <Text style={styles.link}>Politique de confidentialité</Text>
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {[
            { icon: 'location', text: 'Terrains près de chez vous' },
            { icon: 'calendar', text: 'Réservation instantanée' },
            { icon: 'people', text: 'Rejoignez des matchs ouverts' },
          ].map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <Ionicons name={f.icon} size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: SPACING.base },
  header: { alignItems: 'center', paddingVertical: SPACING.xxxl },
  logoContainer: {
    width: 80, height: 80, borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.primaryLight, justifyContent: 'center',
    alignItems: 'center', marginBottom: SPACING.md,
  },
  logoIcon: { fontSize: 40 },
  appName: { fontSize: FONTS.sizes.xxxl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  tagline: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'center' },
  form: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl, ...SHADOWS.md,
  },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  phoneInputContainer: {
    flexDirection: 'row', borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, overflow: 'hidden', marginBottom: SPACING.base,
  },
  countryCode: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, gap: 4,
  },
  flag: { fontSize: 20 },
  codeText: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.textPrimary },
  phoneInput: {
    flex: 1, paddingHorizontal: SPACING.md, fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary, letterSpacing: 1,
  },
  codePicker: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface, marginBottom: SPACING.base, ...SHADOWS.sm,
  },
  codePickerItem: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  codePickerText: { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.textPrimary },
  codePickerCode: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  button: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700' },
  terms: { textAlign: 'center', fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: SPACING.md, lineHeight: 18 },
  link: { color: COLORS.primary, fontWeight: '600' },
  features: { marginTop: SPACING.xl, gap: SPACING.md },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  featureText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
});
