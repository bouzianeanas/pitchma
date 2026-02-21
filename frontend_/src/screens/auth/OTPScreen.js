import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';

export default function OTPScreen({ navigation, route }) {
  const { phone } = route.params;
  const { login } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOTPChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (newOtp.every(d => d !== '') && text) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await authAPI.verifyOTP(phone, code);
      const { is_new_user, token, user } = response.data;

      if (is_new_user && !user) {
        navigation.navigate('CompleteProfile', { phone, token: null });
      } else {
        await login(token, user);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Code invalide';
      Alert.alert('Erreur', msg);
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await authAPI.sendOTP(phone);
      setCountdown(60);
      Alert.alert('Envoyé', 'Un nouveau code a été envoyé');
    } catch {
      Alert.alert('Erreur', 'Impossible de renvoyer le code');
    }
  };

  const displayPhone = phone.replace(/(\+\d{3})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5 $6');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Back button */}
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📱</Text>
        </View>

        <Text style={styles.title}>Vérification</Text>
        <Text style={styles.subtitle}>
          Code envoyé au{'\n'}
          <Text style={styles.phone}>{phone}</Text>
        </Text>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputs.current[index] = ref}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={text => handleOTPChange(text.slice(-1), index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              autoFocus={index === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        {isLoading && (
          <Text style={styles.verifyingText}>Vérification en cours...</Text>
        )}

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={() => handleVerify(otp.join(''))}
          disabled={isLoading || otp.some(d => !d)}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Vérification...' : 'Confirmer'}
          </Text>
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity style={styles.resendContainer} onPress={handleResend} disabled={countdown > 0}>
          <Text style={styles.resendText}>
            {countdown > 0 ? (
              <>Renvoyer le code dans <Text style={styles.countdown}>{countdown}s</Text></>
            ) : (
              <Text style={styles.resendLink}>Renvoyer le code</Text>
            )}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  back: { padding: SPACING.base, paddingTop: SPACING.xxxl },
  content: { flex: 1, padding: SPACING.xl, alignItems: 'center' },
  iconContainer: {
    width: 80, height: 80, borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.primaryLight, justifyContent: 'center',
    alignItems: 'center', marginBottom: SPACING.xl,
  },
  icon: { fontSize: 36 },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  subtitle: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: SPACING.xl },
  phone: { fontWeight: '700', color: COLORS.textPrimary },
  otpContainer: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  otpInput: {
    width: 48, height: 56, borderRadius: BORDER_RADIUS.md,
    borderWidth: 2, borderColor: COLORS.border, textAlign: 'center',
    fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.textPrimary,
    backgroundColor: COLORS.surface, ...SHADOWS.sm,
  },
  otpInputFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  verifyingText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.md },
  button: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxxl, alignItems: 'center', width: '100%',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700' },
  resendContainer: { marginTop: SPACING.lg },
  resendText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  countdown: { color: COLORS.primary, fontWeight: '700' },
  resendLink: { color: COLORS.primary, fontWeight: '700' },
});
