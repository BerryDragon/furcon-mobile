import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { eventStatus, formatDateRange } from '../lib/dates';
import { useTheme } from '../theme';
import type { Convention } from '../types';

export const ROW_HEIGHT = 72;

type Props = {
  convention: Convention;
  /** Position badge: 1-10 for nearest, rank for popular. Omitted for saved. */
  badge?: number;
  miles?: number;
  saved: boolean;
  onPress: (convention: Convention) => void;
  onToggleSave: (id: number) => void;
};

function Row({ convention, badge, miles, saved, onPress, onToggleSave }: Props) {
  const { colors } = useTheme();
  const past = eventStatus(convention.endDate) === 'past';
  const bits = [
    `${convention.city}, ${convention.state}`,
    formatDateRange(convention.startDate, convention.endDate),
  ];
  if (miles !== undefined) bits.push(`${Math.round(miles).toLocaleString('en-US')} mi`);

  return (
    <View style={[styles.row, { borderBottomColor: colors.hairline }]}>
      <Pressable
        onPress={() => onPress(convention)}
        style={styles.main}
        android_ripple={{ color: colors.brandSoft }}
        accessibilityRole="button"
        accessibilityLabel={`${convention.name}. ${bits.join('. ')}`}
      >
        {badge !== undefined && (
          <View style={[styles.badge, { backgroundColor: past ? colors.hairline : colors.brandSoft }]}>
            <Text style={[styles.badgeText, { color: colors.ink }]}>{badge}</Text>
          </View>
        )}
        <View style={styles.text}>
          <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
            {convention.name}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>
            {bits.join(' · ')}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={() => onToggleSave(convention.id)}
        style={[
          styles.save,
          saved ? { backgroundColor: colors.brand } : { borderColor: colors.brand, borderWidth: 1.5 },
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: saved }}
        accessibilityLabel={saved ? `Remove ${convention.name} from saved` : `Save ${convention.name}`}
      >
        <Text style={[styles.saveText, { color: saved ? colors.onBrand : colors.brand }]}>
          {saved ? 'Saved' : 'Save'}
        </Text>
      </Pressable>
    </View>
  );
}

export const ConventionRow = memo(Row);

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  main: { flex: 1, height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingLeft: 20 },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeText: { fontSize: 13, fontWeight: '700' },
  text: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, marginTop: 2 },
  save: {
    minWidth: 64,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  saveText: { fontSize: 14, fontWeight: '700' },
});
