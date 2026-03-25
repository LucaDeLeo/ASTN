<script lang="ts">
  import { onMount } from 'svelte'
  import type { Id } from '$convex/_generated/dataModel'
  import type { OrgDirectoryOrg } from './org-directory.types'
  import 'leaflet/dist/leaflet.css'
  import L from 'leaflet'

  let {
    orgs,
    selectedOrgId,
    onOrgSelect,
  }: {
    orgs: OrgDirectoryOrg[]
    selectedOrgId: Id<'organizations'> | null
    onOrgSelect: (id: Id<'organizations'>) => void
  } = $props()

  let mapElement = $state<HTMLDivElement | null>(null)
  let map = $state<L.Map | null>(null)
  let lastBoundsSignature = $state('')

  const markers = new Map<string, L.Marker>()

  function getInitials(name: string) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  function createOrgMarkerIcon(
    org: Pick<OrgDirectoryOrg, 'name' | 'logoUrl'>,
    isSelected: boolean,
  ) {
    const size = isSelected ? 48 : 40
    const borderWidth = isSelected ? 3 : 2
    const borderColor = isSelected ? '#f97316' : '#ffffff'
    const initials = getInitials(org.name)

    const html = org.logoUrl
      ? `<div style="width:${size}px;height:${size}px;border-radius:9999px;border:${borderWidth}px solid ${borderColor};box-shadow:0 8px 20px rgba(15,23,42,0.18);overflow:hidden;background:#f8fafc;display:flex;align-items:center;justify-content:center;">
          <img src="${org.logoUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;background:#334155;color:#fff;font-size:${size * 0.34}px;font-weight:700;border-radius:9999px;">${initials}</div>
        </div>`
      : `<div style="width:${size}px;height:${size}px;border-radius:9999px;border:${borderWidth}px solid ${borderColor};box-shadow:0 8px 20px rgba(15,23,42,0.18);background:#334155;display:flex;align-items:center;justify-content:center;color:#fff;font-size:${size * 0.34}px;font-weight:700;">${initials}</div>`

    return L.divIcon({
      html,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 4)],
    })
  }

  function clearMarkers() {
    for (const marker of markers.values()) {
      marker.remove()
    }
    markers.clear()
  }

  function updateMarkers() {
    if (!map) {
      return
    }

    clearMarkers()

    const orgsWithCoords = orgs.filter((org) => org.coordinates)

    for (const org of orgsWithCoords) {
      const isSelected = org._id === selectedOrgId
      const marker = L.marker([org.coordinates!.lat, org.coordinates!.lng], {
        icon: createOrgMarkerIcon(org, isSelected),
        zIndexOffset: isSelected ? 1000 : 0,
      })
        .addTo(map)
        .bindPopup(
          `<strong>${org.name}</strong><br />${[org.city, org.country]
            .filter(Boolean)
            .join(', ')}`,
        )
        .on('click', () => onOrgSelect(org._id))

      if (isSelected) {
        marker.openPopup()
      }

      markers.set(org._id.toString(), marker)
    }

    const signature = orgsWithCoords
      .map((org) => `${org._id}:${org.coordinates!.lat}:${org.coordinates!.lng}`)
      .join('|')

    if (signature && signature !== lastBoundsSignature) {
      const bounds = L.latLngBounds(
        orgsWithCoords.map((org) => [org.coordinates!.lat, org.coordinates!.lng]),
      )
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 9 })
      lastBoundsSignature = signature
    }
  }

  onMount(() => {
    if (!mapElement || map) {
      return
    }

    map = L.map(mapElement, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([20, 0], 2)

    L.control
      .zoom({
        position: 'bottomright',
      })
      .addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)

    updateMarkers()

    return () => {
      clearMarkers()
      map?.remove()
      map = null
    }
  })

  $effect(() => {
    orgs
    selectedOrgId
    updateMarkers()
  })
</script>

<div
  bind:this={mapElement}
  class="h-full min-h-[28rem] w-full overflow-hidden rounded-[2rem] border border-border/70 bg-slate-100 shadow-warm-sm"
></div>

