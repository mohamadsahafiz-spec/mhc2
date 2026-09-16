import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Navigation,
  Info,
  Maximize2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Plant, Customer } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ServiceCoverageMapProps {
  assignedPlants: Plant[];
  allPlants: Plant[];
  userTimezone?: string;
  onSelectPlant?: (plantId: string) => void;
  isAuthorizedAdmin?: boolean;
  onManageCoverageClick?: () => void;
}

interface ResolvedLocationPoint {
  id: string;
  plantId: string;
  customerName: string;
  plantName: string;
  locationString: string;
  cityName: string;
  countryName: string;
  lat: number;
  lng: number;
  isAssigned: boolean;
  timezone?: string;
  linesCount?: number;
  machinesCount?: number;
}

// Canonical real-world approximate geographic coordinates for semiconductor manufacturing hubs / customer sites
// STRICT DATA INTEGRITY: These represent approximate city/region centers, NOT private facility coordinates.
const KNOWN_REGION_COORDINATES: Record<string, { lat: number; lng: number; city: string; country: string }> = {
  // Malaysia
  'kulim': { lat: 5.3713, lng: 100.5560, city: 'Kulim, Kedah', country: 'Malaysia' },
  'kedah': { lat: 5.3713, lng: 100.5560, city: 'Kulim, Kedah', country: 'Malaysia' },
  'penang': { lat: 5.2945, lng: 100.2762, city: 'Bayan Lepas, Penang', country: 'Malaysia' },
  'bayan lepas': { lat: 5.2945, lng: 100.2762, city: 'Bayan Lepas, Penang', country: 'Malaysia' },
  'malaysia': { lat: 4.2105, lng: 101.9758, city: 'Peninsular Malaysia', country: 'Malaysia' },
  
  // Singapore
  'singapore': { lat: 1.3521, lng: 103.8198, city: 'Singapore', country: 'Singapore' },
  'woodlands': { lat: 1.4382, lng: 103.7891, city: 'Woodlands', country: 'Singapore' },
  'tampines': { lat: 1.3541, lng: 103.9452, city: 'Tampines Cleanroom Hub', country: 'Singapore' },

  // Taiwan
  'hsinchu': { lat: 24.7800, lng: 120.9930, city: 'Hsinchu Science Park', country: 'Taiwan' },
  'taichung': { lat: 24.1627, lng: 120.6473, city: 'Central Taiwan Science Park', country: 'Taiwan' },
  'tainan': { lat: 23.1090, lng: 120.2730, city: 'Southern Taiwan Science Park', country: 'Taiwan' },
  'taipei': { lat: 25.0330, lng: 121.5654, city: 'Taipei', country: 'Taiwan' },
  'taiwan': { lat: 23.6978, lng: 120.9605, city: 'Taiwan Region', country: 'Taiwan' },

  // South Korea
  'seoul': { lat: 37.5665, lng: 126.9780, city: 'Seoul Metro', country: 'South Korea' },
  'anyang': { lat: 37.3943, lng: 126.9568, city: 'Anyang EO HQ', country: 'South Korea' },
  'hwaseong': { lat: 37.1995, lng: 127.0784, city: 'Hwaseong Semiconductor Campus', country: 'South Korea' },
  'pyeongtaek': { lat: 37.0427, lng: 127.0543, city: 'Pyeongtaek Campus', country: 'South Korea' },
  'icheon': { lat: 37.2723, lng: 127.4350, city: 'Icheon Memory Hub', country: 'South Korea' },
  'korea': { lat: 37.0000, lng: 127.5000, city: 'South Korea', country: 'South Korea' },

  // Japan
  'tokyo': { lat: 35.6762, lng: 139.6503, city: 'Tokyo Metro', country: 'Japan' },
  'kumamoto': { lat: 32.8031, lng: 130.7079, city: 'Kumamoto Silicon Island', country: 'Japan' },
  'hiroshima': { lat: 34.3853, lng: 132.4553, city: 'Hiroshima Hub', country: 'Japan' },

  // United States & Europe
  'austin': { lat: 30.2672, lng: -97.7431, city: 'Austin, TX', country: 'USA' },
  'phoenix': { lat: 33.4484, lng: -112.0740, city: 'Phoenix, AZ', country: 'USA' },
  'san jose': { lat: 37.3382, lng: -121.8863, city: 'Silicon Valley, CA', country: 'USA' },
  'dresden': { lat: 51.0504, lng: 13.7373, city: 'Silicon Saxony (Dresden)', country: 'Germany' },
  'grenoble': { lat: 45.1885, lng: 5.7245, city: 'Grenoble Microelectronics', country: 'France' }
};

