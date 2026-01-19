import { useEffect, useRef } from "react";
import type * as L from "leaflet";
import type { Id } from "../../../convex/_generated/dataModel";

// Get Leaflet from window (loaded via CDN)
const getLeaflet = (): typeof L | undefined =>
  (window as unknown as { L?: typeof L }).L;

interface OrgMapProps {
  orgs: Array<{
    _id: Id<"organizations">;
    name: string;
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  }>;
  selectedOrgId: Id<"organizations"> | null;
  onOrgSelect: (id: Id<"organizations">) => void;
}

export function OrgMap({ orgs, selectedOrgId, onOrgSelect }: OrgMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    const leaflet = getLeaflet();
    if (!mapRef.current || !leaflet || mapInstanceRef.current) return;

    const map = leaflet.map(mapRef.current).setView([20, 0], 2);
    leaflet
      .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      })
      .addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when orgs change
  useEffect(() => {
    const leaflet = getLeaflet();
    const map = mapInstanceRef.current;
    if (!map || !leaflet) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add markers for orgs with coordinates
    const orgsWithCoords = orgs.filter((o) => o.coordinates);

    orgsWithCoords.forEach((org) => {
      const marker = leaflet
        .marker([org.coordinates!.lat, org.coordinates!.lng])
        .addTo(map)
        .bindPopup(
          `<b>${org.name}</b><br/>${[org.city, org.country].filter(Boolean).join(", ")}`
        )
        .on("click", () => onOrgSelect(org._id));

      markersRef.current.set(org._id.toString(), marker);
    });

    // Fit bounds if we have markers
    if (orgsWithCoords.length > 0) {
      const bounds = leaflet.latLngBounds(
        orgsWithCoords.map((o) => [o.coordinates!.lat, o.coordinates!.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [orgs, onOrgSelect]);

  // Highlight selected marker
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      if (id === selectedOrgId?.toString()) {
        marker.openPopup();
      }
    });
  }, [selectedOrgId]);

  return (
    <div
      ref={mapRef}
      className="h-full w-full bg-slate-100 rounded-lg"
      style={{ minHeight: "400px" }}
    />
  );
}
