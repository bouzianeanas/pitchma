import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { authAPI } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';

export default function CompleteProfileScreen({ navigation, route }) {
  const { phone } = route.params;
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('fr');
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (!fullName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom complet');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.completeRegistration({
        phone, full_name: fullName.trim(),
        email: email.trim() || undefined, preferred_language: language,
      });
      await login(response.data.token, response.data.user);
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Inscription échouée');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Complétez votre profil</Text>
        <Text style={styles.subtitle}>Dites-nous comment vous appeler</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nom complet *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Ex: Mohamed Alami"
            autoCapitalize="words"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>Email (optionnel)</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>Langue préférée</Text>
          <View style={styles.languageRow}>
            {[
              { code: 'fr', label: '🇫🇷 Français' },
              { code: 'ar', label: '🇲🇦 العربية' },
              { code: 'en', label: '🇬🇧 English' },
            ].map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langBtn, language === lang.code && styles.langBtnActive]}
                onPress={() => setLanguage(lang.code)}
              >
                <Text style={[styles.langText, language === lang.code && styles.langTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? 'Chargement...' : "C'est parti ! 🚀"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: SPACING.xl, paddingTop: SPACING.xxxl },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  form: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, ...SHADOWS.md, marginBottom: SPACING.xl },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: SPACING.md },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 14, fontSize: FONTS.sizes.base, color: COLORS.textPrimary,
  },
  languageRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: 6 },
  langBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm, alignItems: 'center',
  },
  langBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  langText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  langTextActive: { color: COLORS.primary, fontWeight: '700' },
  button: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700' },
});
