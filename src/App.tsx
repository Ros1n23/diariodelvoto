import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { ParliamentaryCalendar } from './components/Calendar/ParliamentaryCalendar';
import { IniciativaCard } from './components/IniciativaCard/IniciativaCard';
import { MecenasBox } from './components/Mecenas/MecenasBox';
import type { LegalTab } from './components/LegalModal/LegalModal';
import { SAMPLE_INITIATIVES, getCalendarDaysForMonth, LATEST_SESSION_DATE } from './data/mockParliament';
import { 
  Radio, 
  History, 
  ArrowLeft, 
  Search, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
  Moon,
  Sun
} from 'lucide-react';

const LegalModal = lazy(() => import('./components/LegalModal/LegalModal').then((m) => ({ default: m.LegalModal })));

function getSystemDateIso(): string {
  try {
    return new Date().toLocaleDateString('en-CA');
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function getLatestDateForChamber(chamber: string = 'all'): string {
  const filtered = chamber === 'all'
    ? SAMPLE_INITIATIVES
    : SAMPLE_INITIATIVES.filter((i) => i.chamber === chamber);
  if (filtered.length === 0) return LATEST_SESSION_DATE || '2026-10-02';
  return filtered.reduce((max, i) => (i.date > max ? i.date : max), filtered[0].date);
}

function getDefaultHomeDate(chamber: string = 'all'): string {
  const todayIso = getSystemDateIso();
  const hasSessionToday = SAMPLE_INITIATIVES.some((i) => i.date === todayIso && (chamber === 'all' || i.chamber === chamber));
  return hasSessionToday ? todayIso : getLatestDateForChamber(chamber);
}

const MONTH_NAMES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatNewspaperDate(dateStr: string): { full: string; dayName: string; day: number; month: string; year: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayName = dayNames[date.getUTCDay()];
  const month = monthNames[date.getUTCMonth()];
  return {
    full: `${dayName.toUpperCase()}, ${d} DE ${month.toUpperCase()} DE ${y}`,
    dayName,
    day: d,
    month,
    year: y,
  };
}

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const TOP_CATEGORIES = ['Vivienda', 'Justicia', 'Economía', 'Tráfico', 'Empleo', 'Sanidad', 'Agricultura'];

export function App() {
  const [selectedChamber, setSelectedChamber] = useState<string>(() => {
    if (typeof window === 'undefined') return 'all';
    const c = new URLSearchParams(window.location.search).get('camara');
    return c && ['congreso', 'senado', 'europarl'].includes(c) ? c : 'all';
  });

  // Modo Oscuro / Edición Nocturna (Prensa Histórica)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('quevotan_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('quevotan_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const defaultHomeDate = useMemo(() => getDefaultHomeDate(selectedChamber), [selectedChamber]);
  const todayIso = useMemo(() => getSystemDateIso(), []);
  const hasSessionToday = useMemo(
    () => SAMPLE_INITIATIVES.some((i) => i.date === todayIso && (selectedChamber === 'all' || i.chamber === selectedChamber)),
    [todayIso, selectedChamber]
  );

  // Inicialización de estado con soporte directo para enlaces profundos (?date, ?initiative, ?camara, etc.)
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    if (typeof window === 'undefined') return getDefaultHomeDate('all');
    const params = new URLSearchParams(window.location.search);
    const chamberParam = params.get('camara');
    const chamber = chamberParam && ['congreso', 'senado', 'europarl'].includes(chamberParam) ? chamberParam : 'all';
    const chamberDefaultDate = getDefaultHomeDate(chamber);

    const initParam = params.get('initiative') || (window.location.hash ? window.location.hash.slice(1) : null);
    if (initParam) {
      const found = SAMPLE_INITIATIVES.find((i) => i.id === initParam);
      if (found) return found.date;
    }
    const dateParam = params.get('date');
    if (dateParam === 'todos') return null;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return dateParam;
    return chamberDefaultDate;
  });

  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('q') || '';
  });

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window === 'undefined') return 'all';
    return new URLSearchParams(window.location.search).get('materia') || 'all';
  });

  const [selectedStatus, setSelectedStatus] = useState<string>(() => {
    if (typeof window === 'undefined') return 'all';
    return new URLSearchParams(window.location.search).get('estado') || 'all';
  });

  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('initiative') || (window.location.hash ? window.location.hash.slice(1) : null);
  });

  // Estado del Almanaque desplegable (cerrado por defecto para no saturar)
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Control del Pliego Legal y Cumplimiento Normativo
  const [legalModalOpen, setLegalModalOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('legal');
  });

  const [legalModalTab, setLegalModalTab] = useState<LegalTab>(() => {
    if (typeof window === 'undefined') return 'aviso-legal';
    const l = new URLSearchParams(window.location.search).get('legal');
    if (l === 'privacidad' || l === 'cookies' || l === 'neutralidad' || l === 'aviso-legal' || l === 'mecenazgo') {
      return l;
    }
    return 'aviso-legal';
  });

  const handleOpenLegal = (tab: LegalTab) => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const initialDate = selectedDate || defaultHomeDate;
    if (initialDate) {
      const [y, m] = initialDate.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) return { year: y, month: m };
    }
    return { year: 2026, month: 10 };
  });

  // Salto suave a iniciativa si viene por URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('initiative') || (window.location.hash ? window.location.hash.slice(1) : null);
    if (targetId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, []);

  // Sincronizar estado con barra de direcciones
  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedDate === null) {
      params.set('date', 'todos');
    } else if (selectedDate !== defaultHomeDate) {
      params.set('date', selectedDate);
    }

    if (selectedChamber !== 'all') {
      params.set('camara', selectedChamber);
    }

    if (selectedCategory !== 'all') {
      params.set('materia', selectedCategory);
    }

    if (selectedStatus !== 'all') {
      params.set('estado', selectedStatus);
    }

    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }

    if (selectedInitiativeId && selectedInitiativeId !== 'all') {
      params.set('initiative', selectedInitiativeId);
    }

    if (legalModalOpen) {
      params.set('legal', legalModalTab);
    }

    const queryStr = params.toString();
    const newPath = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;
    window.history.replaceState(null, '', newPath);
  }, [selectedDate, selectedChamber, selectedCategory, selectedStatus, searchQuery, selectedInitiativeId, legalModalOpen, legalModalTab, defaultHomeDate]);

  // Manejo de retroceso/avance del navegador
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const chamberParam = params.get('camara') || 'all';
      setSelectedChamber(chamberParam);
      const chamberDefaultDate = getDefaultHomeDate(chamberParam);

      const dateParam = params.get('date');
      if (dateParam === 'todos') {
        setSelectedDate(null);
      } else if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        setSelectedDate(dateParam);
        const [y, m] = dateParam.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m)) setCalendarMonth({ year: y, month: m });
      } else {
        setSelectedDate(chamberDefaultDate);
      }

      setSelectedCategory(params.get('materia') || 'all');
      setSelectedStatus(params.get('estado') || 'all');
      setSelectedInitiativeId(params.get('initiative') || null);
      setSearchQuery(params.get('q') || '');
      setLegalModalOpen(params.has('legal'));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Atajos de teclado cívicos (/ para buscar, Esc para salir)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        const input = document.getElementById('main-search-input') as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
        }
      }
      if (e.key === 'Escape') {
        if (legalModalOpen) {
          setLegalModalOpen(false);
        } else if (searchQuery) {
          setSearchQuery('');
          (document.activeElement as HTMLElement)?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [legalModalOpen, searchQuery]);

  const calendarDays = useMemo(() => {
    return getCalendarDaysForMonth(calendarMonth.year, calendarMonth.month, todayIso, selectedChamber);
  }, [calendarMonth, todayIso, selectedChamber]);

  const otherCategories = useMemo(() => {
    const allCats = new Set(SAMPLE_INITIATIVES.map((i) => i.category));
    return Array.from(allCats).filter((c) => Boolean(c) && !TOP_CATEGORIES.includes(c)).sort();
  }, []);

  const isSearchActive = searchQuery.trim() !== '';
  const isSingleSessionMode = !isSearchActive && selectedDate !== null;

  // Base de iniciativas: si hay búsqueda activa o selectedDate es null, buscamos en todo el archivo
  const baseInitiatives = useMemo(() => {
    if (isSearchActive || !selectedDate) {
      return SAMPLE_INITIATIVES;
    }
    return SAMPLE_INITIATIVES.filter((i) => i.date === selectedDate);
  }, [selectedDate, isSearchActive]);

  // Filtrado por búsqueda o filtros
  const displayInitiatives = useMemo(() => {
    return baseInitiatives.filter((init) => {
      if (selectedCategory !== 'all' && init.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'all' && init.status !== selectedStatus) {
        return false;
      }
      if (selectedChamber !== 'all' && init.chamber !== selectedChamber) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const query = normalizeSearchText(searchQuery.trim());
        const matchesTitle = normalizeSearchText(init.title).includes(query);
        const matchesSummary = normalizeSearchText(init.summary).includes(query);
        const matchesOfficial = normalizeSearchText(init.officialTitle || '').includes(query);
        const matchesCategory = normalizeSearchText(init.category).includes(query);
        const matchesMeasures = (init.measures || []).some(
          (m) =>
            normalizeSearchText(m.title).includes(query) ||
            normalizeSearchText(m.plainDescription).includes(query) ||
            normalizeSearchText(m.realWorldExample || '').includes(query)
        );
        if (!matchesTitle && !matchesSummary && !matchesOfficial && !matchesCategory && !matchesMeasures) {
          return false;
        }
      }
      return true;
    });
  }, [baseInitiatives, selectedCategory, selectedStatus, selectedChamber, searchQuery]);

  const activeInitiativeId = useMemo(() => {
    if (!isSingleSessionMode) return 'all';
    if (selectedInitiativeId === 'all') return 'all';
    if (selectedInitiativeId && displayInitiatives.some((i) => i.id === selectedInitiativeId)) {
      return selectedInitiativeId;
    }
    return displayInitiatives[0]?.id || null;
  }, [selectedInitiativeId, displayInitiatives, isSingleSessionMode]);

  const visibleInitiatives = useMemo(() => {
    if (activeInitiativeId === 'all' || !isSingleSessionMode) return displayInitiatives;
    const found = displayInitiatives.find((i) => i.id === activeInitiativeId);
    return found ? [found] : displayInitiatives;
  }, [displayInitiatives, activeInitiativeId, isSingleSessionMode]);

  const activeTelegramInitiative = useMemo(() => {
    return visibleInitiatives[0] || displayInitiatives[0] || baseInitiatives[0] || null;
  }, [visibleInitiatives, displayInitiatives, baseInitiatives]);

  const activeDateInfo = useMemo(() => {
    return formatNewspaperDate(selectedDate || defaultHomeDate);
  }, [selectedDate, defaultHomeDate]);

  const latestDateInfo = useMemo(() => {
    return formatNewspaperDate(defaultHomeDate);
  }, [defaultHomeDate]);

  const isTodayEdition = Boolean(hasSessionToday && selectedDate === todayIso);
  const isLatestEdition = Boolean(selectedDate === defaultHomeDate || isTodayEdition);

  // Fechas cronológicas oficiales con plenos según la cámara seleccionada
  const sessionDates = useMemo(() => {
    const pool = selectedChamber === 'all' 
      ? SAMPLE_INITIATIVES 
      : SAMPLE_INITIATIVES.filter((i) => i.chamber === selectedChamber);
    return Array.from(new Set(pool.map((i) => i.date))).sort();
  }, [selectedChamber]);

  const currentDateIndex = useMemo(() => {
    if (!selectedDate) return -1;
    return sessionDates.indexOf(selectedDate);
  }, [selectedDate, sessionDates]);

  const prevSessionDate = currentDateIndex > 0 ? sessionDates[currentDateIndex - 1] : null;
  const nextSessionDate = currentDateIndex >= 0 && currentDateIndex < sessionDates.length - 1 ? sessionDates[currentDateIndex + 1] : null;

  const navigateToDate = (targetDate: string) => {
    setSelectedDate(targetDate);
    setSelectedInitiativeId(null);
    const [y, m] = targetDate.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m)) {
      setCalendarMonth({ year: y, month: m });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectChamber = (cId: string) => {
    setSelectedChamber(cId);
    if (selectedDate) {
      const hasSessionForChamber = SAMPLE_INITIATIVES.some(
        (i) => i.date === selectedDate && (cId === 'all' || i.chamber === cId)
      );
      const wasAtLatest = selectedDate === getDefaultHomeDate(selectedChamber);
      if (!hasSessionForChamber || wasAtLatest) {
        const targetDate = getDefaultHomeDate(cId);
        navigateToDate(targetDate);
      }
    }
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'all') return;
    if (selectedDate) {
      const hasCatOnDate = SAMPLE_INITIATIVES.some(
        (i) => i.date === selectedDate && i.category === cat && (selectedChamber === 'all' || i.chamber === selectedChamber)
      );
      if (!hasCatOnDate) {
        const matching = SAMPLE_INITIATIVES.filter(
          (i) => i.category === cat && (selectedChamber === 'all' || i.chamber === selectedChamber)
        );
        if (matching.length > 0) {
          const latestCatDate = matching.reduce((max, i) => (i.date > max ? i.date : max), matching[0].date);
          navigateToDate(latestCatDate);
        }
      }
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedChamber('all');
    setSelectedInitiativeId(null);
    navigateToDate(getDefaultHomeDate('all'));
  };

  // Detección de conectividad PWA Offline
  const [isOffline, setIsOffline] = useState(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const chamberCounts = useMemo(() => {
    const congreso = SAMPLE_INITIATIVES.filter((i) => !i.chamber || i.chamber === 'congreso').length;
    const senado = SAMPLE_INITIATIVES.filter((i) => i.chamber === 'senado').length;
    const europarl = SAMPLE_INITIATIVES.filter((i) => i.chamber === 'europarl').length;
    return { congreso, senado, europarl, total: SAMPLE_INITIATIVES.length };
  }, []);

  const fallbackRecentInitiative = useMemo(() => {
    return SAMPLE_INITIATIVES.find((i) => i.status === 'aprobado' || i.status === 'rechazado') || SAMPLE_INITIATIVES[0];
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#1B1A17] flex flex-col font-editorial">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#8F1D1D] focus:text-[#FFFFFF] focus:font-typewriter focus:font-bold focus:shadow-[2px_2px_0px_#1B1A17] focus:border-2 focus:border-[#1B1A17]"
      >
        Saltar al contenido principal
      </a>

      {isOffline && (
        <div className="bg-[#1B1A17] text-[#FAF7EE] py-1.5 px-4 text-center font-typewriter text-xs flex items-center justify-center gap-2 border-b border-[#FAF7EE]/30">
          <span className="w-2 h-2 rounded-full bg-[#E5A93B] animate-pulse"></span>
          <span>
            <strong>EDICIÓN ALMACENADA (MODO SIN CONEXIÓN)</strong> · Navegando la hemeroteca guardada en su dispositivo.
          </span>
        </div>
      )}

      {/* Cintillo Superior de Edición (Top Folio Bar) */}
      <div className="border-b border-[#1B1A17] bg-[#FAF7EE] py-1 px-4 text-center font-typewriter text-[11px] uppercase tracking-wider text-[#4E4B44]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <span className="font-bold">
            {isTodayEdition 
              ? '★ EDICIÓN EN DIRECTO DEL DÍA ★' 
              : isSearchActive
              ? '🔍 BÚSQUEDA EN EL ARCHIVO HISTÓRICO'
              : !selectedDate
              ? '🏛️ ARCHIVO HISTÓRICO PARLAMENTARIO COMPLETO'
              : isLatestEdition 
              ? '★ ÚLTIMA SESIÓN PARLAMENTARIA REGISTRADA ★' 
              : '🏛️ CONSULTA DE HEMEROTECA / EDICIÓN ARCHIVADA'}
          </span>
          <span className="font-bold text-[#1B1A17]">
            {selectedDate && !isSearchActive ? `MADRID · ${activeDateInfo.full}` : 'MADRID · ARCHIVO PARLAMENTARIO'}
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="text-[#1B1A17] hover:text-[#8F1D1D] font-bold transition cursor-pointer flex items-center gap-1.5 px-2 py-0.5 border border-[#1B1A17] text-[10px] sm:text-[11px] bg-[#FFFFFF] shadow-[1px_1px_0px_#1B1A17]"
              title={theme === 'dark' ? 'Cambiar a Edición Matutina (Modo Claro)' : 'Cambiar a Edición Nocturna (Modo Oscuro)'}
              aria-label={theme === 'dark' ? 'Cambiar a Edición Matutina' : 'Cambiar a Edición Nocturna'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3 h-3 text-[#FBBF24]" />
                  <span>Edición Matutina</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-[#553C7B]" />
                  <span>Edición Nocturna</span>
                </>
              )}
            </button>
            <span className="hidden md:inline">·</span>
            <button
              onClick={() => window.print()}
              className="hidden md:flex text-[#1B1A17] hover:text-[#8F1D1D] hover:underline font-bold transition cursor-pointer items-center gap-1"
              title="Imprimir esta tirada en formato papel"
            >
              <Printer className="w-3.5 h-3.5 text-[#8F1D1D]" />
              <span>Imprimir tirada</span>
            </button>
            <span className="hidden md:inline">·</span>
            <button
              onClick={() => handleOpenLegal('aviso-legal')}
              className="hidden md:inline text-[#8F1D1D] hover:underline font-bold transition cursor-pointer"
            >
              Marco Legal y Neutralidad
            </button>
          </div>
        </div>
      </div>

      {/* Cabecera Compacta y Elegante */}
      <header className="border-b-4 border-double border-[#1B1A17] bg-[#FBF8F1] pt-4 pb-3">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-1">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-[#6E695F] font-bold block">
            DIARIO CÍVICO DE LAS CORTES GENERALES · CONTROL DEMOCRÁTICO
          </span>
          <h1 
            onClick={handleClearFilters}
            className="text-5xl sm:text-6xl md:text-7xl font-masthead font-normal tracking-tight text-[#1B1A17] select-none hover:opacity-90 transition-opacity cursor-pointer leading-none"
            title="Haga clic para volver a la última sesión parlamentaria"
          >
            QueVotan
          </h1>
          <p className="text-xs sm:text-sm font-headline italic tracking-wide text-[#4E4B44]">
            Explicar sin tecnicismos qué votan las Cámaras y cómo afecta a tu día a día
          </p>

          {/* Telegrama Dinámico de 1 línea */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-typewriter overflow-hidden max-w-3xl mx-auto">
            <span className="font-bold px-1.5 py-0.5 bg-[#8F1D1D] text-[#FFFFFF] tracking-wider uppercase shrink-0 flex items-center gap-1 text-[10px]">
              <Radio className="w-3 h-3 animate-pulse" /> TELEGRAMA:
            </span>
            <span className="text-[#1B1A17] truncate italic text-xs">
              {activeTelegramInitiative
                ? `${activeTelegramInitiative.title}: ${
                    activeTelegramInitiative.status === 'aprobado'
                      ? 'Convalidada y aprobada por el Pleno.'
                      : activeTelegramInitiative.status === 'rechazado'
                      ? 'Rechazada por la Cámara.'
                      : 'En tramitación parlamentaria.'
                  }`
                : 'Consulta oficial del archivo parlamentario escrutado.'}
            </span>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main id="main-content" tabIndex={-1} className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 w-full focus:outline-none">
        {/* Aviso de Edición Archivada o Búsqueda Activa */}
        {isSearchActive ? (
          <div className="p-3 bg-[#FAF7EE] border-2 border-[#1B1A17] shadow-[2px_2px_0px_#1B1A17] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-typewriter">
            <div className="flex items-center gap-2 text-[#1B1A17]">
              <Search className="w-4 h-4 text-[#8F1D1D]" />
              <span>
                Buscando en todo el archivo histórico: <strong>"{searchQuery}"</strong> ({displayInitiatives.length} {displayInitiatives.length === 1 ? 'coincidencia' : 'coincidencias'})
              </span>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="px-2.5 py-1 bg-[#1B1A17] text-[#FFFFFF] font-bold uppercase tracking-wider hover:bg-[#8F1D1D] transition shadow-[1px_1px_0px_#1B1A17] cursor-pointer"
            >
              ✕ Cerrar búsqueda
            </button>
          </div>
        ) : !selectedDate ? (
          <div className="p-3 bg-[#FAF7EE] border-2 border-[#1B1A17] shadow-[2px_2px_0px_#1B1A17] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-typewriter">
            <div className="flex items-center gap-2 text-[#1B1A17]">
              <History className="w-4 h-4 text-[#8F1D1D]" />
              <span>
                Consultando el <strong>archivo parlamentario completo</strong> ({displayInitiatives.length} votaciones registradas).
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedDate(defaultHomeDate);
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#8F1D1D] text-[#FFFFFF] font-bold uppercase tracking-wider hover:bg-[#6E1616] transition shadow-[1px_1px_0px_#1B1A17] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a la Última Sesión ({latestDateInfo.day} de {latestDateInfo.month})
            </button>
          </div>
        ) : !isLatestEdition ? (
          <div className="p-3 bg-[#FAF7EE] border-2 border-[#1B1A17] shadow-[2px_2px_0px_#1B1A17] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-typewriter">
            <div className="flex items-center gap-2 text-[#1B1A17]">
              <History className="w-4 h-4 text-[#8F1D1D]" />
              <span>
                Está consultando la edición archivada del <strong>{activeDateInfo.full}</strong>.
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedDate(defaultHomeDate);
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#8F1D1D] text-[#FFFFFF] font-bold uppercase tracking-wider hover:bg-[#6E1616] transition shadow-[1px_1px_0px_#1B1A17] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a la Última Sesión ({latestDateInfo.day} de {latestDateInfo.month})
            </button>
          </div>
        ) : null}

        {/* ============================================================== */}
        {/* BARRA DE LA SESIÓN Y NAVEGACIÓN DIRECTA                        */}
        {/* ============================================================== */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-[#1B1A17] gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#8F1D1D] block">
                {isSearchActive
                  ? 'BÚSQUEDA GLOBAL'
                  : !selectedDate
                  ? 'HEMEROTECA HISTÓRICA COMPLETA'
                  : isTodayEdition
                  ? 'PLENARIO DEL DÍA EN CURSO'
                  : isLatestEdition
                  ? 'ÚLTIMA SESIÓN CELEBRADA'
                  : 'EDICIÓN ARCHIVADA'}
              </span>
              <h2 className="text-xl sm:text-2xl font-headline font-bold text-[#1B1A17]">
                {isSearchActive
                  ? `Resultados para "${searchQuery}"`
                  : selectedDate
                  ? activeDateInfo.full
                  : `Hemeroteca Completa (${displayInitiatives.length} votaciones)`}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-typewriter text-xs">
              {!selectedDate || isSearchActive ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDate(defaultHomeDate);
                    setSelectedInitiativeId(null);
                  }}
                  className="px-3 py-1 bg-[#8F1D1D] text-[#FFFFFF] font-bold transition flex items-center gap-1.5 shadow-[1px_1px_0px_#1B1A17] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a la última sesión</span>
                </button>
              ) : (
                <>
                  {prevSessionDate && (
                    <button
                      onClick={() => navigateToDate(prevSessionDate)}
                      className="px-2.5 py-1 border border-[#1B1A17] bg-[#FAF7EE] hover:bg-[#1B1A17] hover:text-[#FFFFFF] transition flex items-center gap-1 font-bold text-xs shadow-[1px_1px_0px_#1B1A17] cursor-pointer"
                      title={`Ver sesión previa del ${prevSessionDate}`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-[#8F1D1D]" />
                      <span>Anterior</span>
                    </button>
                  )}

                  {nextSessionDate && (
                    <button
                      onClick={() => navigateToDate(nextSessionDate)}
                      className="px-2.5 py-1 border border-[#1B1A17] bg-[#FAF7EE] hover:bg-[#1B1A17] hover:text-[#FFFFFF] transition flex items-center gap-1 font-bold text-xs shadow-[1px_1px_0px_#1B1A17] cursor-pointer"
                      title={`Ver sesión posterior del ${nextSessionDate}`}
                    >
                      <span>Posterior</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8F1D1D]" />
                    </button>
                  )}

                  <button
                    onClick={() => setCalendarOpen(!calendarOpen)}
                    className={`px-3 py-1 border-2 border-[#1B1A17] font-bold text-xs transition flex items-center gap-1.5 shadow-[1px_1px_0px_#1B1A17] cursor-pointer ${
                      calendarOpen
                        ? 'bg-[#1B1A17] text-[#FAF7EE]'
                        : 'bg-[#FAF7EE] text-[#1B1A17] hover:bg-[#EDE6D6]'
                    }`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>Almanaque ({sessionDates.length} plenos)</span>
                    {calendarOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Almanaque Desplegable (Solo si el usuario lo solicita) */}
          {calendarOpen && (
            <div className="animate-fadeIn p-4 bg-[#FAF7EE] border-2 border-[#1B1A17] shadow-[3px_3px_0px_#1B1A17]">
              <ParliamentaryCalendar
                days={calendarDays}
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  if (date) {
                    const [y, m] = date.split('-').map(Number);
                    if (m !== calendarMonth.month || y !== calendarMonth.year) {
                      setCalendarMonth({ year: y, month: m });
                    }
                  }
                }}
                currentMonthName={MONTH_NAMES[calendarMonth.month]}
                year={calendarMonth.year}
                month={calendarMonth.month}
                onChangeMonth={(y, m) => setCalendarMonth({ year: y, month: m })}
                todayDate={todayIso}
                latestDate={defaultHomeDate}
                isTodaySession={hasSessionToday}
              />
            </div>
          )}

          {/* Barra de Filtros Rápidos y Buscador */}
          <div className="bg-[#FAF7EE] border-2 border-[#1B1A17] p-3 shadow-[2px_2px_0px_#1B1A17] space-y-2.5">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Selector de Cámaras */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs font-typewriter pb-1 md:pb-0">
                <span className="font-bold text-[#6E695F] mr-1 uppercase text-[10px] shrink-0">Cámara:</span>
                {[
                  { id: 'all', label: 'Todas' },
                  { id: 'congreso', label: `Congreso (${chamberCounts.congreso})` },
                  { id: 'senado', label: `Senado (${chamberCounts.senado})` },
                  { id: 'europarl', label: `Europarl (${chamberCounts.europarl})` },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectChamber(c.id)}
                    className={`px-2 py-0.5 font-bold border text-xs transition shrink-0 cursor-pointer ${
                      selectedChamber === c.id
                        ? 'bg-[#1B1A17] text-[#FAF7EE] border-[#1B1A17]'
                        : 'bg-[#FFFFFF] text-[#1B1A17] border-[#D8D1C3] hover:border-[#1B1A17]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Buscador Compacto */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-[#6E695F] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="main-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar asunto (vivienda, alquiler)... [/]"
                  aria-label="Buscar iniciativa"
                  className="w-full pl-8 pr-7 py-1 bg-[#FFFFFF] border border-[#1B1A17] text-xs font-editorial text-[#1B1A17] placeholder-[#8C877D] focus:outline-none focus:ring-1 focus:ring-[#1B1A17]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8F1D1D] text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Píldoras de Tema / Materia */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-typewriter pt-1 border-t border-[#E5DFD3] pb-0.5">
              <span className="font-bold text-[#6E695F] mr-1 uppercase text-[10px] shrink-0">Materia:</span>
              <button
                onClick={() => handleSelectCategory('all')}
                className={`px-2 py-0.5 text-[11px] font-semibold border transition shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#8F1D1D] text-[#FFFFFF] border-[#8F1D1D]'
                    : 'bg-[#FFFFFF] text-[#4E4B44] border-[#D8D1C3] hover:border-[#1B1A17]'
                }`}
              >
                Todas
              </button>
              {TOP_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className={`px-2 py-0.5 text-[11px] font-semibold border transition shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#8F1D1D] text-[#FFFFFF] border-[#8F1D1D]'
                      : 'bg-[#FFFFFF] text-[#4E4B44] border-[#D8D1C3] hover:border-[#1B1A17]'
                  }`}
                >
                  {cat}
                </button>
              ))}

              {/* Selector compacto para el resto de materias */}
              <div className="relative shrink-0">
                <select
                  value={otherCategories.includes(selectedCategory) ? selectedCategory : ''}
                  onChange={(e) => {
                    if (e.target.value) handleSelectCategory(e.target.value);
                  }}
                  className={`px-2 py-0.5 text-[11px] font-semibold border transition cursor-pointer appearance-none pr-5 ${
                    otherCategories.includes(selectedCategory)
                      ? 'bg-[#8F1D1D] text-[#FFFFFF] border-[#8F1D1D]'
                      : 'bg-[#FFFFFF] text-[#4E4B44] border-[#D8D1C3] hover:border-[#1B1A17]'
                  }`}
                  aria-label="Más materias"
                >
                  <option value="" className="bg-[#FFFFFF] text-[#1B1A17]">
                    {otherCategories.includes(selectedCategory) ? `Materia: ${selectedCategory}` : '+ Más materias...'}
                  </option>
                  {otherCategories.map((c) => (
                    <option key={c} value={c} className="bg-[#FFFFFF] text-[#1B1A17]">
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className={`w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  otherCategories.includes(selectedCategory) ? 'text-[#FFFFFF]' : 'text-[#6E695F]'
                }`} />
              </div>

              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="ml-auto text-[11px] text-[#8F1D1D] hover:underline font-bold shrink-0 cursor-pointer"
                >
                  [ Ver archivo completo ]
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* MECENAS CÍVICO DE LA GACETA (PATROCINIO CON REGLAS DE IMPRENTA)*/}
        {/* ============================================================== */}
        <MecenasBox onOpenLegal={() => handleOpenLegal('mecenazgo')} />

        {/* ============================================================== */}
        {/* LISTADO DE VOTACIONES (DIVULGACIÓN PROGRESIVA)                 */}
        {/* ============================================================== */}
        <section id="session-initiatives-view" className="space-y-6">
          {displayInitiatives.length > 0 ? (
            <div className="space-y-6">
              {/* Selector de Leyes del Pleno (Sub-pestañas de sesión) cuando hay más de una votación en una sesión específica */}
              {isSingleSessionMode && displayInitiatives.length > 1 && (
                <div className="bg-[#FAF7EE] border-2 border-[#1B1A17] p-3.5 shadow-[2px_2px_0px_#1B1A17] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-[#D8D1C3]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#8F1D1D] text-[#FFFFFF]">
                        ORDEN DEL DÍA
                      </span>
                      <span className="font-typewriter text-xs font-bold text-[#1B1A17]">
                        {displayInitiatives.length} votaciones celebradas en esta sesión:
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedInitiativeId(activeInitiativeId === 'all' ? (displayInitiatives[0]?.id || null) : 'all')}
                      className={`font-typewriter text-xs font-bold underline transition cursor-pointer self-start sm:self-auto ${
                        activeInitiativeId === 'all' ? 'text-[#8F1D1D]' : 'text-[#4E4B44] hover:text-[#1B1A17]'
                      }`}
                    >
                      {activeInitiativeId === 'all' ? '← Volver a ver una por una' : 'Ver todas juntas en vertical'}
                    </button>
                  </div>

                  {/* Botonera de Asuntos del Pleno */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 font-typewriter">
                    {displayInitiatives.map((init, idx) => {
                      const isSelected = activeInitiativeId === init.id;
                      const isAprobada = init.status === 'aprobado';
                      const isRechazada = init.status === 'rechazado';
                      const votes = init.votesSummary;

                      return (
                        <button
                          key={init.id}
                          onClick={() => {
                            setSelectedInitiativeId(init.id);
                          }}
                          className={`p-3 text-left border-2 transition cursor-pointer flex flex-col justify-between gap-2 shadow-[2px_2px_0px_#1B1A17] ${
                            isSelected
                              ? 'bg-[#FFFFFF] border-[#8F1D1D] ring-2 ring-[#8F1D1D]/30'
                              : 'bg-[#F4EFE6] border-[#1B1A17] hover:bg-[#FFFFFF]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[11px] font-bold text-[#8F1D1D] uppercase">
                              ASUNTO #{idx + 1}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 border uppercase ${
                              isAprobada 
                                ? 'bg-[#F6FAF5] text-[#1F4D36] border-[#1F4D36]' 
                                : isRechazada 
                                ? 'bg-[#FAF4F4] text-[#8F1D1D] border-[#8F1D1D]' 
                                : 'bg-[#FAF7EE] text-[#4E4B44] border-[#4E4B44]'
                            }`}>
                              {isAprobada ? '✓ Convalidada' : isRechazada ? '✕ Rechazada' : 'En debate'}
                            </span>
                          </div>

                          <h4 className="font-headline font-bold text-sm text-[#1B1A17] leading-tight line-clamp-2">
                            {init.title}
                          </h4>

                          <div className="flex items-center justify-between text-[11px] text-[#6E695F] pt-1.5 border-t border-[#D8D1C3]">
                            <span className="truncate max-w-[140px] font-semibold">{init.category}</span>
                            {votes && (
                              <span className="font-mono font-bold text-[#1B1A17]">
                                {votes.si} SÍ / {votes.no} NO
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tarjetas de iniciativa (la seleccionada o todas si activó ver todas) */}
              {visibleInitiatives.map((init) => (
                <IniciativaCard key={init.id} initiative={init} />
              ))}
            </div>
          ) : baseInitiatives.length > 0 ? (
            /* Filtros no arrojaron resultados */
            <div className="bg-[#FFFFFF] border-2 border-[#1B1A17] p-6 shadow-[2px_2px_0px_#1B1A17] text-center space-y-3">
              <span className="font-typewriter text-xs font-bold px-2.5 py-0.5 border border-[#8F1D1D] bg-[#FDF8F8] text-[#8F1D1D] uppercase">
                Sin coincidencias
              </span>
              <p className="font-editorial text-sm text-[#4E4B44]">
                Ninguna votación coincide con los filtros aplicados {searchQuery ? `("${searchQuery}")` : ''} {selectedCategory !== 'all' ? `(materia: ${selectedCategory})` : ''} {selectedChamber !== 'all' ? `(cámara: ${selectedChamber})` : ''}.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="px-3 py-1.5 bg-[#8F1D1D] text-[#FFFFFF] font-typewriter text-xs font-bold uppercase tracking-wider hover:bg-[#6E1616] transition cursor-pointer shadow-[1px_1px_0px_#1B1A17]"
                  >
                    Buscar en toda la hemeroteca
                  </button>
                )}
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-1.5 bg-[#1B1A17] text-[#FFFFFF] font-typewriter text-xs font-bold uppercase tracking-wider hover:bg-[#8F1D1D] transition cursor-pointer"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          ) : (
            /* No hubo pleno en esta fecha */
            <div className="bg-[#FFFFFF] border-2 border-[#1B1A17] p-6 shadow-[2px_2px_0px_#1B1A17] text-center space-y-4">
              <span className="font-typewriter text-xs font-bold px-2.5 py-0.5 border border-[#6E695F] bg-[#FAF7EE] text-[#4E4B44] uppercase">
                Sin sesión plenaria
              </span>
              <p className="font-editorial text-sm text-[#4E4B44]">
                No se celebraron votaciones en la sesión del {activeDateInfo.full}.
              </p>
              {prevSessionDate && (
                <button
                  onClick={() => navigateToDate(prevSessionDate)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1B1A17] bg-[#FAF7EE] hover:bg-[#1B1A17] hover:text-[#FFFFFF] text-xs font-typewriter font-bold transition shadow-[1px_1px_0px_#1B1A17] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#8F1D1D]" />
                  <span>Ir a la última sesión celebrada ({prevSessionDate})</span>
                </button>
              )}
              <div className="text-left pt-4 border-t border-[#D8D1C3]">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8F1D1D] block mb-2">
                  VOTACIÓN DESTACADA DE LA HEMEROTECA:
                </span>
                <IniciativaCard initiative={fallbackRecentInitiative} />
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Pie de Página Editorial */}
      <footer className="border-t-4 border-double border-[#1B1A17] bg-[#FAF7EE] py-6 text-center text-xs font-typewriter text-[#6E695F] space-y-3 mt-8">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <p className="font-bold text-[#1B1A17] tracking-widest uppercase">
            ✦ QUEVOTAN · DIARIO CÍVICO DE LAS CORTES GENERALES ✦
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-typewriter">
            <button
              onClick={() => handleOpenLegal('aviso-legal')}
              className="text-[#1B1A17] hover:text-[#8F1D1D] hover:underline transition font-bold cursor-pointer"
            >
              Aviso Legal (LSSI-CE)
            </button>
            <span className="text-[#A49F93]">·</span>
            <button
              onClick={() => handleOpenLegal('privacidad')}
              className="text-[#1B1A17] hover:text-[#1F4D36] hover:underline transition font-bold cursor-pointer"
            >
              Privacidad (RGPD)
            </button>
            <span className="text-[#A49F93]">·</span>
            <button
              onClick={() => handleOpenLegal('cookies')}
              className="text-[#1B1A17] hover:text-[#A26815] hover:underline transition font-bold cursor-pointer"
            >
              Cero Rastreadores
            </button>
            <span className="text-[#A49F93]">·</span>
            <button
              onClick={() => handleOpenLegal('neutralidad')}
              className="text-[#1B1A17] hover:text-[#1B365D] hover:underline transition font-bold cursor-pointer"
            >
              Neutralidad y Fuentes Oficiales
            </button>
            <span className="text-[#A49F93]">·</span>
            <button
              onClick={() => handleOpenLegal('mecenazgo')}
              className="text-[#1B1A17] hover:text-[#8F1D1D] hover:underline transition font-bold cursor-pointer"
            >
              Mecenazgo Cívico
            </button>
            <span className="text-[#A49F93]">·</span>
            <button
              onClick={toggleTheme}
              className="text-[#1B1A17] hover:text-[#8F1D1D] hover:underline transition font-bold cursor-pointer inline-flex items-center gap-1"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3 h-3 text-[#FBBF24]" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-[#553C7B]" />
                  <span>Modo Oscuro</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-[#8C877D]">
            Fuentes Oficiales Primarias: BOCG, Diario de Sesiones y Datos Abiertos del Congreso y Senado
          </p>
        </div>
      </footer>

      {legalModalOpen && (
        <Suspense fallback={null}>
          <LegalModal
            key={legalModalTab}
            isOpen={legalModalOpen}
            initialTab={legalModalTab}
            onClose={() => setLegalModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
