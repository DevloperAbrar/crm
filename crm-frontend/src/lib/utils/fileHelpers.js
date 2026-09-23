// Builds an absolute URL for a file served from the backend's /uploads
// static route (e.g. "/uploads/169...-abc.png" -> "http://localhost:5000/uploads/169...-abc.png").
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export function getFileUrl(relativePath) {
  if (!relativePath) return '';
  if (relativePath.startsWith('http')) return relativePath;
  return `${API_ORIGIN}${relativePath}`;
}