// Default fallback regional anchor: Southeast Asia / APAC Semiconductor Corridor
const DEFAULT_CENTER = { lat: 4.8, lng: 101.5, zoom: 6 };

function resolveApproximateLocation(plant: Plant): { lat: number; lng: number; city: string; country: string } {
  const query = `${plant.location || ''} ${plant.name || ''} ${plant.customerName || ''}`.toLowerCase();
  
  for (const [key, data] of Object.entries(KNOWN_REGION_COORDINATES)) {
    if (query.includes(key)) {
      return data;
    }
  }

  // Fallback by timezone if present
  if (plant.timezone) {
    const tz = plant.timezone.toLowerCase();
    if (tz.includes('kuala_lumpur') || tz.includes('singapore')) {
      return KNOWN_REGION_COORDINATES['malaysia'];
    }
    if (tz.includes('taipei')) {
      return KNOWN_REGION_COORDINATES['taiwan'];
    }
    if (tz.includes('seoul')) {
      return KNOWN_REGION_COORDINATES['korea'];
    }
    if (tz.includes('tokyo')) {
      return KNOWN_REGION_COORDINATES['tokyo'];
    }
  }

  // Default cleanroom regional point
  return {
    lat: 5.3713,
    lng: 100.5560,
    city: plant.location || 'Regional Semiconductor Corridor',
    country: 'Malaysia / APAC'
  };
}

