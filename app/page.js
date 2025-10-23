'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import axiosInstance from '@/lib/axios';
import styles from './page.module.css';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Đang tải bản đồ...</div>
});

const CACHE_KEY = 'sukienquanhtoi_events';
const CACHE_EXPIRY_KEY = 'sukienquanhtoi_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export default function HomePage() {
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loadedBounds, setLoadedBounds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    city: 'hcm',
    search: '',
    type: '',
    date: '',
    status: 'upcoming'
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const loadTimeoutRef = useRef(null);
  const mapActionsRef = useRef(null);

  const cityCoords = {
    hcm: [10.776, 106.700],
    hanoi: [21.028, 105.834],
    danang: [16.047, 108.206],
  };

  // Cache functions
  const saveToCache = (events) => {
    try {
      const uniqueEvents = Array.from(
        new Map(events.map(e => [e.id, e])).values()
      );
      localStorage.setItem(CACHE_KEY, JSON.stringify(uniqueEvents));
      localStorage.setItem(CACHE_EXPIRY_KEY, Date.now() + CACHE_DURATION);
    } catch (e) {
      console.warn('Cache storage failed:', e);
    }
  };

  const getFromCache = () => {
    try {
      const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
      if (expiry && Date.now() > parseInt(expiry)) {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_EXPIRY_KEY);
        return [];
      }
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  };

  const mergeEvents = (existing, newEvents) => {
    const eventMap = new Map(existing.map(e => [e.id, e]));
    newEvents.forEach(event => eventMap.set(event.id, event));
    return Array.from(eventMap.values());
  };

  const expandBounds = (bounds, percentage = 0.3) => {
    const latDiff = (bounds.north - bounds.south) * percentage;
    const lngDiff = (bounds.east - bounds.west) * percentage;
    return {
      north: bounds.north + latDiff,
      south: bounds.south - latDiff,
      east: bounds.east + lngDiff,
      west: bounds.west - lngDiff
    };
  };

  const needsLoading = (newBounds) => {
    if (loadedBounds.length === 0) return true;
    for (const loaded of loadedBounds) {
      if (newBounds.north <= loaded.north &&
          newBounds.south >= loaded.south &&
          newBounds.east <= loaded.east &&
          newBounds.west >= loaded.west) {
        return false;
      }
    }
    return true;
  };

  const loadEvents = useCallback(async (bounds = null) => {
    if (isLoading) return;

    const cachedEvents = getFromCache();
    if (cachedEvents.length > 0 && allEvents.length === 0) {
      setAllEvents(cachedEvents);
    }

    if (bounds && !needsLoading(bounds)) {
      return;
    }

    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      
      if (bounds) {
        const expandedBounds = expandBounds(bounds, 0.3);
        params.append('bounds', JSON.stringify(expandedBounds));
        setLoadedBounds(prev => [...prev, expandedBounds]);
      }

      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);

      const response = await axiosInstance.get(`/events?${params.toString()}`);
      
      if (response.data.success) {
        const merged = mergeEvents(allEvents, response.data.events);
        setAllEvents(merged);
        saveToCache(merged);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [allEvents, filters, isLoading, loadedBounds]);

  const applyFilters = useCallback(() => {
    let filtered = [...allEvents];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(searchLower) ||
        e.address.toLowerCase().includes(searchLower)
      );
    }

    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters.date) {
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.startTime).toISOString().split('T')[0];
        return eventDate === filters.date;
      });
    }

    if (filters.status && filters.status !== 'all') {
      const now = new Date();
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.startTime);
        return filters.status === 'upcoming' ? eventDate >= now : eventDate < now;
      });
    }

    setFilteredEvents(filtered);
  }, [allEvents, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    // Load initial events
    const initialBounds = {
      north: 10.876,
      south: 10.676,
      east: 106.800,
      west: 106.600
    };
    loadEvents(initialBounds);
  }, []);

  useEffect(() => {
    const handleOpenModal = (e) => {
      const eventId = e.detail;
      const event = allEvents.find(ev => ev.id === eventId);
      if (event) {
        setCurrentEvent(event);
        setCurrentSlide(0);
      }
    };

    window.addEventListener('openEventModal', handleOpenModal);

    return () => {
      window.removeEventListener('openEventModal', handleOpenModal);
    };
  }, [allEvents]);

  useEffect(() => {
    if (mapActionsRef.current?.setViewToCity) {
      const coords = cityCoords[filters.city];
      if (coords) {
        mapActionsRef.current.setViewToCity(coords, 13);
      }
    }
  }, [filters.city]);

  const handleBoundsChange = (bounds) => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    loadTimeoutRef.current = setTimeout(() => {
      loadEvents(bounds);
    }, 500);
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const openModal = (eventId, focusMap = false) => {
    const event = allEvents.find(e => e.id === eventId);
    if (event) {
      if (focusMap && mapActionsRef.current?.focusOnEvent) {
        // Focus vào map và mở popup
        mapActionsRef.current.focusOnEvent(eventId);
      } else {
        // Mở modal như cũ
        setCurrentEvent(event);
        setCurrentSlide(0);
      }
    }
  };

  const closeModal = () => {
    setCurrentEvent(null);
  };

  const now = new Date();

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.menuToggle}
            onClick={() => setShowSidebar(!showSidebar)}
          >
            ☰
          </button>
          <div className={styles.logo}>
            <span>sukienquanhtoi</span>
          </div>
          <select 
            className={styles.citySelect}
            value={filters.city}
            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
          >
            <option value="hcm">TP. HCM</option>
            <option value="hanoi">Hà Nội</option>
            <option value="danang">Đà Nẵng</option>
          </select>
        </div>
        <div className={styles.navLinks}>
          <a href="#">Homepage</a>
          <a href="#">About</a>
          <button 
            className={styles.refreshBtn}
            onClick={() => {
              localStorage.removeItem(CACHE_KEY);
              localStorage.removeItem(CACHE_EXPIRY_KEY);
              setAllEvents([]);
              setLoadedBounds([]);
              window.location.reload();
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {showSidebar && <div className={styles.sidebarOverlay} onClick={() => setShowSidebar(false)} />}

      <div className={styles.content}>
        {/* Sidebar */}
        <div className={`${styles.sidebar} ${showSidebar ? styles.active : ''}`}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Khám phá sự kiện</h2>
            <p className={styles.sidebarSubtitle}>Tìm kiếm trải nghiệm độc đáo quanh bạn</p>
          </div>

          <div className={styles.searchBar}>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm sự kiện..."
                value={filters.search}
                onChange={handleSearchChange}
              />
            </div>
            <button 
              className={styles.filterBtn}
              onClick={() => setShowFilter(!showFilter)}
            >
              ⚙️
            </button>
          </div>

          <div className={styles.eventList}>
            {filteredEvents.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔍</div>
                <div className={styles.emptyText}>Không tìm thấy sự kiện</div>
                <div className={styles.emptySubtext}>Thử thay đổi bộ lọc hoặc tìm kiếm khác</div>
              </div>
            ) : (
              filteredEvents.map((event) => {
                const eventDate = new Date(event.startTime);
                const isPast = eventDate < now;
                
                return (
                  <div
                    key={event.id}
                    className={styles.eventItem}
                    style={{ opacity: isPast ? 0.6 : 1 }}
                    onClick={() => openModal(event.id, true)} 
                  >
                    <div 
                      className={styles.eventImg}
                      style={{ backgroundImage: `url(${event.bannerURL})` }}
                    >
                      <div className={styles.eventBadge}>
                        {isPast ? 'Đã qua' : 'Sắp diễn'}
                      </div>
                    </div>
                    <div className={styles.eventInfo}>
                      <h4>{event.title}</h4>
                      <div className={styles.eventMeta}>
                        <div className={styles.eventMetaItem}>
                          <span>📍</span>
                          <span>{event.address}</span>
                        </div>
                        <div className={styles.eventMetaItem}>
                          <span>📅</span>
                          <span>{eventDate.toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Map */}
        <MapView 
          events={filteredEvents}
          onBoundsChange={handleBoundsChange}
          onMarkerClick={mapActionsRef}
        />
      </div>

      {/* Filter Panel */}
      <div className={`${styles.filterPanel} ${showFilter ? styles.active : ''}`}>
        <h3>Bộ lọc sự kiện</h3>
        
        <div className={styles.filterGroup}>
          <label htmlFor="statusFilter">Trạng thái</label>
          <select
            id="statusFilter"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="upcoming">Sắp diễn ra</option>
            <option value="past">Đã qua</option>
            <option value="all">Tất cả</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="date">Ngày tổ chức</label>
          <input
            type="date"
            id="date"
            value={filters.date}
            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
          />
        </div>

        <button 
          className={styles.applyFilterBtn}
          onClick={() => {
            applyFilters();
            setShowFilter(false);
          }}
        >
          Áp dụng bộ lọc
        </button>
      </div>

      {/* Modal */}
      {currentEvent && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={closeModal}>✕</button>
            
            <div className={styles.sliderContainer}>
              <div 
                className={styles.slide}
                style={{ backgroundImage: `url(${currentEvent.bannerURL})` }}
              />
            </div>

            <div className={styles.modalBody}>
              <h2 className={styles.modalTitle}>{currentEvent.title}</h2>
              <div 
                className={`${styles.modalDescription} ql-editor`}
                dangerouslySetInnerHTML={{ __html: currentEvent.description }}
              />

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>📍</div>
                  <div className={styles.infoContent}>
                    <h5>Địa điểm</h5>
                    <p>{currentEvent.address}</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>📅</div>
                  <div className={styles.infoContent}>
                    <h5>Thời gian</h5>
                    <p>{new Date(currentEvent.startTime).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>🏢</div>
                  <div className={styles.infoContent}>
                    <h5>Đơn vị tổ chức</h5>
                    <p>{currentEvent.orgName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
