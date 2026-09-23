import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

const STATUS_COLORS = {
  New: 'gray',
  Interested: 'blue',
  Converted: 'green',
  Lost: 'red',
};

const FALLBACK_CATEGORY_COLOR = '#6B7280'; // gray-500, used when a lead has no category or the category was deleted

/**
 * Renders a Leaflet.heat density layer. Section 5.6: "Heatmap mode toggle
 * for lead density or conversion density per city." The endpoint and data
 * already existed on the backend; this is what actually draws it.
 */
function HeatLayer({ points }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (points?.length) {
      layerRef.current = L.heatLayer(
        points.map((p) => [p.lat, p.lng, 0.6]),
        { radius: 25, blur: 20, maxZoom: 12 }
      ).addTo(map);
    }
    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [map, points]);

  return null;
}

// Builds a small colored circle marker (a divIcon, not an image) so each
// pin can be tinted per-category without needing a set of pre-made marker
// image assets for every possible category color.
function buildCategoryIcon(colour) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 20px; height: 20px;
        background: ${colour};
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -20],
  });
}

/**
 * `categoryColors` is a map of categoryId -> hex colour (from
 * Category.colour), built once in MapViewPage from categoryApi.list() and
 * passed down here so pins can be tinted by category (Section: category
 * colour was set on the Category model but never actually used anywhere -
 * this is where it's used).
 */
export default function MapView({
  pins = [],
  heatmapPoints = null,
  categoryColors = {},
  center = [22.9734, 78.6569],
  zoom = 5,
}) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '500px', width: '100%' }} className="rounded-xl">
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {heatmapPoints ? (
        <HeatLayer points={heatmapPoints} />
      ) : (
        pins.map((pin) => {
          const categoryId = pin.categoryId?._id || pin.categoryId;
          const colour = categoryColors[categoryId] || FALLBACK_CATEGORY_COLOR;
          return (
            <Marker key={pin._id} position={[pin.lat, pin.lng]} icon={buildCategoryIcon(colour)}>
              <Popup>
                <strong>{pin.businessName}</strong>
                <br />
                {pin.cityName}
                <br />
                Status: <span style={{ color: STATUS_COLORS[pin.status] || 'gray' }}>{pin.status}</span>
                {pin.categoryId?.name && (
                  <>
                    <br />
                    Category:{' '}
                    <span style={{ color: colour, fontWeight: 600 }}>{pin.categoryId.name}</span>
                  </>
                )}
              </Popup>
            </Marker>
          );
        })
      )}
    </MapContainer>
  );
}
