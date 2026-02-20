import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { managerAPI } from '../../config/api';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../config/theme';

export default function ManagePitchesScreen({ navigation }) {
  const [pitches, setPitches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadPitches(); }, []);

  const loadPitches = async () => {
    try {
      const res = await managerAPI.getPitches();
      setPitches(res.data.pitches);
    } catch {}
    finally { setIsLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadPitches(); setRefreshing(false); };

  const toggleActive = async (pitch) => {
    try {
      await managerAPI.updatePitch(pitch.id, { is_active: !pitch.is_active });
      loadPitches();
    } catch { Alert.alert('Erreur', 'Modification impossible'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes terrains</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreatePitch')}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addBtnText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={pitches}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <View style={styles.pitchCard}>
            <View style={styles.pitchHeader}>
              <Text style={styles.pitchName}>{item.name}</Text>
              <Switch
                value={item.is_active}
                onValueChange={() => toggleActive(item)}
                trackColor={{ true: COLORS.primary }}
                thumbColor="#fff"
              />
            </View>

            <Text style={styles.pitchAddress}>{item.address}</Text>

            <View style={styles.pitchStats}>
              <View style={styles.stat}>
                <Ionicons name="star" size={14} color="#FFB300" />
                <Text style={styles.statText}>{parseFloat(item.average_rating || 0).toFixed(1)}</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="calendar" size={14} color={COLORS.primary} />
                <Text style={styles.statText}>{item.total_bookings} réservations</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="cash" size={14} color={COLORS.success} />
                <Text style={styles.statText}>{item.price_per_hour} MAD/h</Text>
              </View>
            </View>

            {!item.is_approved && (
              <View style={styles.pendingBadge}>
                <Ionicons name="time" size={14} color={COLORS.warning} />
                <Text style={styles.pendingText}>En attente d'approbation admin</Text>
              </View>
            )}

            <View style={styles.pitchActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('ManageAvailability', { pitchId: item.id, pitchName: item.name })}
              >
                <Ionicons name="calendar" size={16} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>Disponibilités</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('CreatePitch', { pitchId: item.id, editing: true })}
              >
                <Ionicons name="pencil" size={16} color={COLORS.secondary} />
                <Text style={[styles.actionBtnText, { color: COLORS.secondary }]}>Modifier</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏟️</Text>
              <Text style={styles.emptyTitle}>Aucun terrain</Text>
              <Text style={styles.emptyText}>Ajoutez votre premier terrain pour commencer à recevoir des réservations</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('CreatePitch')}>
                <Text style={styles.emptyBtnText}>Ajouter un terrain</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, padding: SPACING.base, paddingTop: SPACING.xxxl, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  list: { padding: SPACING.base, gap: SPACING.md },
  pitchCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, ...SHADOWS.md },
  pitchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pitchName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  pitchAddress: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  pitchStats: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF8E1', borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.sm },
  pendingText: { fontSize: FONTS.sizes.xs, color: COLORS.warning, fontWeight: '600' },
  pitchActions: { flexDirection: 'row', gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: SPACING.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingVertical: 8 },
  actionBtnText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  empty: { alignItems: 'center', padding: SPACING.xxl, gap: SPACING.md },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, textAlign: 'center' },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.base },
});
