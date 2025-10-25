'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './MapView.module.css';

export default function MapView({ events, onBoundsChange, onMarkerClick, savedEvents = [], userLocation = null, children }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerClusterRef = useRef(null);
  const markersMapRef = useRef(new Map());
  const [isMapReady, setIsMapReady] = useState(false);

  const savedEventsRef = useRef(savedEvents);
  const userMarkerRef = useRef(null);

  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  const hasAutoCollapsed = useRef(false);

  const getEventBorderColor = (startTime) => {
    const now = new Date();
    const eventDate = new Date(startTime);
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    
    const diffTime = eventDay - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return '#94a3b8';
    } else if (diffDays === 0) {
      return '#ef4444';
    } else if (diffDays <= 7) {
      return '#f59e0b';
    } else {
      return '#3b82f6';
    }
  };

  const MapLegend = ({ isExpanded, onToggle }) => {

    return (
      <div 
        className={`${styles.mapLegend} ${isExpanded ? styles.expanded : styles.collapsed}`}
        onClick={onToggle}
      >
        <div className={styles.legendTitle}>
          Chú thích
          <span className={styles.legendToggle}>
            {isExpanded ? '−' : '+'}
          </span>
        </div>
        {isExpanded && (
        <div className={styles.legendItems}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#ef4444' }}></span>
            <span>Hôm nay</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#f59e0b' }}></span>
            <span>1-7 ngày tới</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#3b82f6' }}></span>
            <span>Xa hơn 7 ngày</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#94a3b8' }}></span>
            <span>Đã qua</span>
          </div>
          <div className={styles.legendItem}>
            <span style={{ fontSize: '16px' }}>❤️</span>
            <span>Đã yêu thích</span>
          </div>
        </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (!hasAutoCollapsed.current) {
      const timer = setTimeout(() => {
        setIsLegendExpanded(false);
        hasAutoCollapsed.current = true;
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const toggleLegend = () => {
    setIsLegendExpanded(!isLegendExpanded);
  };


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

    const savedChanged = JSON.stringify(savedEventsRef.current.sort()) !== JSON.stringify(savedEvents.sort());
    savedEventsRef.current = savedEvents;

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

    if (savedChanged) {
      markersMapRef.current.forEach((marker, eventId) => {
        markerClusterRef.current.removeLayer(marker);
        markersMapRef.current.delete(eventId);
      });
    }

    const now = new Date();

    // Thêm markers mới
    events.forEach((event) => {
      if (!event.latitude || !event.longitude) return;
      if (markersMapRef.current.has(event.id)) return;

      const eventDate = new Date(event.startTime);
      const isPast = eventDate < now;
      const isSaved = savedEvents.includes(event.id);
      const borderColor = getEventBorderColor(event.startTime);

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 52px; 
          height: 52px; 
          border-radius: 50%;
          background-image: url('${event.bannerURL}');
          background-size: cover;
          background-position: center;
          border: 3px solid ${borderColor};
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          opacity: ${isPast ? 0.5 : 1};
        "></div>
        ${isSaved ? `
              <div style="
                position: absolute;
                top: -4px;
                right: -4px;
                width: 20px;
                height: 20px;
                background: #ffffff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
              ">❤️</div>
            ` : ''}`,
        iconSize: [52, 52],
        iconAnchor: [26, 26],
      });

      const marker = L.marker([event.latitude, event.longitude], { icon });
      
      const popupContent = `
        <div class="${styles.eventPopup}">
          <img src="${event.bannerURL}" alt="${event.title}" style="opacity: ${isPast ? 0.6 : 1}">
          ${isSaved ? `
              <div style="
                position: absolute;
                top: 8px;
                left: 8px;
                background: rgba(239, 68, 68, 0.95);
                color: white;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              ">
                ❤️ Đã lưu
              </div>
            ` : ''}
          <div class="${styles.eventPopupContent}">
            <h4>${event.title}</h4>
            ${isPast ? '<p style="color:#ef4444;font-weight:600">⚠️ Sự kiện đã qua</p>' : ''}
            <p><strong>📍</strong> ${event.address}</p>
            <p><strong>📅</strong> ${new Date(event.startTime).toLocaleString('vi-VN', {
                    weekday: 'long',   // Thứ hai, Thứ ba, ...
                    day: '2-digit',    // 01–31
                    month: '2-digit',  // 01–12
                    year: 'numeric',   // 2025
                    hour: '2-digit',   // 00–23
                    minute: '2-digit', // 00–59
                  })}</p>
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
  }, [events, isMapReady, savedEvents]); // ✅ Thêm isMapReady vào dependency

  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    const L = require('leaflet');

    // Xóa marker cũ nếu có
    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    // Thêm marker mới nếu có userLocation
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <!-- Pulse animation circle -->
            <div style="
              position: absolute;
              width: 40px;
              height: 40px;
              background: rgba(59, 130, 246, 0.3);
              border-radius: 50%;
              animation: pulse 2s infinite;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            "></div>
            
            <!-- Inner dot -->
            <div style="
              position: relative;
              width: 16px;
              height: 16px;
              background: #3b82f6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              z-index: 1;
            "></div>
          </div>
          
          <style>
            @keyframes pulse {
              0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 0.8;
              }
              50% {
                transform: translate(-50%, -50%) scale(1.5);
                opacity: 0.4;
              }
              100% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 0.8;
              }
            }
          </style>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      userMarkerRef.current = L.marker(
        [userLocation.latitude, userLocation.longitude],
        { icon: userIcon, zIndexOffset: 1000 }
      ).addTo(mapInstanceRef.current);

      userMarkerRef.current.bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <div style="font-size: 24px; margin-bottom: 4px;">📍</div>
          <div style="font-weight: 600; font-size: 14px;">Vị trí của bạn</div>
        </div>
      `);
    }
  }, [userLocation, isMapReady]);

  return (
    <>
      <div ref={mapRef} className={styles.map} >{children}</div>
      <MapLegend isExpanded={isLegendExpanded} onToggle={toggleLegend} />
    </>
  );
}