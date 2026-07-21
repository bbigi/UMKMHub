import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents, ZoomControl } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Car, LocateFixed, Navigation, PersonStanding, Square } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export const KARANGWUNI_CENTER = { lat: -7.9229, lng: 110.0936 };

export type UmkmMarker = {
  id: string;
  nama_usaha: string;
  kategori: string;
  alamat: string;
  latitude: number;
  longitude: number;
};
type TravelMode = "driving" | "two-wheeler" | "walking";

function LocationPicker({ value, onChange }: { value: LatLngExpression; onChange: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (event) => onChange(event.latlng.lat, event.latlng.lng) });
  return <Marker position={value}><Popup>Lokasi usaha yang dipilih</Popup></Marker>;
}

function ResponsiveMap() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(container);
    const timer = window.setTimeout(() => map.invalidateSize({ animate: false }), 100);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [map]);
  return null;
}

function RouteViewport({ route }: { route: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (route.length > 1) map.fitBounds(route, { padding: [44, 44], maxZoom: 17 });
  }, [map, route]);
  return null;
}

function TrackingViewport({ location, tracking, hasRoute }: {
  location: { lat: number; lng: number } | null;
  tracking: boolean;
  hasRoute: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (location && tracking && !hasRoute) {
      map.flyTo([location.lat, location.lng], Math.max(map.getZoom(), 17), { animate: true, duration: 0.8 });
    }
  }, [hasRoute, location, map, tracking]);
  return null;
}

