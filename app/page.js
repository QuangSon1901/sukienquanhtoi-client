'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import axiosInstance from '@/lib/axios';
import styles from './page.module.css';

import Select from 'react-select';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import vi from 'date-fns/locale/vi';

registerLocale('vi', vi);

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Đang tải bản đồ...</div>
});

const CACHE_KEY = 'sukienquanhtoi_events';
const CACHE_EXPIRY_KEY = 'sukienquanhtoi_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const cityOptions = [
  { value: 'hanoi', label: 'TP. Hà Nội' },
  { value: 'hcm', label: 'TP. Hồ Chí Minh' },
  { value: 'haiphong', label: 'TP. Hải Phòng' },
  { value: 'danang', label: 'TP. Đà Nẵng' },
  { value: 'cantho', label: 'TP. Cần Thơ' },
  { value: 'angiang', label: 'An Giang' },
  { value: 'bacgiang', label: 'Bắc Giang' },
  { value: 'backan', label: 'Bắc Kạn' },
  { value: 'baclieu', label: 'Bạc Liêu' },
  { value: 'bacninh', label: 'Bắc Ninh' },
  { value: 'bariavungtau', label: 'Bà Rịa - Vũng Tàu' },
  { value: 'bentre', label: 'Bến Tre' },
  { value: 'binhdinh', label: 'Bình Định' },
  { value: 'binhduong', label: 'Bình Dương' },
  { value: 'binhphuoc', label: 'Bình Phước' },
  { value: 'binhthuan', label: 'Bình Thuận' },
  { value: 'camau', label: 'Cà Mau' },
  { value: 'caobang', label: 'Cao Bằng' },
  { value: 'daklak', label: 'Đắk Lắk' },
  { value: 'daknong', label: 'Đắk Nông' },
  { value: 'dienbien', label: 'Điện Biên' },
  { value: 'dongnai', label: 'Đồng Nai' },
  { value: 'dongthap', label: 'Đồng Tháp' },
  { value: 'gialai', label: 'Gia Lai' },
  { value: 'hagiang', label: 'Hà Giang' },
  { value: 'hanam', label: 'Hà Nam' },
  { value: 'hatinh', label: 'Hà Tĩnh' },
  { value: 'haiduong', label: 'Hải Dương' },
  { value: 'haugiang', label: 'Hậu Giang' },
  { value: 'hoabinh', label: 'Hòa Bình' },
  { value: 'hungyen', label: 'Hưng Yên' },
  { value: 'khanhhoa', label: 'Khánh Hòa' },
  { value: 'kiengiang', label: 'Kiên Giang' },
  { value: 'kontum', label: 'Kon Tum' },
  { value: 'laichau', label: 'Lai Châu' },
  { value: 'lamdong', label: 'Lâm Đồng' },
  { value: 'langson', label: 'Lạng Sơn' },
  { value: 'laocai', label: 'Lào Cai' },
  { value: 'longan', label: 'Long An' },
  { value: 'namdinh', label: 'Nam Định' },
  { value: 'nghean', label: 'Nghệ An' },
  { value: 'ninhbinh', label: 'Ninh Bình' },
  { value: 'ninhthuan', label: 'Ninh Thuận' },
  { value: 'phutho', label: 'Phú Thọ' },
  { value: 'phuyen', label: 'Phú Yên' },
  { value: 'quangbinh', label: 'Quảng Bình' },
  { value: 'quangnam', label: 'Quảng Nam' },
  { value: 'quangngai', label: 'Quảng Ngãi' },
  { value: 'quangninh', label: 'Quảng Ninh' },
  { value: 'quangtri', label: 'Quảng Trị' },
  { value: 'soctrang', label: 'Sóc Trăng' },
  { value: 'sonla', label: 'Sơn La' },
  { value: 'tayninh', label: 'Tây Ninh' },
  { value: 'thaibinh', label: 'Thái Bình' },
  { value: 'thainguyen', label: 'Thái Nguyên' },
  { value: 'thanhhoa', label: 'Thanh Hóa' },
  { value: 'thuathienhue', label: 'Thừa Thiên - Huế' },
  { value: 'tiengiang', label: 'Tiền Giang' },
  { value: 'travinh', label: 'Trà Vinh' },
  { value: 'tuyenquang', label: 'Tuyên Quang' },
  { value: 'vinhlong', label: 'Vĩnh Long' },
  { value: 'vinhphuc', label: 'Vĩnh Phúc' },
  { value: 'yenbai', label: 'Yên Bái' }
];

