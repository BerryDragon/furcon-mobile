import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useReducedMotion } from '../lib/useReducedMotion';
import { useTheme } from '../theme';

export function ThemeToggle() {
  const { scheme, colors, toggleTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const next = scheme === 'dark' ? 'light' : 'dark';
  const progress = useRef(new Animated.Value(scheme === 'dark' ? 1 : 0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    progress.stopAnimation();
    if (reduceMotion) {
      progress.setValue(scheme === 'dark' ? 1 : 0);
      return;
    }
    Animated.timing(progress, {
      toValue: scheme === 'dark' ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [scheme, progress, reduceMotion]);

  const moonOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const sunOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const moonRotation = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '32deg'] });
  const sunRotation = progress.interpolate({ inputRange: [0, 1], outputRange: ['-32deg', '0deg'] });

  return (
    <Animated.View style={{ transform: [{ scale: pressScale }] }}>
      <Pressable
        onPress={toggleTheme}
        onPressIn={() => !reduceMotion && Animated.spring(pressScale, { toValue: 0.94, damping: 18, stiffness: 260, useNativeDriver: true }).start()}
        onPressOut={() => !reduceMotion && Animated.spring(pressScale, { toValue: 1, damping: 16, stiffness: 220, useNativeDriver: true }).start()}
        style={[styles.button, { backgroundColor: colors.surface }]}
        android_ripple={{ color: colors.brandSoft, borderless: true }}
        accessibilityRole="switch"
        accessibilityLabel="Dark mode"
        accessibilityHint={`Switch to ${next} mode`}
        accessibilityState={{ checked: scheme === 'dark' }}
      >
        <Animated.Text
          style={[
            styles.icon,
            styles.stackedIcon,
            { color: colors.brand, opacity: moonOpacity, transform: [{ rotate: moonRotation }, { scale: moonOpacity }] },
          ]}
        >
          ☾
        </Animated.Text>
        <Animated.Text
          style={[
            styles.icon,
            styles.stackedIcon,
            { color: colors.brand, opacity: sunOpacity, transform: [{ rotate: sunRotation }, { scale: sunOpacity }] },
          ]}
        >
          ☀
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  icon: { fontSize: 27, lineHeight: 31 },
  stackedIcon: { position: 'absolute' },
});