export function KarangwuniMap({ className = "", pickLocation, selectedLocation, mobilePanelOffset = false, query = "", category = "Semua", onMarkersChange }: {
  className?: string;
  pickLocation?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number };
  mobilePanelOffset?: boolean;
  query?: string;
  category?: string;
  onMarkersChange?: (items: UmkmMarker[]) => void;
}) {
  const [markers, setMarkers] = useState<UmkmMarker[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState("");
  const [tracking, setTracking] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [destination, setDestination] = useState<UmkmMarker | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("two-wheeler");
  const [dataError, setDataError] = useState("");
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("umkm").select("id,nama_usaha,kategori,alamat,latitude,longitude").eq("status", "aktif")
      .then(({ data, error }) => { const items = (data ?? []) as UmkmMarker[]; setMarkers(items); onMarkersChange?.(items); setDataError(error ? "Data UMKM belum dapat dimuat." : ""); });
  }, [onMarkersChange]);

  const visibleMarkers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    return markers.filter((item) => {
      const matchesCategory = category === "Semua" || item.kategori.startsWith(category);
      const searchable = `${item.nama_usaha} ${item.kategori} ${item.alamat}`.toLocaleLowerCase("id-ID");
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, markers, query]);

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  const stopTracking = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setTracking(false);
  };

  const startTracking = () => {
    if (!navigator.geolocation) return setLocationStatus("GPS tidak didukung perangkat ini.");
    setRoute([]);
    setRouteInfo("");
    setLocationStatus("Mencari lokasi Anda...");
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
        setLocationStatus("");
        setTracking(true);
      },
      (error) => setLocationStatus(error.code === 1 ? "Izin lokasi ditolak. Aktifkan GPS dan izin lokasi browser." : "Lokasi belum dapat ditemukan."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  };

  const showRoute = async (destination: UmkmMarker) => {
    if (!userLocation) {
      setLocationStatus("Aktifkan lokasi Anda terlebih dahulu.");
      startTracking();
      return;
    }
    setRouteInfo("Menghitung rute tercepat...");
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=false`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("route");
      const data = await response.json();
      const result = data.routes?.[0];
      if (!result) throw new Error("route");
      setRoute(result.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]));
      setRouteInfo(`${(result.distance / 1000).toFixed(1)} km · sekitar ${Math.max(1, Math.round(result.duration / 60))} menit`);
    } catch {
      setRouteInfo("Rute belum dapat dihitung. Coba lagi beberapa saat.");
    }
  };

  const chooseDestination = (item: UmkmMarker) => {
    setDestination(item);
    setRoute([]);
    setRouteInfo("");
  };

  const startNavigation = () => {
    if (!destination) return;
    const params = new URLSearchParams({
      api: "1",
      destination: `${destination.latitude},${destination.longitude}`,
      travelmode: travelMode,
      dir_action: "navigate",
    });
    if (userLocation) params.set("origin", `${userLocation.lat},${userLocation.lng}`);
    window.open(`https://www.google.com/maps/dir/?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`karangwuni-map relative ${mobilePanelOffset ? "map-has-mobile-panel" : ""} ${className}`}>
      <MapContainer center={KARANGWUNI_CENTER} zoom={14} minZoom={3} zoomControl={false}
        className="h-full min-h-[240px] w-full" scrollWheelZoom touchZoom doubleClickZoom>
        <ResponsiveMap />
        <TrackingViewport location={userLocation} tracking={tracking} hasRoute={route.length > 1} />
        <ZoomControl position="bottomright" />
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Circle center={KARANGWUNI_CENTER} radius={4500} pathOptions={{ color: "#1B6B4E", fillOpacity: 0.03 }} />
        {userLocation && <Circle center={userLocation} radius={18} pathOptions={{ color: "#2563EB", fillColor: "#3B82F6", fillOpacity: 0.9 }}><Popup>Lokasi Anda</Popup></Circle>}
        {route.length > 1 && <Polyline positions={route} pathOptions={{ color: "#2563EB", weight: 6, opacity: 0.85 }} />}
        <RouteViewport route={route} />
        {visibleMarkers.map((item) => (
          <Marker key={item.id} position={[item.latitude, item.longitude]}>
            <Popup>
              <strong>{item.nama_usaha}</strong><br />{item.kategori}<br />{item.alamat}<br />
              <button type="button" onClick={() => chooseDestination(item)} className="mt-2 rounded-lg bg-[#1B6B4E] px-3 py-2 font-semibold text-white">Pilih rute</button>
            </Popup>
          </Marker>
        ))}
        {pickLocation && selectedLocation && <LocationPicker value={selectedLocation} onChange={pickLocation} />}
      </MapContainer>
      <button type="button" onClick={tracking ? stopTracking : startTracking}
        className="map-location-control absolute z-[1000] flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-[#1B6B4E] shadow-lg border border-[#E4DFD8]"
        aria-label={tracking ? "Hentikan pelacakan lokasi" : "Gunakan lokasi saya"}>
        {tracking ? <Square size={14} /> : <LocateFixed size={16} />}
        <span>{tracking ? "Stop tracking" : "Lokasi saya"}</span>
      </button>
      {(locationStatus || routeInfo) && (
        <div className="map-route-status absolute z-[1000] flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs text-[#2A2520] shadow-lg">
          <Navigation size={14} className="shrink-0 text-[#2563EB]" />{locationStatus || routeInfo}
        </div>
      )}
      {dataError && <div className="absolute left-3 top-3 z-[1000] rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 shadow">{dataError}</div>}
      {destination && (
        <div className="map-navigation-panel absolute z-[1100] w-[min(22rem,calc(100%-1.5rem))] rounded-2xl border border-[#E4DFD8] bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-[#1A1714]">Ke {destination.nama_usaha}</p><p className="truncate text-xs text-[#9B9489]">{destination.alamat}</p></div><button onClick={() => setDestination(null)} className="text-lg text-[#9B9489]" aria-label="Tutup">×</button></div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "driving" as const, label: "Mobil", icon: Car },
              { id: "two-wheeler" as const, label: "Motor", icon: Navigation },
              { id: "walking" as const, label: "Jalan kaki", icon: PersonStanding },
            ].map((mode) => { const Icon = mode.icon; return <button key={mode.id} onClick={() => setTravelMode(mode.id)} className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-bold ${travelMode === mode.id ? "border-[#1B6B4E] bg-[#EAF2EE] text-[#1B6B4E]" : "border-[#E4DFD8] text-[#6B6558]"}`}><Icon size={16} />{mode.label}</button>; })}
          </div>
          {travelMode === "driving" && <button onClick={() => showRoute(destination)} className="mt-2 w-full rounded-xl border border-[#1B6B4E] py-2 text-xs font-bold text-[#1B6B4E]">Pratinjau rute di peta</button>}
          <button onClick={startNavigation} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B6B4E] py-2.5 text-xs font-bold text-white"><Navigation size={14} /> Mulai Rute</button>
          {travelMode !== "driving" && <p className="mt-2 text-[10px] leading-relaxed text-[#9B9489]">Rute motor dan jalan kaki dapat berbeda menurut ketersediaan jalan. Periksa kondisi sekitar dan patuhi rambu.</p>}
        </div>
      )}
      {!isSupabaseConfigured && (
        <div className="absolute left-3 bottom-7 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-[11px] text-[#6B6558] shadow">
          Tambahkan konfigurasi Supabase untuk menampilkan data UMKM.
        </div>
      )}
    </div>
  );
}
