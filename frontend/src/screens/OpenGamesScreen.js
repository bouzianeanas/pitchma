import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../config/theme';

export default function OpenGamesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matchs ouverts</Text>
        <Text style={styles.subtitle}>Rejoignez un match ou organisez le votre</Text>
      </View>
      <View style={styles.comingSoon}>
        <Text style={styles.icon}>⚽</Text>
        <Text style={styles.comingSoonTitle}>Bientot disponible !</Text>
        <Text style={styles.comingSoonText}>
          La fonctionnalite de matchs ouverts arrive bientot.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.surface, padding: 16,
    paddingTop: 48, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  comingSoon: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  icon: { fontSize: 64 },
  comingSoonTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  comingSoonText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
});