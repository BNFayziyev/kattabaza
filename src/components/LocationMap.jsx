import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pulseIcon = L.divIcon({
  className: "",
  html: '<span class="map-pulse-dot"><span class="map-pulse-dot-core"></span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Yuqoriga (shimolga) qaragan samolyot — aylantirish shu holatdan hisoblanadi
const planeIcon = L.divIcon({
  className: "",
  html:
    '<span class="map-plane"><svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M12 1.8c.95 0 1.55.95 1.55 2.1v5.3l7.3 4.2c.32.18.5.52.5.88v1.35c0 .42-.4.72-.8.6l-7-2.05v3.9l2.35 1.75c.2.15.32.38.32.62v1.05c0 .38-.38.65-.74.53L12 20.9l-3.48 1.13c-.36.12-.74-.15-.74-.53v-1.05c0-.24.12-.47.32-.62l2.35-1.75v-3.9l-7 2.05c-.4.12-.8-.18-.8-.6v-1.35c0-.36.18-.7.5-.88l7.3-4.2V3.9c0-1.15.6-2.1 1.55-2.1z"/>' +
    "</svg></span>",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

/**
 * Orqa fon xaritasi — O'ZIMIZNING rasm (public/map/world-*.svg, tools/map/build-map.mjs).
 * Tashqi xarita servisiga (OSM, CARTO, Esri) umuman so'rov ketmaydi.
 * Rasm Web Mercator'da chizilgan, shuning uchun Leaflet uni ImageOverlay qilib
 * aynan joyiga qo'yadi; sana chizig'i atrofida uzilmasligi uchun chap va o'ngda nusxasi bor.
 */
const MAX_LAT = 85.0511287798;
const mapUrl = (theme) => `/map/world-${theme === "dark" ? "dark" : "light"}.svg`;

function addWorld(group, theme) {
  group.clearLayers();
  for (const shift of [-360, 0, 360]) {
    L.imageOverlay(mapUrl(theme), [[-MAX_LAT, -180 + shift], [MAX_LAT, 180 + shift]], {
      className: "map-world",
      interactive: false,
    }).addTo(group);
  }
}

const ZOOM = 4;
const TOP_OFFSET_RATIO = 0.12; // marker sits ~12% down from the top of the viewport
const RIGHT_OFFSET_RATIO = 0.8; // marker sits ~80% across the part of the viewport not covered by the AI panel
const AI_PANEL_WIDTH = 320; // xl ekranda o'ngdagi AI panel (w-80) xaritani yopadi
const MIN_FREE_SPACE = 150; // kartaning o'ng tomonida belgi uchun kamida shuncha joy bo'lsin
const ORBIT_KM = 80; // bundan yaqin bo'lsa — uchib o'tmaydi, belgi atrofida aylanadi

const rightInset = () => (typeof window !== "undefined" && window.innerWidth >= 1280 ? AI_PANEL_WIDTH : 0);
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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

/** Xarita markazi shunday tanlanadiki, belgi ekranning kerakli joyida tursin. */
function viewCenter(map, lat, lon) {
  const size = map.getSize();
  const point = map.project([lat, lon], ZOOM).add([size.x * 0.5 - markerX(size.x), size.y * (0.5 - TOP_OFFSET_RATIO)]);
  return map.unproject(point, ZOOM);
}

// ------------------------------------------------------------ parvoz yo'li

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

/** Ikki nuqta orasidagi katta aylana (eng qisqa yo'l) — haqiqiy samolyot shunday uchadi. */
function greatCircle(from, to, steps) {
  const [p1, l1, p2, l2] = [toRad(from.lat), toRad(from.lng), toRad(to.lat), toRad(to.lng)];
  const d = 2 * Math.asin(Math.sqrt(Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2));
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const a = Math.sin((1 - f) * d) / Math.sin(d);
    const b = Math.sin(f * d) / Math.sin(d);
    const x = a * Math.cos(p1) * Math.cos(l1) + b * Math.cos(p2) * Math.cos(l2);
    const y = a * Math.cos(p1) * Math.sin(l1) + b * Math.cos(p2) * Math.sin(l2);
    const z = a * Math.sin(p1) + b * Math.sin(p2);
    points.push([toDeg(Math.atan2(z, Math.hypot(x, y))), toDeg(Math.atan2(y, x))]);
  }
  // Uzunlik ±180 dan sakrab o'tmasin — chiziq uzluksiz bo'lsin
  for (let i = 1; i < points.length; i++) {
    while (points[i][1] - points[i - 1][1] > 180) points[i][1] -= 360;
    while (points[i][1] - points[i - 1][1] < -180) points[i][1] += 360;
  }
  return { points, km: d * 6371 };
}

/** Joy o'zgarmagan bo'lsa — belgidan ko'tarilib, aylana bo'ylab uchib, qaytib qo'nadi. */
function orbit(map, at, steps) {
  const radius = 70;
  const p = map.project(at, ZOOM);
  const center = p.subtract([0, radius]);
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    points.push(map.unproject(center.add([radius * Math.sin(a), radius * Math.cos(a)]), ZOOM));
  }
  return points.map((ll) => [ll.lat, ll.lng]);
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export default function LocationMap({ latitude, longitude, label, theme, flightId = 0 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const worldRef = useRef(null);
  const flightRef = useRef(null); // { raf, plane, trail, route, timer }
  const lastFlightRef = useRef(flightId);

  // Xaritani bir marta yaratamiz
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
      zoomSnap: 0,
    }).setView([20, 0], 2);

    L.control
      .attribution({ prefix: false, position: "bottomright" })
      .addAttribution("Map: Natural Earth")
      .addTo(map);

    worldRef.current = L.layerGroup().addTo(map);
    addWorld(worldRef.current, theme);
    mapRef.current = map;

    map.on("resize", () => {
      const m = markerRef.current;
      if (!m || flightRef.current) return;
      const ll = m.getLatLng();
      map.setView(viewCenter(map, ll.lat, ll.lng), ZOOM, { animate: false });
    });

    return () => {
      cancelFlight();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      worldRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (worldRef.current) addWorld(worldRef.current, theme);
  }, [theme]);

  function cancelFlight() {
    const f = flightRef.current;
    if (!f) return;
    cancelAnimationFrame(f.raf);
    clearTimeout(f.timer);
    [f.plane, f.trail, f.route].forEach((layer) => layer?.remove());
    flightRef.current = null;
  }

  function setLabel(marker, text) {
    if (!text) {
      marker.unbindTooltip();
      return;
    }
    if (marker.getTooltip()) marker.setTooltipContent(text).openTooltip();
    else marker.bindTooltip(text, { permanent: true, direction: "top", offset: [0, -6], className: "map-marker-label" }).openTooltip();
  }

  /** Belgini animatsiyasiz joyiga qo'yadi. */
  function place(lat, lon, text) {
    const map = mapRef.current;
    map.setView(viewCenter(map, lat, lon), ZOOM, { animate: false });
    if (markerRef.current) markerRef.current.setLatLng([lat, lon]);
    else markerRef.current = L.marker([lat, lon], { icon: pulseIcon, interactive: false }).addTo(map);
    setLabel(markerRef.current, text);
  }

  /** Samolyot eski belgidan yangi joyga uchadi, kamera ham unga ergashadi. */
  function fly(lat, lon, text) {
    const map = mapRef.current;
    const marker = markerRef.current;
    cancelFlight();

    const from = marker.getLatLng();
    const { points: arc, km } = greatCircle(from, { lat, lng: lon }, 96);
    const isOrbit = km < ORBIT_KM;
    const points = isOrbit ? orbit(map, from, 72) : arc;
    // Samolyot eng qisqa yo'ldan uchadi (masalan, Tinch okeani ustidan). Kamera ham
    // aynan o'sha tomonga ketishi uchun manzil uzunligi yo'lning oxiridan olinadi.
    const lng = isOrbit ? from.lng : arc[arc.length - 1][1];
    // Masofaga qarab: yaqin joy ~1.8 s, dunyoning narigi chekkasi ~4 s
    const duration = isOrbit ? 2200 : Math.min(4000, 1800 + km * 0.18);

    marker.closeTooltip();
    const route = L.polyline(points, { className: "flight-route", weight: 2, dashArray: "3 9", lineCap: "round", interactive: false }).addTo(map);
    const trail = L.polyline([points[0]], { className: "flight-trail", weight: 3, lineCap: "round", interactive: false }).addTo(map);
    const plane = L.marker(points[0], { icon: planeIcon, interactive: false, zIndexOffset: 1000 }).addTo(map);
    const flight = { plane, trail, route, raf: 0, timer: 0 };
    flightRef.current = flight;

    if (!isOrbit) {
      map.flyTo(viewCenter(map, lat, lng), ZOOM, { duration: duration / 1000, easeLinearity: 0.2 });
    }

    const start = performance.now();
    const at = (pos) => {
      const i = Math.min(points.length - 1, Math.floor(pos));
      const j = Math.min(points.length - 1, i + 1);
      const f = pos - i;
      return [points[i][0] + (points[j][0] - points[i][0]) * f, points[i][1] + (points[j][1] - points[i][1]) * f];
    };

    const frame = (now) => {
      // rAF vaqti `start` dan biroz oldin bo'lishi mumkin — manfiy bo'lmasin
      const t = Math.max(0, Math.min(1, (now - start) / duration));
      const pos = easeInOut(t) * (points.length - 1);
      const here = at(pos);
      const ahead = at(Math.min(points.length - 1, pos + 0.6));

      plane.setLatLng(here);
      trail.setLatLngs([...points.slice(0, Math.floor(pos) + 1), here]);

      // Yo'nalish ekrandagi harakatga qarab; balandlik — o'rtada samolyot kattaroq
      const a = map.latLngToContainerPoint(here);
      const b = map.latLngToContainerPoint(ahead);
      const el = plane.getElement()?.firstChild;
      if (el && (a.x !== b.x || a.y !== b.y)) {
        const heading = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90;
        const lift = 1 + 0.35 * Math.sin(Math.PI * t);
        el.style.transform = `rotate(${heading}deg) scale(${lift})`;
      }

      if (t < 1) {
        flight.raf = requestAnimationFrame(frame);
        return;
      }

      // Qo'ndi: belgi yangi joyga, samolyot va iz sekin yo'qoladi
      marker.setLatLng([lat, lng]);
      setLabel(marker, text);
      if (!isOrbit) map.setView(viewCenter(map, lat, lng), ZOOM, { animate: false });
      plane.getElement()?.classList.add("is-landed");
      trail.getElement()?.classList.add("is-fading");
      route.getElement()?.classList.add("is-fading");
      flight.timer = setTimeout(() => {
        [plane, trail, route].forEach((layer) => layer.remove());
        if (flightRef.current === flight) flightRef.current = null;
        // Sana chizig'idan o'tgan bo'lsak — xuddi shu joyning asosiy nusxasiga
        // sakrab o'tamiz (xarita bir xil, ko'zga sezilmaydi), uzunlik ±180 da qoladi
        if (Math.abs(lng) > 180) {
          const wrapped = ((((lng + 180) % 360) + 360) % 360) - 180;
          marker.setLatLng([lat, wrapped]);
          map.setView(viewCenter(map, lat, wrapped), ZOOM, { animate: false });
        }
      }, 1000);
    };
    flight.raf = requestAnimationFrame(frame);
  }

  // Joy yoki "uchish" buyrug'i o'zgardi
  useEffect(() => {
    const map = mapRef.current;
    if (!map || latitude == null || longitude == null) return;

    const requested = flightId !== lastFlightRef.current;
    lastFlightRef.current = flightId;
    const marker = markerRef.current;

    if (!marker || document.hidden || reducedMotion()) {
      place(latitude, longitude, label);
      return;
    }
    const current = marker.getLatLng();
    const dLng = Math.abs((((current.lng - longitude) % 360) + 540) % 360 - 180);
    const moved = Math.abs(current.lat - latitude) > 1e-6 || dLng > 1e-6;
    if (moved || requested) fly(latitude, longitude, label);
    else setLabel(marker, label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, label, flightId]);

  return <div ref={containerRef} className="fixed inset-0 z-0" aria-hidden="true" />;
}
