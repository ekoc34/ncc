import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMeta } from '@/context/MetaContext';
import { playSound, resumeAudio } from '@/game/audio';

export default function MainMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meta, isLoaded } = useMeta();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const startRun = () => {
    resumeAudio();
    playSound('button_primary');
    router.push({
      pathname: '/run',
      params: { upgrades: JSON.stringify(meta.upgrades) },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: topPad + 20, paddingBottom: botPad + 20 }]}>
      {/* Logo */}
      <View style={styles.logoBlock}>
        <View style={styles.logoAccent} />
        <Text style={styles.logoSub}>// CORP EDITION v1.0</Text>
        <Text style={styles.logoTitle}>NEON</Text>
        <Text style={styles.logoTitle2}>CARD CORPS</Text>
        <Text style={styles.tagline}>CYBERPUNK ROGUELIKE DECKBUILDER</Text>
        <View style={styles.logoDivider} />
      </View>

      {/* Stats */}
      {isLoaded && (
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{meta.totalRuns}</Text>
            <Text style={styles.statLabel}>RUNS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{meta.totalWins}</Text>
            <Text style={styles.statLabel}>WINS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: '#ffee00' }]}>{meta.totalGold}</Text>
            <Text style={styles.statLabel}>GOLD</Text>
          </View>
        </View>
      )}

      {/* Main buttons */}
      <View style={styles.btnGroup}>
        <TouchableOpacity style={styles.startBtn} onPress={startRun}>
          <View style={styles.startBtnInner}>
            <Feather name="play" size={22} color="#07000f" />
            <Text style={styles.startBtnText}>START RUN</Text>
          </View>
          <View style={styles.startBtnGlow} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => { playSound('button_click'); router.push('/upgrade'); }}
        >
          <Feather name="trending-up" size={18} color="#7b2fff" />
          <Text style={styles.secondaryBtnText}>UPGRADES</Text>
          {isLoaded && meta.totalGold > 0 && (
            <View style={styles.goldBadge}>
              <Text style={styles.goldBadgeText}>{meta.totalGold} G</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => { playSound('button_click'); router.push('/settings'); }}
        >
          <Feather name="settings" size={18} color="#7b2fff" />
          <Text style={styles.secondaryBtnText}>SETTINGS</Text>
        </TouchableOpacity>
      </View>

      {/* How to play */}
      <View style={styles.howTo}>
        <Text style={styles.howToTitle}>HOW TO PLAY</Text>
        <Text style={styles.howToText}>
          Play cards to defeat enemy waves. Choose new cards after each wave.{'\n'}
          Beat 3 waves + the boss to win. Spend gold on permanent upgrades.
        </Text>
      </View>

      {/* Bottom decoration */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>SINGLE PLAYER · ROGUELIKE · DECKBUILDER</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07000f',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoBlock: {
    alignItems: 'flex-start',
  },
  logoAccent: {
    width: 40,
    height: 3,
    backgroundColor: '#00f5ff',
    marginBottom: 12,
    borderRadius: 2,
  },
  logoSub: {
    color: '#8888bb',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 4,
  },
  logoTitle: {
    color: '#00f5ff',
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: 8,
    lineHeight: 56,
    textShadowColor: '#00f5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoTitle2: {
    color: '#e0e0ff',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 4,
    lineHeight: 40,
    marginBottom: 8,
  },
  tagline: {
    color: '#7b2fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 3,
  },
  logoDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#2a0060',
    marginTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#120028',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a0060',
    paddingVertical: 12,
  },
  statBlock: {
    alignItems: 'center',
  },
  statValue: {
    color: '#00f5ff',
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: '#6060a0',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a0060',
  },
  btnGroup: {
    gap: 10,
  },
  startBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  startBtnInner: {
    backgroundColor: '#00f5ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
    borderRadius: 12,
  },
  startBtnGlow: {
    position: 'absolute',
    inset: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00f5ff',
    opacity: 0.3,
  },
  startBtnText: {
    color: '#07000f',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120028',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a0060',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  secondaryBtnText: {
    color: '#e0e0ff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    flex: 1,
  },
  goldBadge: {
    backgroundColor: '#ffee0033',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#ffee00',
  },
  goldBadgeText: {
    color: '#ffee00',
    fontSize: 11,
    fontWeight: '700',
  },
  howTo: {
    backgroundColor: '#120028',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a0060',
    padding: 14,
  },
  howToTitle: {
    color: '#6060a0',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  howToText: {
    color: '#8888bb',
    fontSize: 12,
    lineHeight: 18,
  },
  bottomBar: {
    alignItems: 'center',
  },
  bottomText: {
    color: '#2a0060',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '600',
  },
});
