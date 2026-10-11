import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Ranked } from '../lib/nearest';
import { useTheme } from '../theme';
import type { Convention } from '../types';
import type { Panel } from './BottomBar';
import { ConventionRow, ROW_HEIGHT } from './ConventionRow';

export type ListItem = { convention: Convention; badge?: number; miles?: number };

type Props = {
  panel: Panel;
  items: ListItem[];
  savedSet: Set<number>;
  onSelect: (convention: Convention) => void;
  onToggleSave: (id: number) => void;
};

const TITLES: Record<Panel, string> = {
  nearest: 'Nearest 10',
  saved: 'Saved',
  popular: 'Popular',
};

const SUBTITLES: Record<Panel, string> = {
  nearest: 'The dotted lines on the map point to each one.',
  saved: 'Conventions you saved. They stay on this phone.',
  popular: 'All 100, ranked by popularity.',
};

const EMPTY: Record<Panel, string> = {
  nearest: 'Allow location to see the conventions closest to you.',
  saved: 'Tap Save on any convention and it will show up here.',
  popular: 'Nothing to show.',
};

export function ListPanel({ panel, items, savedSet, onSelect, onToggleSave }: Props) {
  const { colors } = useTheme();

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => (
      <ConventionRow
        convention={item.convention}
        badge={item.badge}
        miles={item.miles}
        saved={savedSet.has(item.convention.id)}
        onPress={onSelect}
        onToggleSave={onToggleSave}
      />
    ),
    [savedSet, onSelect, onToggleSave],
  );

  return (
    <BottomSheetFlatList
      data={items}
      keyExtractor={(item: ListItem) => String(item.convention.id)}
      renderItem={renderItem}
      getItemLayout={(_data: unknown, index: number) => ({
        length: ROW_HEIGHT,
        offset: ROW_HEIGHT * index,
        index,
      })}
      initialNumToRender={10}
      extraData={savedSet}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
            {panel === 'saved' ? `Saved (${items.length})` : TITLES[panel]}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{SUBTITLES[panel]}</Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={[styles.empty, { color: colors.muted }]}>{EMPTY[panel]}</Text>
      }
    />
  );
}

export function toListItems(ranked: Ranked[], numbered: boolean): ListItem[] {
  return ranked.map(({ convention, miles }, i) => ({
    convention,
    miles,
    badge: numbered ? i + 1 : undefined,
  }));
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 2 },
  empty: { fontSize: 15, paddingHorizontal: 20, paddingTop: 20 },
});
