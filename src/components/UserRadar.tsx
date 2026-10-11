import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../lib/useReducedMotion';
import { useTheme } from '../theme';

const SIZE = 96;
const PINGS = 3;
const DURATION = 1700;

/**
 * The blue "you are here" dot with a radar ping: two rings expand and fade, three times, then the
 * dot rests inside a faint halo. Runs on the UI thread, so it never touches React or the map.
 * `pingKey` changes each time the user taps the locate button, which replays the animation.
 */
export function UserRadar({ pingKey }: { pingKey: number }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const a = useSharedValue(0);
  const b = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(a);
    cancelAnimation(b);
    a.value = 0;
    b.value = 0;
    if (reduceMotion) return;
    const ping = withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) });
    a.value = withRepeat(ping, PINGS, false);
    b.value = withDelay(DURATION / 2, withRepeat(ping, PINGS, false));
  }, [pingKey, reduceMotion, a, b]);

  const ringA = useAnimatedStyle(() => ({
    opacity: a.value === 0 ? 0 : 0.55 * (1 - a.value),
    transform: [{ scale: 0.2 + 0.8 * a.value }],
  }));
  const ringB = useAnimatedStyle(() => ({
    opacity: b.value === 0 ? 0 : 0.55 * (1 - b.value),
    transform: [{ scale: 0.2 + 0.8 * b.value }],
  }));

  const ring = { borderColor: colors.me, backgroundColor: 'rgba(37, 99, 235, 0.18)' };

  return (
    <View style={styles.box} pointerEvents="none">
      <View style={[styles.halo, { backgroundColor: 'rgba(37, 99, 235, 0.14)' }]} />
      <Animated.View style={[styles.ring, ring, ringA]} />
      <Animated.View style={[styles.ring, ring, ringB]} />
      <View style={[styles.dot, { backgroundColor: colors.me }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 34, height: 34, borderRadius: 17 },
  ring: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 2 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: '#FFFFFF' },
});
