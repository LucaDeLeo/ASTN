import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Id } from '../../../convex/_generated/dataModel'

interface OrgMapProps {
  orgs: Array<{
    _id: Id<'organizations'>
    name: string
    logoUrl?: string
    city?: string
    country?: string
    coordinates?: { lat: number; lng: number }
  }>
  selectedOrgId: Id<'organizations'> | null
  onOrgSelect: (id: Id<'organizations'>) => void
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function createOrgMarkerIcon(
  org: { name: string; logoUrl?: string },
  isSelected: boolean,
): L.DivIcon {
  const size = isSelected ? 48 : 40
  const borderWidth = isSelected ? 3 : 2
  const borderColor = isSelected ? '#f97316' : '#ffffff'
  const initials = getInitials(org.name)

  const html = org.logoUrl
    ? `<div style="width:${size}px;height:${size}px;border-radius:50%;border:${borderWidth}px solid ${borderColor};box-shadow:0 2px 6px rgba(0,0,0,0.3);overflow:hidden;background:#f1f5f9;display:flex;align-items:center;justify-content:center;">
        <img src="${org.logoUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
        <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;background:#475569;color:#fff;font-size:${size * 0.35}px;font-weight:600;border-radius:50%;">${initials}</div>
      </div>`
    : `<div style="width:${size}px;height:${size}px;border-radius:50%;border:${borderWidth}px solid ${borderColor};box-shadow:0 2px 6px rgba(0,0,0,0.3);background:#475569;display:flex;align-items:center;justify-content:center;color:#fff;font-size:${size * 0.35}px;font-weight:600;">${initials}</div>`

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  })
}

export function OrgMap({ orgs, selectedOrgId, onOrgSelect }: OrgMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const prevOrgsRef = useRef<typeof orgs | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current).setView([20, 0], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update markers when orgs or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    // Add markers for orgs with coordinates
    const orgsWithCoords = orgs.filter((o) => o.coordinates)

    orgsWithCoords.forEach((org) => {
      const isSelected = org._id === selectedOrgId
      const icon = createOrgMarkerIcon(org, isSelected)

      const marker = L.marker([org.coordinates!.lat, org.coordinates!.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : 0,
      })
        .addTo(map)
        .bindPopup(
          `<b>${org.name}</b><br/>${[org.city, org.country].filter(Boolean).join(', ')}`,
        )
        .on('click', () => onOrgSelect(org._id))

      if (isSelected) {
        marker.openPopup()
      }

      markersRef.current.set(org._id.toString(), marker)
    })

    // Only fit bounds when the org list itself changes, not on selection
    const orgsChanged = prevOrgsRef.current !== orgs
    prevOrgsRef.current = orgs

    if (orgsChanged && orgsWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        orgsWithCoords.map((o) => [o.coordinates!.lat, o.coordinates!.lng]),
      )
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 })
    }
  }, [orgs, selectedOrgId, onOrgSelect])

  return (
    <div
      ref={mapRef}
      className="h-full w-full bg-slate-100 rounded-lg"
      style={{ minHeight: '400px' }}
    />
  )
}
