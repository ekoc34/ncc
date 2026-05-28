import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
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

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function CardDivider() {
  return <View style={styles.cardDivider} />;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    ty.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, setMuted, setSfxVolume, setMusicVolume } = useAudioSettings();

  const topPad = Platform.OS === 'web' ? 52 : insets.top;
  const botPad = Platform.OS === 'web' ? 28 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            playSound('button_click');
            router.back();
          }}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <View style={styles.backBtnInner}>
            <Feather name="arrow-left" size={18} color="#8888bb" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerAccent} />
          <Text style={styles.headerTitle}>SETTINGS</Text>
        </View>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>

        <AnimatedSection delay={0}>
          <Text style={styles.sectionTitle}>AUDIO</Text>
          <SectionCard>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIconWrap}>
                  <Feather name={settings.isMuted ? 'volume-x' : 'volume-2'} size={15} color="#7b2fff" />
                </View>
                <Text style={styles.rowLabel}>Mute All</Text>
              </View>
              <Switch
                value={settings.isMuted}
                onValueChange={(v) => {
                  resumeAudio();
                  setMuted(v);
                  if (!v) setTimeout(() => playSound('button_click'), 80);
                }}
                trackColor={{ false: '#1a0035', true: '#7b2fff55' }}
                thumbColor={settings.isMuted ? '#7b2fff' : '#00f5ff'}
              />
            </View>
            <CardDivider />
            <VolumeRow
              label="SFX"
              value={settings.sfxVolume}
              onChange={setSfxVolume}
              disabled={settings.isMuted}
            />
            <CardDivider />
            <VolumeRow
              label="MUSIC"
              value={settings.musicVolume}
              onChange={setMusicVolume}
              disabled={settings.isMuted}
            />
          </SectionCard>
          <Text style={styles.hint}>
            Audio is synthesized — no external downloads required.
          </Text>
        </AnimatedSection>

        <AnimatedSection delay={120}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <SectionCard>
            <InfoRow label="Game" value="Neon Card Corps" />
            <CardDivider />
            <InfoRow label="Edition" value="Corp Edition v1.0" />
            <CardDivider />
            <InfoRow label="Build" value="2026.05.28" />
            <CardDivider />
            <InfoRow label="Genre" value="Roguelike Deckbuilder" />
            <CardDivider />
            <InfoRow label="Platform" value="iOS · Android · Web" />
          </SectionCard>
        </AnimatedSection>

        <AnimatedSection delay={220}>
          <Text style={styles.sectionTitle}>GAMEPLAY TIPS</Text>
          {[
            { icon: 'zap', color: '#ffee00', title: 'Lightning Synergy', text: 'Stack 2+ lightning cards to chain damage all enemies at once.' },
            { icon: 'flame', color: '#ff6030', title: 'Fire + Burn', text: 'Burn stacks deal 1 damage per turn. Fire synergy doubles burn to 2.' },
            { icon: 'wind', color: '#80e8ff', title: 'Ice Freeze', text: 'Frozen enemies skip their attack. Ice synergy amplifies damage to frozen foes.' },
            { icon: 'cpu', color: '#00ff88', title: 'Tech Overclock', text: 'Overclock lets you play your most expensive card for free.' },
            { icon: 'moon', color: '#aa60ff', title: 'Void Drain', text: 'Void cards heal on hit. Void synergy lets them bypass enemy armor.' },
            { icon: 'alert-octagon', color: '#ff3060', title: 'NEXUS-7 Boss', text: 'The boss enrages on turn 3. Build shield and burn before that happens.' },
          ].map(({ icon, color, title, text }) => (
            <View key={title} style={styles.tipCard}>
              <View style={[styles.tipIcon, { backgroundColor: color + '20', borderColor: color + '50' }]}>
                <Feather name={icon as any} size={14} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>{title}</Text>
                <Text style={styles.tipText}>{text}</Text>
              </View>
            </View>
          ))}
        </AnimatedSection>

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
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  steps: {
    flexDirection: 'row',
    gap: 6,
  },
  step: {
    backgroundColor: '#120028',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a0060',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  stepActive: {
    backgroundColor: '#7b2fff22',
    borderColor: '#7b2fff',
  },
  stepDisabled: {
    opacity: 0.3,
  },
  stepText: {
    color: '#555588',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
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
    backgroundColor: '#00f5ff',
  },
  headerTitle: {
    color: '#e0e0ff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 18,
    paddingBottom: 40,
    gap: 6,
  },
  sectionTitle: {
    color: '#444477',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 8,
    marginTop: 16,
    paddingLeft: 2,
  },
  card: {
    backgroundColor: '#0d001e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a0060',
    overflow: 'hidden',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#1a0035',
    marginHorizontal: 14,
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
    gap: 10,
  },
  rowIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#7b2fff20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    color: '#9090b8',
    fontSize: 13,
    fontWeight: '500',
  },
  rowValue: {
    color: '#d0d0f0',
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    color: '#333355',
    fontSize: 10,
    marginTop: 8,
    lineHeight: 15,
    paddingHorizontal: 4,
    letterSpacing: 0.2,
  },
  tipCard: {
    backgroundColor: '#0d001e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a0060',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  tipTitle: {
    color: '#c0c0e0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  tipText: {
    color: '#707098',
    fontSize: 11,
    lineHeight: 17,
  },
});
