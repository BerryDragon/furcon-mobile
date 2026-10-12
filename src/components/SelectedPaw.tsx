import { Marker } from '@maplibre/maplibre-react-native';
import { useEffect, useMemo } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { useReducedMotion } from '../lib/useReducedMotion';
import type { LatLng } from '../types';

const PAWS = {
  regular: require('../../assets/paw.png'),
  past: require('../../assets/paw-past.png'),
  saved: require('../../assets/paw-saved.png'),
} as const;

type Props = {
  id: number;
  coordinate: LatLng;
  saved: boolean;
  past: boolean;
  onPress: () => void;
};

/** Replaces the selected symbol with a quick, gentle paw wobble. */
export function SelectedPaw({ id, coordinate, saved, past, onPress }: Props) {
  const reduceMotion = useReducedMotion();
  const wobble = useMemo(() => new Animated.Value(0), [id]);
  const scale = useMemo(() => new Animated.Value(reduceMotion ? 1 : 0.82), [id, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      wobble.setValue(0);
      scale.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.sequence([
        Animated.timing(wobble, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: -1, duration: 115, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: 0.55, duration: 95, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: 0, duration: 110, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 125, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, damping: 9, stiffness: 280, useNativeDriver: true }),
      ]),
    ]).start();
  }, [reduceMotion, scale, wobble]);

  const source = saved ? PAWS.saved : past ? PAWS.past : PAWS.regular;
  const rotate = wobble.interpolate({ inputRange: [-1, 1], outputRange: ['-13deg', '13deg'] });

  return (
    <Marker
      id={`selected-paw-${id}`}
      lngLat={[coordinate.longitude, coordinate.latitude]}
      anchor="center"
      onPress={onPress}
    >
      <Animated.View style={[styles.paw, { transform: [{ rotate }, { scale }] }]}>
        <Image source={source} resizeMode="contain" style={StyleSheet.absoluteFill} />
      </Animated.View>
    </Marker>
  );
}

const styles = StyleSheet.create({ paw: { width: 44, height: 44 } });
