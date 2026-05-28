import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#8888bb" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Game</Text>
              <Text style={styles.rowValue}>Neon Card Corps</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Version</Text>
              <Text style={styles.rowValue}>1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Genre</Text>
              <Text style={styles.rowValue}>Roguelike Deckbuilder</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GAMEPLAY TIPS</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>⚡ Lightning Synergy</Text>
            <Text style={styles.tipText}>Stack 2+ lightning cards to deal chain damage to all enemies at once.</Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>🔥 Fire + Burn</Text>
            <Text style={styles.tipText}>Burn stacks deal 1 damage per turn. Fire synergy doubles it to 2.</Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>❄ Ice Freeze</Text>
            <Text style={styles.tipText}>Frozen enemies skip their attack. Ice synergy amplifies damage to frozen foes.</Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>⚙ Tech Overclock</Text>
            <Text style={styles.tipText}>Use Overclock to play your most expensive card for free.</Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>🌑 Void Drain</Text>
            <Text style={styles.tipText}>Void cards heal you on hit. Void synergy lets them bypass enemy armor.</Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>👾 NEXUS-7 Boss</Text>
            <Text style={styles.tipText}>The boss enrages on turn 3. Build up shield and burn before that happens.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07000f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a0060',
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    color: '#e0e0ff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#6060a0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#120028',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a0060',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  rowLabel: {
    color: '#8888bb',
    fontSize: 14,
  },
  rowValue: {
    color: '#e0e0ff',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a0060',
    marginHorizontal: 14,
  },
  tipCard: {
    backgroundColor: '#120028',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a0060',
    padding: 12,
    marginBottom: 8,
  },
  tipTitle: {
    color: '#e0e0ff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipText: {
    color: '#8888bb',
    fontSize: 12,
    lineHeight: 18,
  },
});
