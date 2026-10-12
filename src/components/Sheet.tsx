import BottomSheet from '@gorhom/bottom-sheet';
import { type ReactNode, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { SHEET_SNAPS } from '../config';
import { useTheme } from '../theme';

export type SheetMode = 'details' | 'list' | null;

type Props = {
  mode: SheetMode;
  /** Keep the nearest-results panel compact so its map routes remain visible. */
  listSnap?: 'peek' | 'list';
  /** Keeps the sheet above the floating bottom bar. */
  bottomInset: number;
  /** Called only when the USER dismisses the sheet (drag down). */
  onDismiss: () => void;
  children: ReactNode;
};

const PEEK = 0;
const LIST = 1;

/**
 * One sheet that shows either a convention's details or a list. Opens to the peek height for
 * details and the middle height for lists; if it's already open (even fully expanded) it keeps the
 * height the user chose.
 */
export function Sheet({ mode, listSnap = 'list', bottomInset, onDismiss, children }: Props) {
  const { colors } = useTheme();
  const ref = useRef<BottomSheet>(null);
  const index = useRef(-1);
  const modeRef = useRef<SheetMode>(mode);
  const frame = useRef<number | null>(null);
  const snapPoints = useMemo(() => [...SHEET_SNAPS], []);

  useEffect(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    modeRef.current = mode;
    if (mode === null) {
      ref.current?.close();
      return;
    }
    // Let the native sheet finish its current layout before the first imperative snap. This
    // avoids losing a quick map-pin selection while the screen is opening.
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const wasClosed = index.current < 0;
      const target = mode === 'list'
        ? (listSnap === 'peek'
          ? (wasClosed || index.current === LIST ? PEEK : index.current)
          : (wasClosed || index.current === PEEK ? LIST : index.current))
        : wasClosed ? PEEK : index.current;
      ref.current?.snapToIndex(target);
    });
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [mode, listSnap]);

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      bottomInset={bottomInset}
      enablePanDownToClose
      onChange={(i: number) => {
        index.current = i;
      }}
      onClose={() => {
        index.current = -1;
        // Ignore the close we triggered ourselves (mode already null).
        if (modeRef.current !== null) onDismiss();
      }}
      backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 24 }}
      handleIndicatorStyle={[styles.handle, { backgroundColor: colors.hairline }]}
    >
      {children}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  handle: { width: 44 },
});
