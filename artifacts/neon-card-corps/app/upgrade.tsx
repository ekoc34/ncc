import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMeta, UPGRADE_OPTIONS } from '@/context/MetaContext';
import * as Haptics from 'expo-haptics';

const ICON_MAP: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  heart: 'heart',
  zap: 'zap',
  cpu: 'cpu',
  shield: 'shield',
};

export default function UpgradeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meta, purchaseUpgrade, resetMeta } = useMeta();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handlePurchase = async (upgradeId: string) => {
    setPurchasing(upgradeId);
    const success = await purchaseUpgrade(upgradeId);
    setPurchasing(null);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Progress',
      'This will delete all gold, upgrades, and stats. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetMeta();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#8888bb" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>UPGRADES</Text>
        <View style={styles.goldDisplay}>
          <Feather name="dollar-sign" size={16} color="#ffee00" />
          <Text style={styles.goldValue}>{meta.totalGold}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>Permanent upgrades that carry over between runs</Text>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {UPGRADE_OPTIONS.map((option) => {
          const currentLevel = meta.upgrades[option.id] ?? 0;
          const isMaxed = currentLevel >= option.maxLevel;
          const canAfford = meta.totalGold >= option.costPerLevel;
          const isLoading = purchasing === option.id;

          return (
            <View key={option.id} style={styles.upgradeCard}>
              <View style={styles.upgradeLeft}>
                <View style={[styles.iconBox, isMaxed && styles.iconBoxMaxed]}>
                  <Feather
                    name={ICON_MAP[option.icon] ?? 'star'}
                    size={20}
                    color={isMaxed ? '#ffee00' : '#00f5ff'}
                  />
                </View>
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeName}>{option.name}</Text>
                  <Text style={styles.upgradeDesc}>{option.description}</Text>
                  <View style={styles.levelDots}>
                    {Array.from({ length: option.maxLevel }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.levelDot,
                          i < currentLevel && styles.levelDotFilled,
                        ]}
                      />
                    ))}
                    <Text style={styles.levelText}>{currentLevel}/{option.maxLevel}</Text>
                  </View>
                </View>
              </View>

              {isMaxed ? (
                <View style={styles.maxedBadge}>
                  <Text style={styles.maxedText}>MAXED</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
                  onPress={() => handlePurchase(option.id)}
                  disabled={!canAfford || isLoading}
                >
                  <Text style={styles.buyBtnCost}>{option.costPerLevel}G</Text>
                  <Text style={styles.buyBtnLabel}>UPGRADE</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>DANGER ZONE</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Feather name="trash-2" size={16} color="#ff3060" />
            <Text style={styles.resetText}>Reset All Progress</Text>
          </TouchableOpacity>
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
    flex: 1,
    color: '#e0e0ff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
  },
  goldDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffee0022',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#ffee00',
  },
  goldValue: {
    color: '#ffee00',
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: '#6060a0',
    fontSize: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120028',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a0060',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  upgradeLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#00f5ff22',
    borderWidth: 1,
    borderColor: '#00f5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxMaxed: {
    backgroundColor: '#ffee0022',
    borderColor: '#ffee00',
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeName: {
    color: '#e0e0ff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  upgradeDesc: {
    color: '#8888bb',
    fontSize: 11,
    marginBottom: 6,
  },
  levelDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1a0035',
    borderWidth: 1,
    borderColor: '#2a0060',
  },
  levelDotFilled: {
    backgroundColor: '#00f5ff',
    borderColor: '#00f5ff',
  },
  levelText: {
    color: '#6060a0',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  buyBtn: {
    alignItems: 'center',
    backgroundColor: '#00f5ff22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00f5ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
  },
  buyBtnDisabled: {
    backgroundColor: '#1a0035',
    borderColor: '#2a0060',
    opacity: 0.5,
  },
  buyBtnCost: {
    color: '#ffee00',
    fontSize: 13,
    fontWeight: '800',
  },
  buyBtnLabel: {
    color: '#00f5ff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  maxedBadge: {
    backgroundColor: '#ffee0022',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffee00',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  maxedText: {
    color: '#ffee00',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dangerZone: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#ff306015',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff306040',
    padding: 14,
  },
  dangerTitle: {
    color: '#ff3060',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetText: {
    color: '#ff3060',
    fontSize: 14,
    fontWeight: '600',
  },
});
