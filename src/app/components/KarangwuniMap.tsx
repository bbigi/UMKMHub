import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents, ZoomControl } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Car, LocateFixed, Navigation, Package, PersonStanding, Radar, Square, X } from "lucide-react";
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
  distance_meters?: number;
};
type MapProduct = { id: string; umkm_id: string; name: string; description: string; price: number; image_url: string | null };
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

function BusinessViewport({ business }: { business: UmkmMarker | null }) {
  const map = useMap();
  useEffect(() => {
    if (business) map.flyTo([business.latitude, business.longitude], Math.max(map.getZoom(), 16), { animate: true, duration: 0.7 });
  }, [business, map]);
  return null;
}

export function KarangwuniMap({ className = "", pickLocation, selectedLocation, mobilePanelOffset = false, query = "", category = "Semua", onMarkersChange, focusBusinessId, focusBusinessKey = 0 }: {
  className?: string;
  pickLocation?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number };
  mobilePanelOffset?: boolean;
  query?: string;
  category?: string;
  onMarkersChange?: (items: UmkmMarker[]) => void;
  focusBusinessId?: string | null;
  focusBusinessKey?: number;
}) {
  const [markers, setMarkers] = useState<UmkmMarker[]>([]);
  const [allMarkers, setAllMarkers] = useState<UmkmMarker[]>([]);
  const [products, setProducts] = useState<MapProduct[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<UmkmMarker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState("");
  const [tracking, setTracking] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [destination, setDestination] = useState<UmkmMarker | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("two-wheeler");
  const [dataError, setDataError] = useState("");
  const [radiusMeters, setRadiusMeters] = useState(0);
  const [spatialStatus, setSpatialStatus] = useState("");
  const watchId = useRef<number | null>(null);
  const spatialRequestId = useRef(0);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("umkm").select("id,nama_usaha,kategori,alamat,latitude,longitude").eq("status", "aktif")
      .then((businessResult) => {
      const items = (businessResult.data ?? []) as UmkmMarker[];
      setAllMarkers(items); setMarkers(items); onMarkersChange?.(items);
      setDataError(businessResult.error ? "Data UMKM belum dapat dimuat." : "");
    });
  }, [onMarkersChange]);

  useEffect(() => {
    if (!focusBusinessId) return;
    const business = markers.find((item) => item.id === focusBusinessId) ?? allMarkers.find((item) => item.id === focusBusinessId);
    if (business) setSelectedBusiness(business);
  }, [allMarkers, focusBusinessId, focusBusinessKey, markers]);

  useEffect(() => {
    let active = true;
    setProducts([]);
    if (!supabase || !selectedBusiness) return () => { active = false; };
    supabase.from("products").select("id,umkm_id,name,description,price,image_url").eq("status", "aktif").eq("umkm_id", selectedBusiness.id).order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        setProducts((data ?? []) as MapProduct[]);
        if (error) setDataError("Produk UMKM belum dapat dimuat.");
      });
    return () => { active = false; };
  }, [selectedBusiness]);

  const visibleMarkers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    return markers.filter((item) => {
      const matchesCategory = category === "Semua" || item.kategori.startsWith(category);
      const searchable = `${item.nama_usaha} ${item.kategori} ${item.alamat}`.toLocaleLowerCase("id-ID");
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, markers, query]);
  const selectedProducts = useMemo(() => products.filter((product) => product.umkm_id === selectedBusiness?.id), [products, selectedBusiness]);

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  const stopTracking = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setTracking(false);
    setLocationStatus("");
  };

  const startTracking = () => {
    if (!navigator.geolocation) return setLocationStatus("GPS tidak didukung perangkat ini.");
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    setRoute([]);
    setRouteInfo("");
    setLocationStatus("Mencari lokasi Anda...");
    setTracking(true);
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
        setLocationStatus("");
      },
      (error) => {
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
        setTracking(false);
        setLocationStatus(error.code === 1 ? "Izin lokasi ditolak. Aktifkan GPS dan izin lokasi browser." : "Lokasi belum dapat ditemukan.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  };

  const applySpatialRadius = async (meters: number) => {
    const requestId = ++spatialRequestId.current;
    setRadiusMeters(meters);
    setSelectedBusiness(null);
    if (meters === 0) {
      setMarkers(allMarkers);
      onMarkersChange?.(allMarkers);
      setSpatialStatus("");
      return;
    }
    if (!supabase || !userLocation) return;
    setSpatialStatus("Mencari UMKM terdekat...");
    const { data, error } = await supabase.rpc("search_nearby_umkm", {
      p_latitude: userLocation.lat,
      p_longitude: userLocation.lng,
      p_radius_meters: meters,
    });
    if (requestId !== spatialRequestId.current) return;
    if (error) return setSpatialStatus(`Pencarian GIS gagal: ${error.message}`);
    const nearby = (data ?? []) as UmkmMarker[];
    setMarkers(nearby);
    onMarkersChange?.(nearby);
    setSpatialStatus(`${nearby.length} UMKM dalam radius ${(meters / 1000).toLocaleString("id-ID")} km`);
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
    setSelectedBusiness(null);
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
        <BusinessViewport business={selectedBusiness} />
        <ZoomControl position="bottomright" />
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Circle center={KARANGWUNI_CENTER} radius={4500} pathOptions={{ color: "#1B6B4E", fillOpacity: 0.03 }} />
        {userLocation && <Circle center={userLocation} radius={18} pathOptions={{ color: "#2563EB", fillColor: "#3B82F6", fillOpacity: 0.9 }}><Popup>Lokasi Anda</Popup></Circle>}
        {userLocation && radiusMeters > 0 && <Circle center={userLocation} radius={radiusMeters} pathOptions={{ color: "#6B3FA0", fillColor: "#6B3FA0", fillOpacity: 0.08, dashArray: "6 6" }} />}
        {route.length > 1 && <Polyline positions={route} pathOptions={{ color: "#2563EB", weight: 6, opacity: 0.85 }} />}
        <RouteViewport route={route} />
        {visibleMarkers.map((item) => (
          <Marker key={item.id} position={[item.latitude, item.longitude]} eventHandlers={{ click: () => !pickLocation && setSelectedBusiness(item) }}>
            <Popup>
              <strong>{item.nama_usaha}</strong><br />{item.kategori}<br />{item.alamat}<br />
              <div className="mt-2 flex gap-2"><button type="button" onClick={() => setSelectedBusiness(item)} className="rounded-lg bg-[#1B6B4E] px-3 py-2 font-semibold text-white">Lihat detail</button><button type="button" onClick={() => chooseDestination(item)} className="rounded-lg border border-[#1B6B4E] px-3 py-2 font-semibold text-[#1B6B4E]">Rute</button></div>
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
      {userLocation && !pickLocation && <label className="absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-[#E4DFD8] bg-white/95 px-3 py-2 text-xs font-bold text-[#6B3FA0] shadow-lg backdrop-blur">
        <Radar size={14} />
        <span className="sr-only">Radius pencarian GIS</span>
        <select value={radiusMeters} onChange={(event) => void applySpatialRadius(Number(event.target.value))} className="bg-transparent outline-none">
          <option value={0}>Semua UMKM</option>
          <option value={1000}>Radius 1 km</option>
          <option value={3000}>Radius 3 km</option>
          <option value={5000}>Radius 5 km</option>
          <option value={10000}>Radius 10 km</option>
        </select>
      </label>}
      {(locationStatus || routeInfo) && (
        <div className="map-route-status absolute z-[1000] flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs text-[#2A2520] shadow-lg">
          <Navigation size={14} className="shrink-0 text-[#2563EB]" />{locationStatus || routeInfo}
        </div>
      )}
      {dataError && <div className="absolute left-3 top-3 z-[1000] rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 shadow">{dataError}</div>}
      {spatialStatus && <div className="absolute left-1/2 top-14 z-[1000] -translate-x-1/2 whitespace-nowrap rounded-xl bg-[#F2EDF8]/95 px-3 py-2 text-[11px] font-semibold text-[#6B3FA0] shadow">{spatialStatus}</div>}
      {selectedBusiness && !pickLocation && (
        <section className="absolute bottom-3 left-3 right-3 z-[1300] max-h-[72%] overflow-y-auto rounded-3xl border border-white/70 bg-white/95 p-4 shadow-2xl backdrop-blur-md md:bottom-4 md:left-auto md:right-4 md:w-[360px]" aria-label={`Detail ${selectedBusiness.nama_usaha}`}>
          <div className="mb-3 flex items-start justify-between gap-3"><div><span className="rounded-full bg-[#EAF2EE] px-2.5 py-1 text-[10px] font-bold uppercase text-[#1B6B4E]">{selectedBusiness.kategori}</span><h2 className="mt-2 text-lg font-extrabold text-[#1A1714]">{selectedBusiness.nama_usaha}</h2><p className="mt-1 text-xs text-[#6B6558]">{selectedBusiness.alamat}</p>{selectedBusiness.distance_meters !== undefined && <p className="mt-1 text-[11px] font-bold text-[#6B3FA0]">{selectedBusiness.distance_meters < 1000 ? `${Math.round(selectedBusiness.distance_meters)} meter` : `${(selectedBusiness.distance_meters / 1000).toFixed(1)} km`} dari lokasi Anda</p>}</div><button type="button" onClick={() => setSelectedBusiness(null)} aria-label="Tutup detail UMKM" className="rounded-xl bg-[#F0EDE7] p-2 text-[#6B6558]"><X size={16} /></button></div>
          {selectedProducts.length > 0 ? <><div className={`grid gap-1.5 overflow-hidden rounded-2xl ${selectedProducts.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>{selectedProducts.slice(0, 4).map((product, index) => <article key={product.id} className="relative min-h-24 overflow-hidden bg-[#F0EDE7]">{product.image_url ? <img src={product.image_url} alt={product.name} className="h-28 w-full object-cover" loading="lazy" /> : <div className="flex h-28 flex-col items-center justify-center text-[#9B9489]"><Package size={20} /><span className="mt-1 max-w-[90%] truncate text-[10px]">{product.name}</span></div>}{index === 3 && selectedProducts.length > 4 && <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-extrabold text-white">+{selectedProducts.length - 4}</div>}</article>)}</div><div className="mt-3 space-y-2">{selectedProducts.slice(0, 4).map((product) => <div key={product.id} className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-[#2A2520]">{product.name}</p><p className="line-clamp-1 text-[10px] text-[#9B9489]">{product.description || "Tanpa deskripsi"}</p></div><p className="shrink-0 text-xs font-bold text-[#1B6B4E]">Rp {Number(product.price).toLocaleString("id-ID")}</p></div>)}</div></> : <div className="rounded-2xl bg-[#F8F5F0] p-4 text-center"><Package size={20} className="mx-auto text-[#9B9489]" /><p className="mt-2 text-xs text-[#6B6558]">Belum ada produk aktif dari UMKM ini.</p></div>}
          <button type="button" onClick={() => chooseDestination(selectedBusiness)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B6B4E] py-3 text-xs font-bold text-white"><Navigation size={14} /> Buat Rute ke UMKM</button>
        </section>
      )}
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
