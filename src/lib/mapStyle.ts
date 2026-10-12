import type { StyleSpecification } from '@maplibre/maplibre-react-native';

type MutableLayer = {
  id?: string;
  type?: string;
  ['source-layer']?: string;
  filter?: unknown;
  paint?: Record<string, unknown>;
};

/** Keeps parks and water distinct while giving the hosted dark map a softer night palette. */
export function customizeDarkMapStyle(style: StyleSpecification): StyleSpecification {
  const layers = (style as unknown as { layers: MutableLayer[] }).layers;

  for (const layer of layers ?? []) {
    const id = (layer.id ?? '').toLowerCase();
    const sourceLayer = (layer['source-layer'] ?? '').toLowerCase();
    const filter = JSON.stringify(layer.filter ?? '').toLowerCase();
    const features = `${id} ${filter}`;

    if (layer.type === 'fill' && (sourceLayer === 'landcover' || sourceLayer === 'landuse')) {
      if (/\b(wood|forest|woodland|nature_reserve)\b/.test(features)) {
        layer.paint = { ...layer.paint, 'fill-color': '#263F34', 'fill-opacity': 0.95 };
      } else if (/\b(park|grass|garden|pitch|meadow|recreation_ground)\b/.test(features)) {
        layer.paint = { ...layer.paint, 'fill-color': '#31513C', 'fill-opacity': 0.95 };
      }
    }

    if (sourceLayer === 'water' && layer.type === 'fill') {
      layer.paint = { ...layer.paint, 'fill-color': '#20394F' };
    } else if (sourceLayer === 'waterway' && layer.type === 'line') {
      layer.paint = { ...layer.paint, 'line-color': '#345B78' };
    }

    if (sourceLayer === 'transportation' && layer.type === 'line' && id.includes('road network')) {
      layer.paint = {
        ...layer.paint,
        'line-color': [
          'match',
          ['get', 'class'],
          ['motorway', 'trunk'],
          '#687990',
          ['primary', 'secondary'],
          '#536276',
          '#3A4657',
        ],
      };
    }
  }

  return style;
}
