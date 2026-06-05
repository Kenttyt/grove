import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export interface HeatmapData {
  healthy: [number, number, number][];
  at_risk: [number, number, number][];
  dead:    [number, number, number][];
}

interface HeatmapLayerProps {
  data: HeatmapData;
}

// Shared options for every layer
const BASE_OPTIONS = {
  radius:  28,
  blur:    18,
  maxZoom: 18,
  max:     1.0,
  minOpacity: 0.35,
};

// Each tier has its own single-colour gradient so the map accurately
// shows which areas are healthy (green), struggling (amber) or lost (red).
const LAYERS: {
  key: keyof HeatmapData;
  gradient: Record<number, string>;
}[] = [
  {
    key: 'healthy',
    gradient: {
      0.0: 'rgba(34,197,94,0)',     // transparent
      0.3: 'rgba(34,197,94,0.4)',   // light green
      0.6: 'rgba(22,163,74,0.75)',  // medium green
      1.0: '#15803d',               // deep green
    },
  },
  {
    key: 'at_risk',
    gradient: {
      0.0: 'rgba(234,179,8,0)',
      0.3: 'rgba(234,179,8,0.4)',
      0.6: 'rgba(202,138,4,0.75)',
      1.0: '#b45309',               // amber-brown
    },
  },
  {
    key: 'dead',
    gradient: {
      0.0: 'rgba(239,68,68,0)',
      0.3: 'rgba(239,68,68,0.4)',
      0.6: 'rgba(220,38,38,0.75)',
      1.0: '#991b1b',               // deep red
    },
  },
];

export function HeatmapLayer({ data }: HeatmapLayerProps) {
  const map = useMap();
  // Keep refs so we can remove the old layers on re-render
  const layerRefs = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!map) return;

    // Remove previous layers
    layerRefs.current.forEach((l) => map.removeLayer(l));
    layerRefs.current = [];

    LAYERS.forEach(({ key, gradient }) => {
      const points = data[key];
      if (!points || points.length === 0) return;

      const heat = (L as any).heatLayer(points, {
        ...BASE_OPTIONS,
        gradient,
      });

      heat.addTo(map);
      layerRefs.current.push(heat);
    });

    return () => {
      layerRefs.current.forEach((l) => {
        if (map) map.removeLayer(l);
      });
      layerRefs.current = [];
    };
  }, [map, data]);

  return null;
}
