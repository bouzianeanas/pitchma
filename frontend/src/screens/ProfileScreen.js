// ============================================
// ProfileScreen.js
// ============================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../config/theme';

export function ProfileScreen({ navigation }) {
  const { user, logout, isManager } = useAuth();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ]);
  };

  const MenuItem = ({ icon, label, onPress, color = COLORS.textPrimary, showArrow = true }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      {showArrow && <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.full_name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.full_name}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'admin' ? '🛡️ Admin' : user?.role === 'manager' ? '🏟️ Gestionnaire' : '⚽ Joueur'}
          </Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Compte</Text>
        <MenuItem icon="person-outline" label="Modifier le profil" onPress={() => {}} />
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => {}} />
        <MenuItem icon="language-outline" label="Langue" onPress={() => {}} />
      </View>

      {!isManager && (
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Devenir gestionnaire</Text>
          <MenuItem
            icon="business-outline"
            label="Enregistrer mon terrain"
            onPress={() => Alert.alert('Bientôt disponible', 'La demande de gestionnaire sera disponible prochainement.')}
            color={COLORS.primary}
          />
        </View>
      )}

      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Aide</Text>
        <MenuItem icon="help-circle-outline" label="FAQ" onPress={() => {}} />
        <MenuItem icon="chatbubble-outline" label="Contacter le support" onPress={() => {}} />
        <MenuItem icon="document-text-outline" label="Conditions d'utilisation" onPress={() => {}} />
        <MenuItem icon="shield-checkmark-outline" label="Politique de confidentialité" onPress={() => {}} />
      </View>

      <View style={styles.menuSection}>
        <MenuItem icon="log-out-outline" label="Déconnexion" onPress={handleLogout} color={COLORS.error} showArrow={false} />
      </View>

      <Text style={styles.version}>PitchMA v1.0.0 🇲🇦</Text>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.surface, alignItems: 'center', paddingTop: SPACING.xxxl, paddingBottom: SPACING.xl, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  avatarText: { fontSize: FONTS.sizes.xxxl, color: '#fff', fontWeight: '800' },
  name: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.textPrimary },
  phone: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 4 },
  roleBadge: { marginTop: SPACING.sm, backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 4 },
  roleText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '700' },
  menuSection: { backgroundColor: COLORS.surface, marginTop: SPACING.md, paddingHorizontal: SPACING.base },
  menuSectionTitle: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, paddingVertical: SPACING.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider, gap: SPACING.md },
  menuIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: FONTS.sizes.base },
  version: { textAlign: 'center', fontSize: FONTS.sizes.sm, color: COLORS.textLight, marginTop: SPACING.xl },
});

export default ProfileScreen;
