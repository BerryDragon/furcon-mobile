import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BAR_HEIGHT } from '../config';
import { useTheme } from '../theme';

export type Panel = 'nearest' | 'saved' | 'popular';

type Props = {
  active: Panel | null;
  savedCount: number;
  onPress: (panel: Panel) => void;
  bottomOffset: number;
};

const TABS: { key: Panel; label: string }[] = [
  { key: 'nearest', label: 'Nearest 10' },
  { key: 'saved', label: 'Saved' },
  { key: 'popular', label: 'Popular' },
];

/** Three big buttons, like the tabs along the bottom of Google Maps. */
export function BottomBar({ active, savedCount, onPress, bottomOffset }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.bar, { bottom: bottomOffset, backgroundColor: colors.surface }]}
      accessibilityRole="tablist"
    >
      {TABS.map(({ key, label }) => {
        const selected = active === key;
        const text = key === 'saved' && savedCount > 0 ? `Saved (${savedCount})` : label;
        return (
          <Pressable
            key={key}
            onPress={() => onPress(key)}
            style={[styles.tab, selected && { backgroundColor: colors.brand }]}
            android_ripple={{ color: colors.brandSoft, borderless: false }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={text}
          >
            <Text
              style={[styles.label, { color: selected ? colors.onBrand : colors.ink }]}
              numberOfLines={1}
            >
              {text}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    flexDirection: 'row',
    padding: 5,
    gap: 4,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  tab: {
    flex: 1,
    borderRadius: (BAR_HEIGHT - 10) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: { fontSize: 15, fontWeight: '700' },
});
