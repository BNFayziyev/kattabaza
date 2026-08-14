import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pulseIcon = L.divIcon({
  className: "",
  html: '<span class="map-pulse-dot"><span class="map-pulse-dot-core"></span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const TILE_URLS = {
  light: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};
const TILE_SUBDOMAINS = {
  light: "abc",
  dark: "abcd",
};

const ZOOM = 4;
const TOP_OFFSET_RATIO = 0.12; // marker sits ~12% down from the top of the viewport
const RIGHT_OFFSET_RATIO = 0.8; // marker sits ~80% across from the left of the viewport

export default function LocationMap({ latitude, longitude, label, theme }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const coordsRef = useRef({ latitude, longitude, label });

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
      zoomAnimation: false,
      attributionControl: true,
    }).setView([20, 0], 2);

    L.control
      .attribution({ prefix: false, position: "bottomright" })
      .addAttribution("© OpenStreetMap © CARTO")
      .addTo(map);

    tileLayerRef.current = L.tileLayer(TILE_URLS[theme === "dark" ? "dark" : "light"], {
      subdomains: TILE_SUBDOMAINS[theme === "dark" ? "dark" : "light"],
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    const recenter = () => {
      const { latitude: lat, longitude: lon, label: lbl } = coordsRef.current;
      if (lat == null || lon == null) return;

      const targetPoint = map.project([lat, lon], ZOOM);
      const viewportSize = map.getSize();
      const offsetX = viewportSize.x * (0.5 - RIGHT_OFFSET_RATIO);
      const offsetY = viewportSize.y * (0.5 - TOP_OFFSET_RATIO);
      const shiftedPoint = targetPoint.add([offsetX, offsetY]);
      const offsetCenter = map.unproject(shiftedPoint, ZOOM);

      map.setView(offsetCenter, ZOOM, { animate: false });

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

    map.on("resize", recenter);
    map._recenter = recenter;
    recenter(); // in case coords already arrived before this (re)mount (e.g. React StrictMode)

    return () => {
      map.off("resize", recenter);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(TILE_URLS[theme === "dark" ? "dark" : "light"]);
    }
  }, [theme]);

  useEffect(() => {
    coordsRef.current = { latitude, longitude, label };
    const map = mapRef.current;
    if (!map || latitude == null || longitude == null || !map._recenter) return;
    map._recenter();
  }, [latitude, longitude, label]);

  return <div ref={containerRef} className="fixed inset-0 z-0" aria-hidden="true" />;
}