const cityCoords = {
  hanoi: [21.028, 105.834],
  hcm: [10.776, 106.700],
  haiphong: [20.865, 106.683],
  danang: [16.047, 108.206],
  cantho: [10.045, 105.746],
  
  angiang: [10.521, 105.125],
  bacgiang: [21.273, 106.194],
  backan: [22.146, 105.834],
  baclieu: [9.294, 105.724],
  bacninh: [21.186, 106.076],
  bariavungtau: [10.411, 107.136],
  bentre: [10.243, 106.375],
  binhdinh: [13.782, 109.219],
  binhduong: [11.173, 106.671],
  binhphuoc: [11.751, 106.723],
  binhthuan: [10.980, 108.261],
  camau: [9.176, 105.152],
  caobang: [22.666, 106.259],
  daklak: [12.710, 108.237],
  daknong: [12.264, 107.609],
  dienbien: [21.386, 103.018],
  dongnai: [10.957, 107.013],
  dongthap: [10.456, 105.634],
  gialai: [13.983, 108.000],
  hagiang: [22.823, 104.983],
  hanam: [20.541, 105.917],
  hatinh: [18.343, 105.905],
  haiduong: [20.938, 106.330],
  haugiang: [9.783, 105.467],
  hoabinh: [20.817, 105.337],
  hungyen: [20.646, 106.051],
  khanhhoa: [12.258, 109.053],
  kiengiang: [10.012, 105.080],
  kontum: [14.350, 108.000],
  laichau: [22.400, 103.400],
  lamdong: [11.940, 108.460],
  langson: [21.855, 106.758],
  laocai: [22.485, 103.970],
  longan: [10.695, 106.243],
  namdinh: [20.438, 106.177],
  nghean: [18.673, 105.692],
  ninhbinh: [20.254, 105.975],
  ninhthuan: [11.567, 108.988],
  phutho: [21.323, 105.402],
  phuyen: [13.088, 109.093],
  quangbinh: [17.468, 106.623],
  quangnam: [15.539, 108.019],
  quangngai: [15.120, 108.792],
  quangninh: [21.006, 107.292],
  quangtri: [16.747, 107.188],
  soctrang: [9.602, 105.973],
  sonla: [21.327, 103.905],
  tayninh: [11.323, 106.110],
  thaibinh: [20.450, 106.340],
  thainguyen: [21.593, 105.848],
  thanhhoa: [19.807, 105.776],
  thuathienhue: [16.463, 107.590],
  tiengiang: [10.449, 106.342],
  travinh: [9.933, 106.345],
  tuyenquang: [21.820, 105.214],
  vinhlong: [10.253, 105.972],
  vinhphuc: [21.309, 105.606],
  yenbai: [21.705, 104.875],
};

const statusOptions = [
  { value: 'upcoming', label: 'Sắp diễn ra' },
  { value: 'past', label: 'Đã qua' },
  { value: 'all', label: 'Tất cả' }
];

const modeOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'online', label: 'Sự kiện online' },
  { value: 'offline', label: 'Sự kiện offline' },
];

const typeOptions = [
  { value: 'concert', label: '🎵 Concert' },
  { value: 'tea_room', label: '☕ Phòng trà' },
  { value: 'workshop', label: '🎨 Workshop' },
  { value: 'seminar', label: '📚 Hội thảo' },
  { value: 'exhibition', label: '🖼️ Triển lãm' },
  { value: 'festival', label: '🎉 Lễ hội' },
  { value: 'sport', label: '⚽ Thể thao' },
  { value: 'food', label: '🍜 Ẩm thực' },
  { value: 'charity', label: '❤️ Từ thiện' },
  { value: 'networking', label: '🤝 Giao lưu' },
  { value: 'theater', label: '🎭 Sân khấu' },
  { value: 'movie', label: '🎬 Phim ảnh' },
  { value: 'market', label: '🛍️ Chợ/Hội chợ' },
  { value: 'education', label: '📖 Giáo dục' },
  { value: 'tech', label: '💻 Công nghệ' },
  { value: 'other', label: '📌 Khác' }
];

const popularityOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'hot', label: 'HOT' }
];

const ticketOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'paid', label: 'Có phí' },
  { value: 'free', label: 'Miễn phí' }
];

export default function MainPage() {
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loadedBounds, setLoadedBounds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    city: 'hcm',
    search: '',
    type: '',
    date: '',
    mode: 'all',
    types: '',
    status: 'upcoming',
    popularity: 'all',
    ticketType: 'all'
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState([]); 

  const [userLocation, setUserLocation] = useState(null);
  const [savedEvents, setSavedEvents] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('saved_events') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  const [quickFilter, setQuickFilter] = useState('all');

  const loadTimeoutRef = useRef(null);
  const mapActionsRef = useRef(null);
  const isLoadingRef = useRef(false);
  const allEventsRef = useRef([]);

  useEffect(() => {
    allEventsRef.current = allEvents;
  }, [allEvents]);

  // Cache functions
  const saveToCache = useCallback((events) => {
    try {
      const uniqueEvents = Array.from(
        new Map(events.map(e => [e.id, e])).values()
      );
      localStorage.setItem(CACHE_KEY, JSON.stringify(uniqueEvents));
      localStorage.setItem(CACHE_EXPIRY_KEY, Date.now() + CACHE_DURATION);
    } catch (e) {
      console.warn('Cache storage failed:', e);
    }
  }, []);

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

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      fontSize: '14px',
      fontWeight: 500,
      padding: '2px 8px',
      border: state.isFocused ? '2px solid var(--primary)' : '2px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface)',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
      minHeight: '44px',
      '&:hover': {
        borderColor: 'var(--primary-light)'
      }
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '14px',
      fontWeight: 500,
      backgroundColor: state.isSelected 
        ? 'var(--primary)' 
        : state.isFocused 
          ? 'var(--surface-hover)' 
          : 'white',
      color: state.isSelected ? 'white' : 'var(--text-primary)',
      '&:active': {
        backgroundColor: 'var(--primary-light)'
      }
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      border: '2px solid var(--border)'
    })
  };

  // Style riêng cho filter panel - nhỏ gọn hơn
  const filterSelectStyles = {
    control: (base, state) => ({
      ...base,
      fontSize: '14px',
      fontWeight: 500,
      padding: '0px 8px',
      border: state.isFocused ? '2px solid var(--primary)' : '2px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-dim)',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(99, 102, 241, 0.1)' : 'none',
      minHeight: '44px',
      '&:hover': {
        borderColor: 'var(--primary-light)'
      }
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '14px',
      fontWeight: 500,
      backgroundColor: state.isSelected 
        ? 'var(--primary)' 
        : state.isFocused 
          ? 'var(--surface-hover)' 
          : 'white',
      color: state.isSelected ? 'white' : 'var(--text-primary)',
      '&:active': {
        backgroundColor: 'var(--primary-light)'
      }
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      border: '2px solid var(--border)'
    })
  };

  const filterMultiSelectStyles = {
    control: (base, state) => ({
      ...base,
      fontSize: '14px',
      fontWeight: 500,
      padding: '4px 8px',
      border: state.isFocused ? '2px solid var(--primary)' : '2px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-dim)',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(99, 102, 241, 0.1)' : 'none',
      minHeight: '44px',
      '&:hover': {
        borderColor: 'var(--primary-light)'
      }
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '14px',
      fontWeight: 500,
      backgroundColor: state.isSelected 
        ? 'var(--primary)' 
        : state.isFocused 
          ? 'var(--surface-hover)' 
          : 'white',
      color: state.isSelected ? 'white' : 'var(--text-primary)',
      '&:active': {
        backgroundColor: 'var(--primary-light)'
      }
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      border: '2px solid var(--border)'
    })
  };

  const loadEvents = useCallback(async (bounds = null, forceReload = false) => {

    if (isLoadingRef.current) {
      console.log('Already loading, skip...');
      return;
    }

    const cachedEvents = getFromCache();
    if (cachedEvents.length > 0 && allEventsRef.current.length === 0) {
      setAllEvents(cachedEvents);
      allEventsRef.current = cachedEvents;
    }

    if (bounds && !forceReload && !needsLoading(bounds, loadedBounds)) {
      console.log('Bounds already loaded, skip...');
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const filtersParams = filters;
      const params = new URLSearchParams();
      
      if (bounds) {
        const expandedBounds = expandBounds(bounds, 0.3);
        params.append('bounds', JSON.stringify(expandedBounds));
        setLoadedBounds(prev => [...prev, expandedBounds]);
      }

      params.append('search', filtersParams.search);
      params.append('status', 'all');

      const response = await axiosInstance.get(`/events?${params.toString()}`);
      
      if (response.data.success) {
        const merged = mergeEvents(allEventsRef.current, response.data.events);
        setAllEvents(merged);
        allEventsRef.current = merged;
        saveToCache(merged);
        console.log('Events loaded:', merged.length);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [expandBounds, needsLoading, loadedBounds, getFromCache, mergeEvents, saveToCache]); // ✅ Chỉ giữ filters cần thiết

  useEffect(() => {
    setLoadedBounds([]);
    
    const timeoutId = setTimeout(() => {
      loadEvents(null, true);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  const applyFilters = useCallback(() => {
    let filtered = [...allEvents];

    if (quickFilter === 'saved') {
      filtered = filtered.filter(e => savedEvents.includes(e.id));
    } else if (quickFilter === 'today') {
      const now = new Date();
      const vietnamDate = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const today = vietnamDate.toISOString().split('T')[0];
      
      filtered = filtered.filter(e => {
        const eventDateTime = new Date(e.startTime);
        const eventVietnamDate = new Date(eventDateTime.getTime() + (7 * 60 * 60 * 1000));
        const eventDate = eventVietnamDate.toISOString().split('T')[0];
        
        return eventDate === today;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(e =>
        e.title?.toLowerCase().includes(searchLower) ||
        e.address?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters.types && filters.types.length > 0) {
      filtered = filtered.filter(e => filters.types.includes(e.type));
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

    if (filters.mode && filters.mode !== 'all') {
      filtered = filtered.filter(e => e.mode === filters.mode);
    }

    if (filters.popularity && filters.popularity !== 'all') {
      filtered = filtered.filter(e => e.isHot === (filters.popularity === 'hot'));
    }

    if (filters.ticketType && filters.ticketType !== 'all') {
      filtered = filtered.filter(e => e.ticketType === filters.ticketType);
    }

    setFilteredEvents(filtered);
  }, [allEvents, filters, quickFilter, savedEvents]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    const initialBounds = {
      north: 10.876,
      south: 10.676,
      east: 106.800,
      west: 106.600
    };
    loadEvents(initialBounds);
  }, [loadEvents]);

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
        setShowSidebar(false);
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

  const toggleSaveEvent = useCallback((eventId) => {
    setSavedEvents(prev => {
      const newSaved = prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId];
      
      try {
        localStorage.setItem('saved_events', JSON.stringify(newSaved));
      } catch (e) {
        console.error('Failed to save:', e);
      }
      
      return newSaved;
    });
  }, []);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ định vị');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        
        if (mapActionsRef.current?.setViewToCity) {
          mapActionsRef.current.setViewToCity([latitude, longitude], 15);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Không thể truy cập vị trí. Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt.');
      }
    );
  }, []);

  const getDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const shareEvent = useCallback((event) => {
    const shareData = {
      title: event.title,
      text: `Tham gia sự kiện: ${event.title}`,
      url: `${window.location.origin}?event=${event.id}`
    };

    if (navigator.share) {
      navigator.share(shareData).catch(err => console.log('Share failed:', err));
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(shareData.url)
        .then(() => alert('Đã sao chép link!'))
        .catch(() => alert('Không thể chia sẻ'));
    }
  }, []);

  const now = new Date();

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <a href="/" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}><img style={{height: '2.5rem'}} src="/assets/logos/logo-header.png?v1.0.1" alt="NiceTech" /></a>
          </div>
          <Select
            instanceId="city-select"
            value={cityOptions.find(opt => opt.value === filters.city)}
            onChange={(option) => setFilters(prev => ({ ...prev, city: option.value }))}
            options={cityOptions}
            styles={customSelectStyles}
            placeholder="Chọn thành phố"
            isSearchable
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
        <div className={styles.navLinks}>
          <a href="/home">Trang chủ</a>
          <a href="/contact">Liên hệ</a>
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
            <img style={{height: '18px', width: '18px'}} src="/assets/icons/reload-icon.svg" alt="Refresh Page" />
          </button>
        </div>
      </header>

      {showSidebar && <div className={styles.sidebarOverlay} onClick={() => setShowSidebar(false)} />}

      <div className={styles.content}>
        {/* Sidebar */}
        <div className={`${styles.sidebar} ${showSidebar ? styles.active : ''}`}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarHeaderMain}>
              <h2 className={styles.sidebarHeaderH2}>Khám phá sự kiện</h2>
              <button className={styles.sidebarClose} onClick={() => setShowSidebar(!showSidebar)}>✕</button>
            </div>
            <p className={styles.sidebarSubtitle}>Tìm kiếm trải nghiệm độc đáo xung quanh bạn</p>
          </div>

          <div className={styles.searchBar}>
            <div className={styles.searchWrapper}>
              <img className={styles.searchIcon} src="/assets/icons/search-icon.svg" alt="Search Events" />
              <input
                type="text"
                placeholder="Tìm sự kiện, nghệ sĩ..."
                value={filters.search}
                onChange={handleSearchChange}
              />
            </div>
            <button 
              className={styles.filterBtn}
              onClick={() => setShowFilter(!showFilter)}
            >
              <img style={{height: '30px', width: '30px'}} src="/assets/icons/filter-list-icon.svg" alt="Filter Events" />
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
                const isSaved = savedEvents.includes(event.id);

                let distance = null;
                if (userLocation && event.latitude && event.longitude) {
                  distance = getDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    event.latitude,
                    event.longitude
                  );
                }
                
                return (
                  <div
                    key={event.id}
                    className={styles.eventItem}
                    style={{ opacity: isPast ? 0.6 : 1 }}
                    onClick={() => openModal(event.id, event.type == 1)} 
                  >
                    <div 
                      className={styles.eventImg}
                      style={{ backgroundImage: `url(${event.bannerURL})` }}
                    >
                      <div className={styles.eventBadge}>
                        {isPast ? 'Đã qua' : 'Sắp diễn ra'}
                      </div>
                      {isSaved && <button
                        className={styles.saveEventBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveEvent(event.id);
                        }}
                      >
                        ❤️
                      </button>}
                    </div>
                    <div className={styles.eventInfo}>
                      <h4>{event.title}</h4>
                      <div className={styles.eventMeta}>
                        <div className={styles.eventMetaItem}>
                          <span>📍</span>
                          <span>{event.type == 1 ? event.address : 'Online'}</span>
                          {distance !== null && (
                            <span style={{ marginLeft: '4px', color: 'var(--primary)', fontWeight: 600 }}>
                              ({distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`})
                            </span>
                          )}
                        </div>
                        <div className={styles.eventMetaItem}>
                          <span>📅</span>
                          <span>{eventDate.toLocaleString('vi-VN', {
                    weekday: 'long',   // Thứ hai, Thứ ba, ...
                    day: '2-digit',    // 01–31
                    month: '2-digit',  // 01–12
                    year: 'numeric',   // 2025
                    hour: '2-digit',   // 00–23
                    minute: '2-digit', // 00–59
                  })}</span>
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
          savedEvents={savedEvents}
          userLocation={userLocation}
        >
          <div className={styles.quickFilters}>
            <button 
              className={`${styles.quickFilterBtn} ${quickFilter === 'all' ? styles.active : ''}`}
              onClick={() => setQuickFilter('all')}
            >
              <span>🗺️</span>
              <span>Tất cả</span>
            </button>
            <button 
              className={`${styles.quickFilterBtn} ${quickFilter === 'saved' ? styles.active : ''}`}
              onClick={() => setQuickFilter('saved')}
            >
              <span>❤️</span>
              <span>Yêu thích</span>
            </button>
            <button 
              className={`${styles.quickFilterBtn} ${quickFilter === 'today' ? styles.active : ''}`}
              onClick={() => setQuickFilter('today')}
            >
              <span>📅</span>
              <span>Hôm nay</span>
            </button>
          </div>
        </MapView>

        

        <button 
          className={styles.locationBtn}
          onClick={handleMyLocation}
        >
          <img style={{height: '18px', width: '18px'}} src="/assets/icons/my-location-icon.svg" alt="Refresh Page" />
        </button>

        <button 
          className={styles.menuToggle}
          onClick={() => setShowSidebar(!showSidebar)}
        >
          ☰
        </button>
      </div>

      {/* Filter Panel */}
      <div className={`${styles.filterPanel} ${showFilter ? styles.active : ''}`}>
        <div className={styles.filterHead}>
          <h3 style={{marginBottom: '0'}}>Bộ lọc sự kiện</h3>
          <button className={styles.filterClose} onClick={() => {setShowFilter(false);}}>✕</button>
        </div>

        <div className={styles.filterBody}>
          <div className={styles.filterGroup}>
            <label>Ngày diễn ra</label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                if (date) {
                  const formattedDate = date.toISOString().split('T')[0];
                  setFilters(prev => ({ ...prev, date: formattedDate }));
                } else {
                  setFilters(prev => ({ ...prev, date: '' }));
                }
              }}
              dateFormat="dd/MM/yyyy"
              locale="vi"
              placeholderText="Chọn ngày diễn ra sự kiện"
              className={styles.datePickerInput}
              isClearable
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Thể loại sự kiện</label>
            <Select
              instanceId="type-select"
              value={selectedTypes}
              onChange={(selected) => {
                setSelectedTypes(selected || []);
                const typeValues = selected ? selected.map(opt => opt.value) : [];
                setFilters(prev => ({ ...prev, types: typeValues }));
              }}
              options={typeOptions}
              styles={filterMultiSelectStyles}
              placeholder="Concert, workshop, hội thảo..."
              isSearchable={true}
              isMulti={true} // ✅ Enable multi-select
              closeMenuOnSelect={false} // Giữ menu mở khi chọn
              hideSelectedOptions={false} // Hiện option đã chọn với checkmark
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Hình thức tổ chức (Trực tiếp hoặc online...)</label>
            <Select
              instanceId="mode-select" // ✅ Fix hydration error
              value={modeOptions.find(opt => opt.value === filters.mode)}
              onChange={(option) => setFilters(prev => ({ ...prev, mode: option.value }))}
              options={modeOptions}
              styles={filterSelectStyles}
              placeholder="Trực tiếp hoặc online..."
              isSearchable={false}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label>Trạng thái (Sắp diễn ra, đã qua...)</label>
            <Select
              instanceId="status-select" // ✅ Fix hydration error
              value={statusOptions.find(opt => opt.value === filters.status)}
              onChange={(option) => setFilters(prev => ({ ...prev, status: option.value }))}
              options={statusOptions}
              styles={filterSelectStyles}
              placeholder="Sắp diễn ra, đã qua..."
              isSearchable={false}
            />

          </div>
          
          <div className={styles.filterGroup}>
            <label>Độ nổi bật (Phổ biến, nổi bật...)</label>
            <Select
              instanceId="popularity-select"
              value={popularityOptions.find(opt => opt.value === filters.popularity)}
              onChange={(option) => setFilters(prev => ({ ...prev, popularity: option.value }))}
              options={popularityOptions}
              styles={filterSelectStyles}
              placeholder="Phổ biến, nổi bật..."
              isSearchable={false}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Loại vé (Miễn phí, trả phí...)</label>
            <Select
              instanceId="ticket-select"
              value={ticketOptions.find(opt => opt.value === filters.ticketType)}
              onChange={(option) => setFilters(prev => ({ ...prev, ticketType: option.value }))}
              options={ticketOptions}
              styles={filterSelectStyles}
              placeholder="Miễn phí, trả phí..."
              isSearchable={false}
            />
          </div>

        </div>

        <div className={styles.filterFoot}>
          
          <button 
            className={styles.applyFilterBtn}
            onClick={() => {
              applyFilters();
              setShowFilter(false);
            }}
          >
            Áp dụng bộ lọc
          </button>
          <button 
            className={styles.clearFilterBtn}
            onClick={() => {
              setFilters({city: 'hcm',search: '',type: '',date: '',mode: 'all',types: '',status: 'upcoming',popularity: 'all',ticketType: 'all'});
              setSelectedDate(null);
              setSelectedTypes([]);
              setShowFilter(false);
            }}
          >
            Xóa lọc
          </button>
        </div>
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
              <div className={styles.modalTopTitle}>
                <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}><img style={{height: '16px', width: '16px'}} src="/assets/icons/time-icon.svg" alt="Like Event" /> {new Date(currentEvent.startTime).toLocaleString('vi-VN', {
                    weekday: 'long',   // Thứ hai, Thứ ba, ...
                    day: '2-digit',    // 01–31
                    month: '2-digit',  // 01–12
                    year: 'numeric',   // 2025
                    hour: '2-digit',   // 00–23
                    minute: '2-digit', // 00–59
                  })}</span>
                <div className={styles.modalTopTitleAction}>
                  <span onClick={() => toggleSaveEvent(currentEvent.id)} className={`${styles.actionLikeEvent} ${savedEvents.includes(currentEvent.id) ? styles.actionLikeEvent_active : ''}`} style={{display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'}}> {savedEvents.includes(currentEvent.id) ? <img style={{height: '16px', width: '16px'}} src="/assets/icons/loved-icon.svg" alt="Like Event" /> : <img style={{height: '16px', width: '16px'}} src="/assets/icons/love-icon.svg" alt="Like Event" />} Yêu thích</span>
                  <span onClick={() => shareEvent(currentEvent)} className={styles.actionShareEvent} style={{display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'}}><img style={{height: '16px', width: '16px'}} src="/assets/icons/share-icon.svg" alt="Like Event" /> Chia sẻ</span>
                </div>
              </div>
              <h2 className={styles.modalTitle}>{currentEvent.title}</h2>
              <div className={styles.modalOrg}>
                <img src={currentEvent.orgLogoURL} alt="orgLogoURL" />
                <p>{currentEvent.orgName}</p>
              </div>
              <div className={styles.modalBodySection}>
                <p className={styles.modalBodySectionHead}>Thời gian <a href='#'>+ Thêm vào lịch</a></p>
                <p className={styles.modalBodySectionContent}>&nbsp;&nbsp;📅&nbsp;&nbsp;&nbsp;{new Date(currentEvent.startTime).toLocaleString('vi-VN', {
                    weekday: 'long',   // Thứ hai, Thứ ba, ...
                    day: '2-digit',    // 01–31
                    month: '2-digit',  // 01–12
                    year: 'numeric',   // 2025
                    hour: '2-digit',   // 00–23
                    minute: '2-digit', // 00–59
                  })}</p>
              </div>
              <div className={styles.modalBodySection}>
                <p className={styles.modalBodySectionHead}>Địa điểm {currentEvent.type == 1 ? <a href='#'>+ Mở bản đồ</a> : ''}</p>
                <p className={styles.modalBodySectionContent}>&nbsp;&nbsp;📍&nbsp;&nbsp;&nbsp;{currentEvent.type == 1 ? currentEvent.address : 'Online'}</p>
              </div>
              <div 
                className={`${styles.modalDescription} ql-editor`}
                dangerouslySetInnerHTML={{ __html: currentEvent.description }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
