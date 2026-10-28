import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import schoolsData from '../data/schools.json';
import playersData from '../data/players.json';
import demoData from '../data/demo-players.json';
import galleryData from '../data/gallery.json';

const DataContext = createContext(null);
const DEMO_KEY = 'combine-demo';

function readDemoFlag() {
  try {
    return sessionStorage.getItem(DEMO_KEY) === '1';
  } catch {
    return false;
  }
}

function writeDemoFlag(on) {
  try {
    if (on) sessionStorage.setItem(DEMO_KEY, '1');
    else sessionStorage.removeItem(DEMO_KEY);
  } catch {
    /* storage unavailable */
  }
}

const isPublic = (item) => item.publish !== false;

export function DataProvider({ children }) {
  const { search } = useLocation();
  const [demo, setDemo] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('demo');
    if (p === '1') return true;
    if (p === '0') return false;
    return readDemoFlag();
  });

  useEffect(() => {
    const p = new URLSearchParams(search).get('demo');
    if (p === '1') setDemo(true);
    if (p === '0') setDemo(false);
  }, [search]);

  useEffect(() => writeDemoFlag(demo), [demo]);

  const value = useMemo(() => {
    const schools = schoolsData.schools;
    const schoolsById = Object.fromEntries(schools.map((s) => [s.id, s]));
    const source = demo ? demoData : playersData;
    const players = source.players.filter(isPublic).filter((p) => schoolsById[p.schoolId]);
    return {
      demo,
      schools,
      schoolsById,
      players,
      playersById: Object.fromEntries(players.map((p) => [p.id, p])),
      updatedAt: source.updatedAt,
      // 학교별 현장 사진 앨범 (scripts/build-gallery.mjs가 생성)
      galleryAlbums: galleryData.albums ?? [],
    };
  }, [demo]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
