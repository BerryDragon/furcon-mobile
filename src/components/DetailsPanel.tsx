import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { eventStatus, formatDateRange } from '../lib/dates';
import { estimateTravel } from '../lib/travel';
import { useTheme } from '../theme';
import type { Convention } from '../types';

type Props = {
  convention: Convention;
  /** null until the user shares their location. */
  distanceMiles: number | null;
  saved: boolean;
  onToggleSave: (id: number) => void;
  /** Set when the user arrived from a list; shows a way back. */
  backLabel: string | null;
  onBack: () => void;
};

function Action({ label, onPress, solid = true }: { label: string; onPress: () => void; solid?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.brandSoft }}
      style={[
        styles.button,
        solid ? { backgroundColor: colors.brand } : { borderColor: colors.brand, borderWidth: 1.5 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.buttonLabel, { color: solid ? colors.onBrand : colors.brand }]}>{label}</Text>
    </Pressable>
  );
}

const money = (n: number) => `$${n.toLocaleString('en-US')}`;
const open = (url: string) => {
  Linking.openURL(url).catch(() => {});
};

export function DetailsPanel({ convention, distanceMiles, saved, onToggleSave, backLabel, onBack }: Props) {
  const { colors } = useTheme();
  const past = eventStatus(convention.endDate) === 'past';
  const travel = distanceMiles === null ? null : estimateTravel(distanceMiles);

  // Past events have no real dates to search, so search by place only.
  const flightQuery = past
    ? `Flights to ${convention.city}, ${convention.state}`
    : `Flights to ${convention.city}, ${convention.state} on ${convention.startDate}`;

  return (
    <BottomSheetScrollView contentContainerStyle={styles.content}>
      {backLabel && (
        <Pressable
          onPress={onBack}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel={`Back to ${backLabel}`}
        >
          <Text style={[styles.backText, { color: colors.brand }]}>Back to {backLabel}</Text>
        </Pressable>
      )}

      <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
        {convention.name}
      </Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        {convention.city}, {convention.state}
      </Text>

      <Text style={[styles.line, { color: colors.ink }]}>
        {formatDateRange(convention.startDate, convention.endDate)}
      </Text>
      {past && (
        <View style={[styles.warn, { backgroundColor: colors.warnBg }]} accessibilityRole="alert">
          <Text style={[styles.warnText, { color: colors.warnInk }]}>
            Dates are from the original dataset and haven't been updated for this year yet.
          </Text>
        </View>
      )}

      <Text style={[styles.line, { color: colors.ink }]}>
        {distanceMiles === null
          ? 'Tap the target button on the map to see distance'
          : `${Math.round(distanceMiles).toLocaleString('en-US')} miles away`}
      </Text>
      {convention.lastYearAttendance !== null && (
        <Text style={[styles.line, { color: colors.ink }]}>
          {convention.lastYearAttendance.toLocaleString('en-US')} attendees last year
        </Text>
      )}

      {travel && (
        <View style={[styles.card, { borderColor: colors.hairline }]}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>Rough travel estimate</Text>
          {travel.driveCost !== null && (
            <Text style={[styles.cardLine, { color: colors.ink }]}>Driving ≈ {money(travel.driveCost)}</Text>
          )}
          {travel.flightCost !== null && (
            <Text style={[styles.cardLine, { color: colors.ink }]}>Flight ≈ {money(travel.flightCost)}</Text>
          )}
          {travel.mode === 'long-haul' && (
            <Text style={[styles.cardLine, { color: colors.ink }]}>
              Too far to estimate. Use Flights for real prices.
            </Text>
          )}
          <Text style={[styles.fine, { color: colors.muted }]}>Estimates only. Real prices vary.</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Action
          label={saved ? 'Saved' : 'Save'}
          solid={saved}
          onPress={() => onToggleSave(convention.id)}
        />
        <Action
          label="Directions"
          onPress={() =>
            open(
              `https://www.google.com/maps/dir/?api=1&destination=${convention.latitude},${convention.longitude}`,
            )
          }
        />
        <Action
          label="Flights"
          onPress={() =>
            open(`https://www.google.com/travel/flights?q=${encodeURIComponent(flightQuery)}`)
          }
        />
        {convention.websiteUrl && (
          <Action label="Website" onPress={() => open(convention.websiteUrl as string)} />
        )}
      </View>
    </BottomSheetScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  back: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { fontSize: 15, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 15, marginTop: 2, marginBottom: 10 },
  line: { fontSize: 15, marginTop: 4 },
  warn: { borderRadius: 10, padding: 10, marginTop: 8 },
  warnText: { fontSize: 13 },
  card: { marginTop: 14, padding: 14, borderRadius: 14, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cardLine: { fontSize: 15, marginTop: 2 },
  fine: { fontSize: 12, marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  button: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { fontSize: 15, fontWeight: '700' },
});
