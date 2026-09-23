import React, { useEffect, useState } from 'react';
import { MapPinOff, Flame, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { mapApi, categoryApi } from '../../lib/api/endpoints.js';
import MapView from '../../components/map/MapView.jsx';
import MapFilters from '../../components/map/MapFilters.jsx';
import CityDrilldown from '../../components/map/CityDrilldown.jsx';
import Button from '../../components/ui/Button.jsx';

export default function MapViewPage() {
  const [pins, setPins] = useState([]);
  const [heatmapPoints, setHeatmapPoints] = useState(null);
  const [viewMode, setViewMode] = useState('pins');
  const [heatmapMode, setHeatmapMode] = useState('density');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [categories, setCategories] = useState([]);
  const [drilldownCity, setDrilldownCity] = useState(null);
  const [drilldownData, setDrilldownData] = useState(null);

  useEffect(() => {
    categoryApi
      .list({ skipErrorToast: true })
      .then((res) => setCategories(res.data.data || []))
      .catch(() => toast.error('Could not load category colours for the map legend.'));
  }, []);

  useEffect(() => {
    setLoading(true);
    mapApi
      .pins(filters, { skipErrorToast: true })
      .then((res) => setPins(res.data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load map pins.'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    if (viewMode !== 'heatmap') {
      setHeatmapPoints(null);
      return;
    }
    mapApi
      .heatmap(heatmapMode, { skipErrorToast: true })
      .then((res) => setHeatmapPoints(res.data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load the heatmap.'));
  }, [viewMode, heatmapMode]);

  const openCity = async (cityName) => {
    try {
      const res = await mapApi.cityDrilldown(cityName, { skipErrorToast: true });
      setDrilldownCity(cityName);
      setDrilldownData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || `Could not load details for ${cityName}.`);
    }
  };

  const noData = viewMode === 'pins' ? !loading && pins.length === 0 : heatmapPoints?.length === 0;

  const categoryColors = Object.fromEntries(categories.map((c) => [c._id, c.colour]));

  const visibleCategoryIds = new Set(
    pins.map((p) => p.categoryId?._id || p.categoryId).filter(Boolean)
  );
  const legendCategories = categories.filter((c) => visibleCategoryIds.has(c._id));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="text-xl font-bold">Map View</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'pins' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('pins')}
            className="flex items-center gap-1.5"
          >
            <MapPin size={15} /> Pins
          </Button>
          <Button
            variant={viewMode === 'heatmap' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('heatmap')}
            className="flex items-center gap-1.5"
          >
            <Flame size={15} /> Heatmap
          </Button>
        </div>
      </div>

      <MapFilters filters={filters} onChange={setFilters} />

      {viewMode === 'heatmap' && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setHeatmapMode('density')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              heatmapMode === 'density' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Lead Density
          </button>
          <button
            onClick={() => setHeatmapMode('conversion')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              heatmapMode === 'conversion' ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Conversion Density
          </button>
        </div>
      )}

      {viewMode === 'pins' && legendCategories.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap mb-3 text-sm">
          <span className="text-gray-400">Category:</span>
          {legendCategories.map((c) => (
            <span key={c._id} className="flex items-center gap-1.5 text-gray-600">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: c.colour }}
              />
              {c.name}
            </span>
          ))}
        </div>
      )}

      {noData ? (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-gray-500">
          <MapPinOff className="mx-auto mb-3 text-gray-300" size={36} />
          <p className="font-medium">No leads with map coordinates yet</p>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
            Pins come from latitude/longitude captured at import time (Section 5.1's Maps-scraper
            output) or entered on a lead's profile.
          </p>
        </div>
      ) : (
        <MapView
          pins={pins}
          heatmapPoints={viewMode === 'heatmap' ? heatmapPoints : null}
          categoryColors={categoryColors}
        />
      )}

      {viewMode === 'pins' && pins.length > 0 && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {[...new Set(pins.map((p) => p.cityName).filter(Boolean))].map((city) => (
            <button
              key={city}
              onClick={() => openCity(city)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      )}

      {drilldownCity && (
        <CityDrilldown
          cityName={drilldownCity}
          summary={drilldownData?.summary}
          leads={drilldownData?.leads}
          onClose={() => setDrilldownCity(null)}
        />
      )}
    </div>
  );
}