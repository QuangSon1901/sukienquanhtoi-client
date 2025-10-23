'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './MapView.module.css';

export default function MapView({ events, onBoundsChange, onMarkerClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerClusterRef = useRef(null);
  const markersMapRef = useRef(new Map());
  const [isMapReady, setIsMapReady] = useState(false);

  const focusOnEvent = useCallback((eventId) => {
    if (!mapInstanceRef.current || !markerClusterRef.current || !markersMapRef.current.has(eventId)) return;
    
    const marker = markersMapRef.current.get(eventId);
    const event = events.find(e => e.id === eventId);
    
    if (marker && event) {
      mapInstanceRef.current.setView([event.latitude, event.longitude], 18);
      
      setTimeout(() => {
        const visibleParent = markerClusterRef.current.getVisibleParent(marker);
        
        if (visibleParent instanceof L.MarkerCluster) {
          visibleParent.spiderfy();
          
          setTimeout(() => {
            marker.openPopup();
          }, 300);
        } else {
          marker.openPopup();
        }
      }, 500);
    }
  }, [events]);

  const setViewToCity = useCallback((coords, zoom = 13) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(coords, zoom);
  }, []);

  useEffect(() => {
    if (onMarkerClick) {
      onMarkerClick.current = { 
        focusOnEvent,
        setViewToCity 
      };
    }
  }, [focusOnEvent, setViewToCity, onMarkerClick]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet.markercluster');

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapRef.current) {
        const map = L.map(mapRef.current).setView([10.776, 106.700], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        markerClusterRef.current = L.markerClusterGroup({
          maxClusterRadius: 60,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          // disableClusteringAtZoom: 18,
          iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            return L.divIcon({
              html: `<div style="
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 16px;
                border: 3px solid white;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
              ">${count}</div>`,
              className: 'marker-cluster',
              iconSize: L.point(50, 50)
            });
          }
        });
        
        map.addLayer(markerClusterRef.current);
        mapInstanceRef.current = map;

        map.on('moveend', () => {
          const bounds = map.getBounds();
          onBoundsChange({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          });
        });

        setIsMapReady(true); // ✅ Set state khi map đã sẵn sàng
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setIsMapReady(false);
    };
  }, []);

  // ✅ Thêm isMapReady vào dependency array
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !markerClusterRef.current) return;

    const L = require('leaflet');
    const currentEventIds = new Set(events.map(e => e.id));

    // Xóa markers không còn trong list
    const markersToRemove = [];
    markersMapRef.current.forEach((marker, eventId) => {
      if (!currentEventIds.has(eventId)) {
        markersToRemove.push(eventId);
      }
    });

    markersToRemove.forEach(eventId => {
      const marker = markersMapRef.current.get(eventId);
      markerClusterRef.current.removeLayer(marker);
      markersMapRef.current.delete(eventId);
    });

    // Thêm markers mới
    events.forEach((event) => {
      if (!event.latitude || !event.longitude) return;
      if (markersMapRef.current.has(event.id)) return;

      const now = new Date();
      const eventDate = new Date(event.startTime);
      const isPast = eventDate < now;

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 52px; 
          height: 52px; 
          border-radius: 50%;
          background-image: url('${event.bannerURL}');
          background-size: cover;
          background-position: center;
          border: 3px solid ${isPast ? '#94a3b8' : '#fff'};
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          opacity: ${isPast ? 0.5 : 1};
        "></div>`,
        iconSize: [52, 52],
        iconAnchor: [26, 26],
      });

      const marker = L.marker([event.latitude, event.longitude], { icon });
      
      const popupContent = `
        <div class="${styles.eventPopup}">
          <img src="${event.bannerURL}" alt="${event.title}" style="opacity: ${isPast ? 0.6 : 1}">
          <div class="${styles.eventPopupContent}">
            <h4>${event.title}</h4>
            ${isPast ? '<p style="color:#ef4444;font-weight:600">⚠️ Sự kiện đã qua</p>' : ''}
            <p><strong>📍</strong> ${event.address}</p>
            <p><strong>📅</strong> ${new Date(event.startTime).toLocaleString('vi-VN')}</p>
            <button class="${styles.viewDetailBtn}" onclick="window.dispatchEvent(new CustomEvent('openEventModal', { detail: ${event.id} }))">
              Xem chi tiết
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markerClusterRef.current.addLayer(marker);
      markersMapRef.current.set(event.id, marker);
    });

    markerClusterRef.current.refreshClusters();
  }, [events, isMapReady]); // ✅ Thêm isMapReady vào dependency

  return <div ref={mapRef} className={styles.map} />;
}