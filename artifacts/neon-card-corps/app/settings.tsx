import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAudioSettings } from '@/hooks/useAudioSettings';
import { playSound, resumeAudio } from '@/game/audio';

const VOL_STEPS = [
  { label: 'OFF', value: 0 },
  { label: 'LOW', value: 0.4 },
  { label: 'HIGH', value: 1.0 },
];

function nearestStep(v: number): number {
  return VOL_STEPS.reduce((best, s) =>
    Math.abs(s.value - v) < Math.abs(best.value - v) ? s : best,
  VOL_STEPS[0]).value;
}

function VolumeRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  const current = nearestStep(value);
  return (
    <View style={volStyles.row}>
      <Text style={volStyles.label}>{label}</Text>
      <View style={volStyles.steps}>
        {VOL_STEPS.map((s) => {
          const active = !disabled && current === s.value;
          return (
            <TouchableOpacity
              key={s.label}
              style={[volStyles.step, active && volStyles.stepActive, disabled && volStyles.stepDisabled]}
              onPress={() => {
                resumeAudio();
                playSound('button_click');
                onChange(s.value);
              }}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text style={[volStyles.stepText, active && volStyles.stepTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, setMuted, setSfxVolume, setMusicVolume } = useAudioSettings();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            playSound('button_click');
            router.back();
          }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color="#8888bb" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>

        {/* ── AUDIO ────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AUDIO</Text>
          <View style={styles.card}>

            {/* Mute all */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Feather name={settings.isMuted ? 'volume-x' : 'volume-2'} size={16} color="#8888bb" />
                <Text style={[styles.rowLabel, { marginLeft: 8 }]}>Mute All</Text>
              </View>
              <Switch
                value={settings.isMuted}
                onValueChange={(v) => {
                  resumeAudio();
                  setMuted(v);
                  if (!v) setTimeout(() => playSound('button_click'), 80);
                }}
                trackColor={{ false: '#2a0060', true: '#7b2fff' }}
                thumbColor={settings.isMuted ? '#e0e0ff' : '#00f5ff'}
              />
            </View>

            <View style={styles.divider} />

            {/* SFX volume */}
            <VolumeRow
              label="SFX"
              value={settings.sfxVolume}
              onChange={setSfxVolume}
              disabled={settings.isMuted}
            />

            <View style={styles.divider} />

            {/* Music volume */}
            <VolumeRow
              label="MUSIC"
              value={settings.musicVolume}
              onChange={setMusicVolume}
              disabled={settings.isMuted}
            />

          </View>

          <Text style={styles.audioHint}>
            Audio is synthesized — no downloads required. Works in browser only on iOS/Android native builds.
          </Text>
        </View>

        {/* ── ABOUT ────────────────────────────────────────── */}
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

        {/* ── GAMEPLAY TIPS ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GAMEPLAY TIPS</Text>
          {[
            ['⚡ Lightning Synergy', 'Stack 2+ lightning cards to deal chain damage to all enemies at once.'],
            ['🔥 Fire + Burn', 'Burn stacks deal 1 damage per turn. Fire synergy doubles it to 2.'],
            ['❄ Ice Freeze', 'Frozen enemies skip their attack. Ice synergy amplifies damage to frozen foes.'],
            ['⚙ Tech Overclock', 'Use Overclock to play your most expensive card for free.'],
            ['🌑 Void Drain', 'Void cards heal you on hit. Void synergy lets them bypass enemy armor.'],
            ['👾 NEXUS-7 Boss', 'The boss enrages on turn 3. Build up shield and burn before that happens.'],
          ].map(([title, text]) => (
            <View key={title} style={styles.tipCard}>
              <Text style={styles.tipTitle}>{title}</Text>
              <Text style={styles.tipText}>{text}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const volStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: '#8888bb',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  steps: {
    flexDirection: 'row',
    gap: 6,
  },
  step: {
    backgroundColor: '#1a0038',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a0060',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepActive: {
    backgroundColor: '#7b2fff22',
    borderColor: '#7b2fff',
  },
  stepDisabled: {
    opacity: 0.35,
  },
  stepText: {
    color: '#6060a0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  stepTextActive: {
    color: '#e0e0ff',
  },
});

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
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  audioHint: {
    color: '#404060',
    fontSize: 10,
    marginTop: 8,
    lineHeight: 15,
    paddingHorizontal: 4,
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
