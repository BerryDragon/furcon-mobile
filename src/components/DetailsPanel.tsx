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

      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
          {convention.name}
        </Text>
        <Pressable
          onPress={() => onToggleSave(convention.id)}
          style={[
            styles.saveButton,
            { backgroundColor: saved ? colors.brandSoft : colors.surface, borderColor: colors.brand },
          ]}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved conventions' : 'Save convention'}
        >
          <Text style={[styles.saveLabel, { color: colors.brand }]}>{saved ? 'Saved' : 'Save'}</Text>
        </Pressable>
      </View>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        {convention.city}, {convention.state}
      </Text>

      <View style={styles.actions}>
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

      <Text style={[styles.line, { color: colors.ink }]}>
        {formatDateRange(convention.startDate, convention.endDate)}
      </Text>

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

      <View style={[styles.goingCard, { borderColor: colors.hairline }]}>
        <Text style={[styles.goingTitle, { color: colors.ink }]}>Who's going</Text>
        <Text style={[styles.fine, { color: colors.muted }]}>Friends who mark themselves as going will appear here.</Text>
      </View>

    </BottomSheetScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  back: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { fontSize: 15, fontWeight: '700' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { flex: 1, fontSize: 22, fontWeight: '700' },
  saveButton: { minHeight: 38, minWidth: 66, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  saveLabel: { fontSize: 14, fontWeight: '700' },
  subtitle: { fontSize: 15, marginTop: 2, marginBottom: 10 },
  line: { fontSize: 15, marginTop: 4 },
  card: { marginTop: 14, padding: 14, borderRadius: 14, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cardLine: { fontSize: 15, marginTop: 2 },
  fine: { fontSize: 12, marginTop: 8 },
  goingCard: { marginTop: 18, padding: 14, borderRadius: 14, borderWidth: 1 },
  goingTitle: { fontSize: 16, fontWeight: '700' },
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
