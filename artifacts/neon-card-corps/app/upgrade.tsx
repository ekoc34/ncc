import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
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

const ICON_COLORS: Record<string, string> = {
  heart: '#ff3060',
  zap: '#ffee00',
  cpu: '#00ff88',
  shield: '#00f5ff',
};

function ScreenHeader({ onBack, gold }: { onBack: () => void; gold: number }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <View style={styles.backBtnInner}>
          <Feather name="arrow-left" size={18} color="#8888bb" />
        </View>
      </TouchableOpacity>
      <View style={styles.headerTitleRow}>
        <View style={styles.headerAccent} />
        <Text style={styles.headerTitle}>UPGRADES</Text>
      </View>
      <View style={styles.goldDisplay}>
        <Feather name="dollar-sign" size={14} color="#ffee00" />
        <Text style={styles.goldValue}>{gold}</Text>
        <Text style={styles.goldLabel}>G</Text>
      </View>
    </View>
  );
}

function UpgradeCard({
  option,
  currentLevel,
  canAfford,
  isLoading,
  isMaxed,
  onBuy,
  index,
}: {
  option: typeof UPGRADE_OPTIONS[0];
  currentLevel: number;
  canAfford: boolean;
  isLoading: boolean;
  isMaxed: boolean;
  onBuy: () => void;
  index: number;
}) {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(16);

  useEffect(() => {
    const delay = index * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    ty.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  const iconColor = ICON_COLORS[option.icon] ?? '#00f5ff';
  const progress = currentLevel / option.maxLevel;

  return (
    <Animated.View style={[styles.upgradeCard, isMaxed && styles.upgradeCardMaxed, style]}>
      <View style={[styles.iconBox, { backgroundColor: iconColor + '18', borderColor: iconColor + '66' }]}>
        <Feather
          name={ICON_MAP[option.icon] ?? 'star'}
          size={20}
          color={isMaxed ? '#ffee00' : iconColor}
        />
      </View>

      <View style={styles.upgradeInfo}>
        <View style={styles.upgradeNameRow}>
          <Text style={styles.upgradeName}>{option.name}</Text>
          {isMaxed && (
            <View style={styles.maxedBadge}>
              <Text style={styles.maxedText}>MAX</Text>
            </View>
          )}
        </View>
        <Text style={styles.upgradeDesc}>{option.description}</Text>

        <View style={styles.progressRow}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: isMaxed ? '#ffee00' : iconColor }]} />
          </View>
          <Text style={styles.levelText}>{currentLevel}/{option.maxLevel}</Text>
        </View>
      </View>

      {!isMaxed && (
        <TouchableOpacity
          style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
          onPress={onBuy}
          disabled={!canAfford || isLoading}
          activeOpacity={0.8}
        >
          <Text style={[styles.buyBtnCost, !canAfford && { color: '#555588' }]}>{option.costPerLevel}G</Text>
          <Text style={[styles.buyBtnLabel, !canAfford && { color: '#333366' }]}>
            {isLoading ? '...' : 'BUY'}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export default function UpgradeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meta, purchaseUpgrade, resetMeta } = useMeta();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const topPad = Platform.OS === 'web' ? 52 : insets.top;
  const botPad = Platform.OS === 'web' ? 28 : insets.bottom;

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
      'Reset All Progress',
      'This will permanently delete all gold, upgrades, and run statistics. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
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
      <ScreenHeader onBack={() => router.back()} gold={meta.totalGold} />

      <Text style={styles.subtitle}>
        Permanent upgrades that persist across all runs
      </Text>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {UPGRADE_OPTIONS.map((option, index) => {
          const currentLevel = meta.upgrades[option.id] ?? 0;
          const isMaxed = currentLevel >= option.maxLevel;
          const canAfford = meta.totalGold >= option.costPerLevel;

          return (
            <UpgradeCard
              key={option.id}
              option={option}
              currentLevel={currentLevel}
              canAfford={canAfford}
              isLoading={purchasing === option.id}
              isMaxed={isMaxed}
              onBuy={() => handlePurchase(option.id)}
              index={index}
            />
          );
        })}

        <View style={styles.dangerZone}>
          <View style={styles.dangerHeader}>
            <Feather name="alert-triangle" size={12} color="#ff3060" />
            <Text style={styles.dangerTitle}>DANGER ZONE</Text>
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.75}>
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e0040',
    gap: 12,
  },
  backBtn: {
    padding: 2,
  },
  backBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#120028',
    borderWidth: 1,
    borderColor: '#2a0060',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAccent: {
    width: 3,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#7b2fff',
  },
  headerTitle: {
    color: '#e0e0ff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 4,
  },
  goldDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ffee0015',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ffee0055',
  },
  goldValue: {
    color: '#ffee00',
    fontSize: 15,
    fontWeight: '800',
  },
  goldLabel: {
    color: '#ffee0088',
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    color: '#555588',
    fontSize: 11,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
    letterSpacing: 0.3,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d001e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a0060',
    padding: 14,
    marginBottom: 10,
    gap: 14,
  },
  upgradeCardMaxed: {
    borderColor: '#ffee0040',
    backgroundColor: '#0f0a00',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  upgradeInfo: {
    flex: 1,
    gap: 4,
  },
  upgradeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upgradeName: {
    color: '#e0e0ff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  upgradeDesc: {
    color: '#7070a0',
    fontSize: 11,
    lineHeight: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  progressBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#1a0035',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  levelText: {
    color: '#555588',
    fontSize: 10,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'right',
  },
  buyBtn: {
    alignItems: 'center',
    backgroundColor: '#00f5ff18',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00f5ff55',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 58,
    flexShrink: 0,
  },
  buyBtnDisabled: {
    backgroundColor: '#0d001e',
    borderColor: '#2a0060',
  },
  buyBtnCost: {
    color: '#ffee00',
    fontSize: 13,
    fontWeight: '800',
  },
  buyBtnLabel: {
    color: '#00f5ff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 1,
  },
  maxedBadge: {
    backgroundColor: '#ffee0020',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ffee0060',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  maxedText: {
    color: '#ffee00',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  dangerZone: {
    marginTop: 16,
    backgroundColor: '#ff306010',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ff306035',
    padding: 16,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dangerTitle: {
    color: '#ff306088',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ff306018',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff306040',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resetText: {
    color: '#ff3060',
    fontSize: 14,
    fontWeight: '600',
  },
});
