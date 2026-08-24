const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_URL) || 'https://jjngoguweoiawuykwcwm.supabase.co';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

export const SUPABASE_UI_BASE = cleanUrl ? `${cleanUrl}/storage/v1/object/public/UI` : 'https://jjngoguweoiawuykwcwm.supabase.co/storage/v1/object/public/UI';
export const SUPABASE_ASSETS_BASE = cleanUrl ? `${cleanUrl}/storage/v1/object/public/assets` : 'https://jjngoguweoiawuykwcwm.supabase.co/storage/v1/object/public/assets';

export const getUiImageUrl = (fileName) => {
  if (!fileName) return '';
  if (fileName.startsWith('http://') || fileName.startsWith('https://') || fileName.startsWith('/')) {
    return fileName;
  }
  // Decode first to prevent double-encoding if already encoded
  const decoded = decodeURIComponent(fileName);
  return `${SUPABASE_UI_BASE}/${encodeURIComponent(decoded)}`;
};

export const getAssetImageUrl = (fileName) => {
  if (!fileName) return '';
  if (fileName.startsWith('http://') || fileName.startsWith('https://') || fileName.startsWith('/')) {
    return fileName;
  }
  const decoded = decodeURIComponent(fileName);
  return `${SUPABASE_ASSETS_BASE}/${encodeURIComponent(decoded)}`;
};