export const ServiceCoverageMap: React.FC<ServiceCoverageMapProps> = ({
  assignedPlants,
  allPlants,
  userTimezone,
  onSelectPlant,
  isAuthorizedAdmin,
  onManageCoverageClick
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(6);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER);
  const [activeLayer, setActiveLayer] = useState<'osm' | 'topo'>('osm');

  // Resolve all location markers from canonical plants
  const locationPoints: ResolvedLocationPoint[] = useMemo(() => {
    const assignedIds = new Set(assignedPlants.map(p => p.id));
    const targetPlants = allPlants.length > 0 ? allPlants : assignedPlants;

    return targetPlants.map((plant) => {
      const geo = resolveApproximateLocation(plant);
      const isAssigned = assignedIds.has(plant.id);

      return {
        id: `point-${plant.id}`,
        plantId: plant.id,
        customerName: plant.customerName,
        plantName: plant.name,
        locationString: plant.location || 'Location unassigned',
        cityName: geo.city,
        countryName: geo.country,
        lat: geo.lat,
        lng: geo.lng,
        isAssigned,
        timezone: plant.timezone,
        linesCount: plant.linesCount,
        machinesCount: plant.machinesCount
      };
    });
  }, [allPlants, assignedPlants]);

  // Determine active focus point or recalculate center
  useEffect(() => {
    if (assignedPlants.length > 0) {
      const firstAssigned = locationPoints.find(p => p.isAssigned);
      if (firstAssigned) {
        setMapCenter({ lat: firstAssigned.lat, lng: firstAssigned.lng });
        setSelectedPointId(firstAssigned.id);
        setZoomLevel(7);
        return;
      }
    }
    
    if (locationPoints.length > 0) {
      const first = locationPoints[0];
      setMapCenter({ lat: first.lat, lng: first.lng });
      setSelectedPointId(first.id);
      setZoomLevel(6);
    } else {
      setMapCenter(DEFAULT_CENTER);
      setZoomLevel(6);
    }
  }, [assignedPlants, locationPoints]);

  const selectedPoint = useMemo(() => {
    return locationPoints.find(p => p.id === selectedPointId) || locationPoints.find(p => p.isAssigned) || locationPoints[0] || null;
  }, [locationPoints, selectedPointId]);

  // Separate points into assigned coverage locations and other known hub locations
  const assignedLocationPoints = useMemo(() => {
    return locationPoints.filter(p => p.isAssigned);
  }, [locationPoints]);

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 1, 14));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 1, 3));
  const handleReset = () => {
    if (selectedPoint) {
      setMapCenter({ lat: selectedPoint.lat, lng: selectedPoint.lng });
      setZoomLevel(7);
    } else {
      setMapCenter(DEFAULT_CENTER);
      setZoomLevel(6);
    }
  };

  // Build high-performance, keyless OpenStreetMap tile embed with exact center and zoom parameters
  // Uses OpenStreetMap.org standard export tile embedding for guaranteed zero API key requirement
  const osmEmbedUrl = useMemo(() => {
    const lat = mapCenter.lat;
    const lng = mapCenter.lng;
    const zoom = zoomLevel;
    
    // Calculate bbox delta based on zoom level
    const span = 360 / Math.pow(2, zoom);
    const minLng = (lng - span / 2).toFixed(4);
    const maxLng = (lng + span / 2).toFixed(4);
    const minLat = (lat - span / 4).toFixed(4);
    const maxLat = (lat + span / 4).toFixed(4);

    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [mapCenter, zoomLevel]);

  const hasAssignedLocations = assignedPlants.length > 0;

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors ${
      isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
    }`}>
      {/* Map Header & Controls Bar */}
      <div className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
        isDark ? 'bg-[#16191D] border-[#2B323A]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded border ${
            isDark ? 'bg-[#1C2026] border-[#2B323A] text-sky-400' : 'bg-slate-100 border-slate-200 text-indigo-600'
          }`}>
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>
                Geographic Service Map
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                hasAssignedLocations
                  ? isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isDark ? 'bg-[#1C2026] text-slate-400 border-[#2B323A]' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {hasAssignedLocations 
                  ? `${assignedPlants.length} Covered Location${assignedPlants.length === 1 ? '' : 's'}`
                  : 'No Locations Selected'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              OpenStreetMap Geographic Visualization • Approximate Regional Scale
            </p>
          </div>
        </div>

        {/* Action / Zoom Controls */}
        <div className="flex items-center gap-1.5">
          {onManageCoverageClick && (
            <button
              type="button"
              onClick={onManageCoverageClick}
              className={`px-2.5 py-1.5 rounded border text-xs font-medium mr-1 transition-colors flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-sky-950/40 border-sky-800/80 text-sky-300 hover:bg-sky-900/60' 
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Manage Coverage</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
            className={`p-1.5 rounded border text-xs font-medium transition-colors ${
              isDark ? 'bg-[#1C2026] border-[#2B323A] hover:bg-[#242A32] text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
            className={`p-1.5 rounded border text-xs font-medium transition-colors ${
              isDark ? 'bg-[#1C2026] border-[#2B323A] hover:bg-[#242A32] text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Reset Map View"
            aria-label="Reset Map View"
            className={`p-1.5 rounded border text-xs font-medium transition-colors ${
              isDark ? 'bg-[#1C2026] border-[#2B323A] hover:bg-[#242A32] text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Map Visualization Viewport */}
      <div className="relative w-full h-80 sm:h-96 bg-slate-900 overflow-hidden select-none">
        {/* Authoritative OpenStreetMap Interactive Frame */}
        <iframe
          title="OpenStreetMap Service Coverage"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={osmEmbedUrl}
          className={`w-full h-full border-0 transition-opacity duration-300 ${
            isDark ? 'filter brightness-90 contrast-105' : ''
          }`}
        />

        {/* Floating Quick Navigation Marker Overlay */}
        <div className="absolute top-3 left-3 max-w-[280px] sm:max-w-xs space-y-1.5 z-10 pointer-events-auto">
          <div className={`p-2.5 rounded-lg border backdrop-blur-md shadow-lg ${
            isDark ? 'bg-[#16191D]/90 border-[#2B323A] text-slate-200' : 'bg-white/95 border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {hasAssignedLocations ? 'Covered Service Locations' : 'Semiconductor Hub Sites'}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {hasAssignedLocations 
                  ? `${assignedLocationPoints.length} Covered` 
                  : `${locationPoints.length} Known`}
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {(hasAssignedLocations ? assignedLocationPoints : locationPoints).map((point) => (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => {
                    setSelectedPointId(point.id);
                    setMapCenter({ lat: point.lat, lng: point.lng });
                    setZoomLevel(8);
                    if (onSelectPlant) onSelectPlant(point.plantId);
                  }}
                  className={`w-full text-left p-1.5 rounded text-xs flex items-center justify-between gap-2 transition-colors ${
                    selectedPointId === point.id
                      ? isDark ? 'bg-sky-950/60 border border-sky-800/80 text-sky-200' : 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold'
                      : isDark ? 'hover:bg-[#242A32] text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <p className="truncate font-medium text-[11px]">{point.customerName} - {point.plantName}</p>
                    <p className="text-[9px] text-slate-400 truncate">{point.cityName}</p>
                  </div>
                  {point.isAssigned ? (
                    <span className={`px-1 py-0.2 rounded text-[9px] font-mono shrink-0 ${
                      isDark ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      Covered
                    </span>
                  ) : (
                    <span className={`px-1 py-0.2 rounded text-[9px] font-mono shrink-0 ${
                      isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      Known
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Location Card HUD (Bottom Right) */}
        {selectedPoint ? (
          <div className="absolute bottom-3 right-3 max-w-[290px] sm:max-w-sm z-10 pointer-events-auto">
            <div className={`p-3 rounded-lg border backdrop-blur-md shadow-xl ${
              isDark ? 'bg-[#16191D]/95 border-[#2B323A] text-slate-200' : 'bg-white/95 border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <h4 className="text-xs font-semibold leading-tight">{selectedPoint.customerName}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedPoint.plantName}</p>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border uppercase tracking-wider shrink-0 ${
                  selectedPoint.isAssigned
                    ? isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isDark ? 'bg-[#1F242C] text-slate-400 border-[#2B323A]' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {selectedPoint.isAssigned ? 'Active Coverage' : 'Known Facility'}
                </span>
              </div>

              <div className="space-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{selectedPoint.locationString}</span>
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                  <span>Approx: {selectedPoint.lat.toFixed(4)}°, {selectedPoint.lng.toFixed(4)}°</span>
                  <span>{selectedPoint.timezone || userTimezone || 'UTC+08:00'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Clean Banner If No Coverage Assigned */}
        {!hasAssignedLocations && (
          <div className="absolute bottom-3 right-3 max-w-[280px] z-10 pointer-events-auto">
            <div className={`p-3 rounded-lg border backdrop-blur-md shadow-xl ${
              isDark ? 'bg-[#16191D]/95 border-[#2B323A] text-slate-300' : 'bg-white/95 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-start gap-2">
                <Compass className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">No service locations assigned</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select customer sites using "Manage Coverage" to configure active dispatch locations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Attribution & Geographic Honesty Indicator */}
        <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
          <div className="px-2 py-0.5 rounded bg-slate-950/80 text-[9px] font-mono text-slate-400 border border-slate-800 backdrop-blur-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>OpenStreetMap • Public GIS Boundary • Approx Facility Center</span>
          </div>
        </div>
      </div>

      {/* Map Bottom Metadata & Context Ribbon */}
      <div className={`px-4 py-2.5 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] ${
        isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            {hasAssignedLocations 
              ? `Operational service radius centered on ${assignedPlants.length} assigned customer site${assignedPlants.length === 1 ? '' : 's'}.`
              : 'Displaying regional semiconductor manufacturing corridor context. Engineer service assignment pending.'}
          </span>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center font-mono text-[10px]">
          <span>Zoom: {zoomLevel}x</span>
          <span>•</span>
          <a
            href={`https://www.openstreetmap.org/#map=${zoomLevel}/${mapCenter.lat}/${mapCenter.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 hover:underline ${
              isDark ? 'text-sky-400' : 'text-indigo-600'
            }`}
          >
            <span>View on OSM</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
