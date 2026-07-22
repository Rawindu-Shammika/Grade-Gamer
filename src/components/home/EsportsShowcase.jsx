import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';

/**
 * EsportsShowcase Component
 * 
 * - Lists objects in public 'assets' Supabase storage bucket on mount.
 * - Displays a slideshow cycle of filtered image assets.
 * - Smooth fade-in transitions.
 */
export const EsportsShowcase = () => {
  const [imageUrls, setImageUrls] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssetImages = async () => {
      try {
        setLoading(true);
        const { data: files, error } = await supabase.storage.from('assets').list();
        if (error) throw error;

        if (files && files.length > 0) {
          // Filter to include only valid image types (.jpg, .jpeg, .png, .webp, .gif)
          const validImages = files.filter(file => {
            const name = file.name.toLowerCase();
            return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp') || name.endsWith('.gif');
          });

          // Convert into dynamic public URLs
          const urls = validImages.map(file => {
            const { data } = supabase.storage.from('assets').getPublicUrl(file.name);
            return data?.publicUrl;
          }).filter(Boolean);

          setImageUrls(urls);
        }
      } catch (err) {
        console.error('Failed to list assets for Esports Showcase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssetImages();
  }, []);

  const handleNextImage = useCallback(() => {
    if (!imageUrls || imageUrls.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
  }, [imageUrls]);

  // Slideshow cycle interval logic
  useEffect(() => {
    if (imageUrls.length <= 1) return;

    const timer = setInterval(() => {
      handleNextImage();
    }, 10000);

    return () => clearInterval(timer);
  }, [imageUrls, handleNextImage, currentIndex]);

  const containerClass = 'bg-[#111622] border border-slate-800 rounded-2xl w-full h-[320px] shadow-2xl relative overflow-hidden flex items-center justify-center p-6';

  if (loading || imageUrls.length === 0) {
    return (
      <div className={containerClass}>
        <span className="text-slate-600 text-sm font-semibold tracking-wider uppercase font-mono">
          Esports Tactical Showcase
        </span>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <img
        key={currentIndex}
        src={imageUrls[currentIndex]}
        alt="Esports Tactical Showcase"
        onClick={handleNextImage}
        className="w-full h-full object-cover rounded-xl transition-opacity duration-700 animate-fadeIn cursor-pointer"
      />
    </div>
  );
};

export default EsportsShowcase;
