import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme';
import { formatDateRange } from '../lib/dates';
import type { Convention } from '../types';

type Props = {
  query: string;
  onChangeQuery: (query: string) => void;
  results: Convention[];
  onSelect: (convention: Convention) => void;
};

const ROW_HEIGHT = 56;

export function SearchBar({ query, onChangeQuery, results, onSelect }: Props) {
  const { colors } = useTheme();
  const showResults = query.trim().length > 0;

  return (
    <View style={styles.wrap}>
      <View style={[styles.field, { backgroundColor: colors.surface }]}>
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Search conventions, cities, states"
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.ink }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={() => results[0] && onSelect(results[0])}
          accessibilityLabel="Search conventions by name, city, or state"
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => onChangeQuery('')}
            style={styles.clear}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Text style={[styles.clearGlyph, { color: colors.muted }]}>×</Text>
          </Pressable>
        )}
      </View>

      {showResults && (
        <View style={[styles.results, { backgroundColor: colors.surface }]}>
          {results.length === 0 ? (
            <View style={[styles.row, { borderBottomColor: colors.hairline }]}>
              <Text style={[styles.meta, { color: colors.muted }]}>No matches</Text>
            </View>
          ) : (
            results.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => onSelect(c)}
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: colors.hairline },
                  pressed && { backgroundColor: colors.brandSoft },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${c.name}, ${c.city}, ${c.state}`}
              >
                <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>
                  {c.city}, {c.state} · {formatDateRange(c.startDate, c.endDate)}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 10 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 26,
    paddingLeft: 18,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
  clear: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  clearGlyph: { fontSize: 28, lineHeight: 30 },
  results: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  row: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, marginTop: 2 },
});
