import React, { useState, useEffect } from 'react';
import LandingPage from '../components/home/LandingPage';
import { Gamepad2, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const SUPABASE_ASSETS_BASE = `${cleanUrl}/storage/v1/object/public/assets`;

const SUPABASE_HERO_BASE = `${cleanUrl}/storage/v1/object/public/Hero`;

const HERO_IMAGES = [
  `${SUPABASE_HERO_BASE}/VALORANT%20i.jpg`,
  `${SUPABASE_HERO_BASE}/AC%20i.jpg`,
  `${SUPABASE_HERO_BASE}/AC%20ii.jpg`,
  `${SUPABASE_HERO_BASE}/DOTA%20iii.webp`,
  `${SUPABASE_HERO_BASE}/FC%20ii.jpg`,
  `${SUPABASE_HERO_BASE}/PUBG%20i.jpg`,
  `${SUPABASE_HERO_BASE}/OVERWATCH%20ii.webp`
];

const SECTION_IMAGES = {
  performanceTracking: `${SUPABASE_ASSETS_BASE}/DASHBOARD.png?v=${Date.now()}`,
  teammateReviews: `${SUPABASE_ASSETS_BASE}/TEAMMATES.webp`,
  rosterManagement: `${SUPABASE_ASSETS_BASE}/ROSTER%20M.avif`,
  verifiedResumes: `${SUPABASE_ASSETS_BASE}/PROFILES.png`
};

const getPublicImageUrl = (fileName) => {
  const { data } = supabase.storage.from('assets').getPublicUrl(fileName);
  return data.publicUrl;
};

let cachedImages = null;

/**
 * Home - Low Coupling Route Gateway
 * 
 * - Initializes the dynamic asset url resolver via Supabase helper.
 * - Displays a smooth dark cyber loader sequence if assets are loading.
 * - Serves the fully populated LandingPage component once resolved.
 */
export const Home = ({ onAuthClick, onDashboardClick, onViewChange, setActiveTab, onNavigate, user, logout }) => {
  const [uiImages, setUiImages] = useState(cachedImages || {
    heroArt: '',
    trackingArt: '',
    reviewArt: '',
    rosterArt: '',
    profileArt: ''
  });
  const [isLoading, setIsLoading] = useState(!cachedImages);

  useEffect(() => {
    if (cachedImages) return;
    const loadImages = async () => {
      try {
        setIsLoading(true);
        // Async delay to let dark loading loaders display
        await new Promise((resolve) => setTimeout(resolve, 800));

        const resolved = {
          heroArt: getPublicImageUrl('hero_art.png'),
          trackingArt: SECTION_IMAGES.performanceTracking,
          reviewArt: SECTION_IMAGES.teammateReviews,
          rosterArt: SECTION_IMAGES.rosterManagement,
          profileArt: SECTION_IMAGES.verifiedResumes
        };
        cachedImages = resolved;
        setUiImages(resolved);
      } catch (err) {
        console.error('Error resolving landing page assets:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadImages();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-slate-50 dark:bg-[#0b0f19] min-h-screen w-full flex flex-col items-center justify-center space-y-6 text-slate-900 dark:text-[#f8fafc] font-sans relative overflow-hidden animate-pulse">
        {/* Decorative background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-[#00b4d8]/10 to-transparent blur-[100px] pointer-events-none rounded-full"></div>

        {/* Loader branding logo */}
        <div className="flex flex-col items-center space-y-3 z-10 select-none">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00b4d8] to-cyan-400 flex items-center justify-center shadow-lg shadow-[#00b4d8]/20">
            <Gamepad2 className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-black tracking-tight uppercase">
              Grade<span className="text-[#00b4d8]">Gamer</span>
            </h1>
            <p className="text-[9px] font-bold text-[#00b4d8] tracking-widest uppercase -mt-0.5 font-mono">Telemetry Gateway</p>
          </div>
        </div>

        {/* Dynamic spinner */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider z-10 pt-4">
          <RefreshCw className="w-4 h-4 animate-spin text-[#00b4d8]" />
          Resolving Storage CDN Assets...
        </div>
      </div>
    );
  }

  return (
    <LandingPage
      uiImages={uiImages}
      onAuthClick={onAuthClick}
      onDashboardClick={onDashboardClick}
      onViewChange={onViewChange}
      setActiveTab={setActiveTab}
      onNavigate={onNavigate}
      user={user}
      logout={logout}
      heroBanners={HERO_IMAGES}
    />
  );
};

export default Home;
