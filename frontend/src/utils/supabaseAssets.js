const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_URL) || '';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const SUPABASE_UI_BASE = cleanUrl ? `${cleanUrl}/storage/v1/object/public/UI` : '';

export const getUiImageUrl = (fileName, fallback = '/banners/Esports.jpg') => {
  if (!fileName) return fallback;
  if (fileName.startsWith('http://') || fileName.startsWith('https://') || fileName.startsWith('/')) {
    return fileName;
  }
  return SUPABASE_UI_BASE ? `${SUPABASE_UI_BASE}/${encodeURIComponent(fileName)}` : fallback;
};

export const getBannerImageUrl = (fileName, localFallback = '/banners/Esports.jpg') => {
  if (!fileName) return localFallback;
  if (fileName.startsWith('http://') || fileName.startsWith('https://') || fileName.startsWith('/')) {
    return fileName;
  }
  return SUPABASE_UI_BASE ? `${SUPABASE_UI_BASE}/${encodeURIComponent(fileName)}` : localFallback;
};
