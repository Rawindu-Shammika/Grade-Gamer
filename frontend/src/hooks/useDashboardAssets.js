import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * Custom hook to interact with Supabase Storage infrastructure.
 * Targets the public 'assets' bucket to resolve public URLs for home landing page graphics.
 */
export const useDashboardAssets = () => {
  const [uiImages, setUiImages] = useState({
    heroArt: '',
    trackingArt: '',
    reviewArt: '',
    rosterArt: '',
    profileArt: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const resolveAssets = async () => {
      try {
        setIsLoading(true);
        // Async delay to let dark loading loaders display
        await new Promise((resolve) => setTimeout(resolve, 800));

        const getPublicAssetUrl = (filename) => {
          const { data } = supabase.storage.from('assets').getPublicUrl(filename);
          return data?.publicUrl || '';
        };

        setUiImages({
          heroArt: getPublicAssetUrl('hero_art.png'),
          trackingArt: getPublicAssetUrl('tracking_art.png'),
          reviewArt: getPublicAssetUrl('review_art.png'),
          rosterArt: getPublicAssetUrl('roster_art.png'),
          profileArt: getPublicAssetUrl('profile_art.png')
        });
      } catch (err) {
        console.error('Error resolving Supabase landing page assets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    resolveAssets();
  }, []);

  return { uiImages, isLoading };
};

export default useDashboardAssets;
