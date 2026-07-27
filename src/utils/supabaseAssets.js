const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_URL) || '';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const SUPABASE_UI_BASE = `${cleanUrl}/storage/v1/object/public/UI`;

export const getUiImageUrl = (fileName) => {
  if (!fileName) return '';
  return `${SUPABASE_UI_BASE}/${encodeURIComponent(fileName)}`;
};
