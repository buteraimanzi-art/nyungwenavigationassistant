import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Database } from '@/integrations/supabase/types';
import { NYUNGWE_POLYGON_LATLNG } from '@/lib/nyungwe-boundary';

type Alert = Database['public']['Tables']['emergency_alerts']['Row'];
type Status = Database['public']['Enums']['alert_status'];

const PARK_CENTER: [number, number] = [-2.45, 29.25];
const PARK_ZOOM = 11;

const STATUS_COLORS: Record<Status, string> = {
  new: '#dc2626',
  acknowledged: '#f59e0b',
  resolved: '#16a34a',
};

function alertIcon(status: Status, isNew: boolean) {
  const color = STATUS_COLORS[status];
  const pulse = isNew
    ? `<span style="position:absolute;inset:-6px;border-radius:9999px;background:${color};opacity:0.45;animation:alertPulse 1.4s ease-out infinite;"></span>`
    : '';
  return L.divIcon({
    html: `<div style="position:relative;width:28px;height:28px;">${pulse}<div style="position:relative;background:${color};color:white;border-radius:9999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);">!</div></div>
    <style>@keyframes alertPulse{0%{transform:scale(1);opacity:0.5}100%{transform:scale(2.4);opacity:0}}</style>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

interface AlertsMapProps {
  alerts: Alert[];
}

export function AlertsMap({ alerts }: AlertsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: PARK_CENTER,
      zoom: PARK_ZOOM,
      scrollWheelZoom: true,
    });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri',
      maxZoom: 19,
    }).addTo(map);
    L.polygon(NYUNGWE_POLYGON_LATLNG, {
      color: '#16a34a',
      weight: 2,
      fillOpacity: 0.05,
      dashArray: '6 6',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const located = alerts.filter((a) => a.latitude != null && a.longitude != null);
    if (located.length === 0) return;

    located.forEach((a) => {
      const marker = L.marker([a.latitude!, a.longitude!], {
        icon: alertIcon(a.status, a.status === 'new'),
        zIndexOffset: a.status === 'new' ? 1000 : 0,
      });
      const when = new Date(a.created_at).toLocaleString();
      const popup = `
        <div style="font-family:inherit;min-width:180px">
          <div style="font-weight:700;text-transform:capitalize;margin-bottom:2px">
            ${escapeHtml(a.issue_type)} — ${escapeHtml(a.trail_name ?? 'General')}
          </div>
          <div style="font-size:11px;color:#64748b;margin-bottom:6px">${escapeHtml(when)}</div>
          ${a.reporter_name ? `<div style="font-size:12px"><b>Reporter:</b> ${escapeHtml(a.reporter_name)}</div>` : ''}
          ${a.description ? `<div style="font-size:12px;margin-top:4px">${escapeHtml(a.description)}</div>` : ''}
          <div style="font-size:11px;margin-top:6px">
            <span style="display:inline-block;padding:2px 6px;border-radius:9999px;background:${STATUS_COLORS[a.status]};color:white;text-transform:capitalize">${a.status}</span>
          </div>
          <a href="https://www.google.com/maps?q=${a.latitude},${a.longitude}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:6px;font-size:11px;color:#2563eb">Open in Google Maps ↗</a>
        </div>`;
      marker.bindPopup(popup);
      marker.addTo(layer);
    });

    // Fit map to alerts (with park bounds fallback)
    if (located.length === 1) {
      map.setView([located[0].latitude!, located[0].longitude!], 14);
    } else {
      const bounds = L.latLngBounds(located.map((a) => [a.latitude!, a.longitude!] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [alerts]);

  return (
    <div className="relative w-full h-[420px] rounded-lg overflow-hidden border border-border">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
