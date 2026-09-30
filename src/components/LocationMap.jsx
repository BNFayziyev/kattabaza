import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pulseIcon = L.divIcon({
  className: "",
  html: '<span class="map-pulse-dot"><span class="map-pulse-dot-core"></span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// ⚠️ CARTO (basemaps.cartocdn.com) endi API kalit talab qiladi — tungi xarita
// ustida "API KEY REQUIRED" yozuvi chiqardi. Tungi rejimda Esri'ning kalitsiz
// "Dark Gray" qatlamlari ishlatiladi (asos + ustidagi nomlar), time.kattabaza.uz dagi kabi.
const TILE_LAYERS = {
  light: [{ url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", subdomains: "abc", maxZoom: 19 }],
  dark: [
    {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      maxZoom: 16,
    },
    {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      maxZoom: 16,
    },
  ],
};

const ZOOM = 4;
const TOP_OFFSET_RATIO = 0.12; // marker sits ~12% down from the top of the viewport
const RIGHT_OFFSET_RATIO = 0.8; // marker sits ~80% across the part of the viewport not covered by the AI panel
const AI_PANEL_WIDTH = 320; // xl ekranda o'ngdagi AI panel (w-80) xaritani yopadi
const FLY_DURATION = 1.4; // seconds

const MIN_FREE_SPACE = 150; // kartaning o'ng tomonida belgi uchun kamida shuncha joy bo'lsin

const rightInset = () => (typeof window !== "undefined" && window.innerWidth >= 1280 ? AI_PANEL_WIDTH : 0);

// Belgi (marker) qayerda turadi: IP kartaning (data-map-anchor) o'ng tomonida
// bo'sh joy bo'lsa — o'sha joyning o'rtasida, bo'lmasa — ko'rinadigan qismning 80% ida.
function markerX(viewportWidth) {
  const visibleRight = viewportWidth - rightInset();
  const anchor = typeof document !== "undefined" && document.querySelector("[data-map-anchor]");
  if (anchor) {
    const right = anchor.getBoundingClientRect().right;
    if (visibleRight - right >= MIN_FREE_SPACE) return (right + visibleRight) / 2;
  }
  return visibleRight * RIGHT_OFFSET_RATIO;
}

export default function LocationMap({ latitude, longitude, label, theme }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const coordsRef = useRef({ latitude, longitude, label });
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      attributionControl: true,
    }).setView([20, 0], 2);

    L.control
      .attribution({ prefix: false, position: "bottomright" })
      .addAttribution("© OpenStreetMap · Esri, HERE, Garmin")
      .addTo(map);

    tileLayerRef.current = L.layerGroup(
      TILE_LAYERS[theme === "dark" ? "dark" : "light"].map(({ url, ...opts }) => L.tileLayer(url, opts))
    ).addTo(map);

    mapRef.current = map;

    const recenter = (animate) => {
      const { latitude: lat, longitude: lon, label: lbl } = coordsRef.current;
      if (lat == null || lon == null) return;

      const targetPoint = map.project([lat, lon], ZOOM);
      const viewportSize = map.getSize();
      const offsetX = viewportSize.x * 0.5 - markerX(viewportSize.x);
      const offsetY = viewportSize.y * (0.5 - TOP_OFFSET_RATIO);
      const shiftedPoint = targetPoint.add([offsetX, offsetY]);
      const offsetCenter = map.unproject(shiftedPoint, ZOOM);

      if (animate && hasCenteredRef.current) {
        map.flyTo(offsetCenter, ZOOM, { duration: FLY_DURATION });
        // Safety net: if the animation stalls (e.g. a backgrounded tab throttling
        // requestAnimationFrame), snap to the target instead of staying stuck mid-flight.
        setTimeout(() => {
          if (!map._loaded) return;
          const c = map.getCenter();
          if (Math.abs(c.lat - offsetCenter.lat) > 0.01 || Math.abs(c.lng - offsetCenter.lng) > 0.01) {
            map.setView(offsetCenter, ZOOM, { animate: false });
          }
        }, FLY_DURATION * 1000 + 800);
      } else {
        map.setView(offsetCenter, ZOOM, { animate: false });
      }
      hasCenteredRef.current = true;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
      } else {
        markerRef.current = L.marker([lat, lon], { icon: pulseIcon }).addTo(map);
      }

      if (lbl) {
        if (markerRef.current.getTooltip()) {
          markerRef.current.setTooltipContent(lbl);
        } else {
          markerRef.current
            .bindTooltip(lbl, {
              permanent: true,
              direction: "top",
              offset: [0, -6],
              className: "map-marker-label",
            })
            .openTooltip();
        }
      }
    };

    map.on("resize", () => recenter(false));
    map._recenter = recenter;
    recenter(false); // in case coords already arrived before this (re)mount (e.g. React StrictMode)

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const group = tileLayerRef.current;
    if (!group) return;
    group.clearLayers();
    TILE_LAYERS[theme === "dark" ? "dark" : "light"].forEach(({ url, ...opts }) =>
      group.addLayer(L.tileLayer(url, opts))
    );
  }, [theme]);

  useEffect(() => {
    coordsRef.current = { latitude, longitude, label };
    const map = mapRef.current;
    if (!map || latitude == null || longitude == null || !map._recenter) return;
    map._recenter(true);
  }, [latitude, longitude, label]);

  return <div ref={containerRef} className="fixed inset-0 z-0" aria-hidden="true" />;
}
