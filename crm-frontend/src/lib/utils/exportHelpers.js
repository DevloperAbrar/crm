export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Reads an error response back out of a Blob. Needed because axios requests
 * made with `responseType: 'blob'` still return error bodies as a Blob
 * (containing JSON text), not as parsed JSON - so err.response.data.message
 * doesn't exist and the real error was previously swallowed.
 */
async function extractBlobErrorMessage(err) {
  const blob = err?.response?.data;
  if (!(blob instanceof Blob)) return err.message || 'Export failed';
  try {
    const text = await blob.text();
    const parsed = JSON.parse(text);
    return parsed.message || 'Export failed';
  } catch {
    return 'Export failed';
  }
}

export async function exportAndDownload(apiCall, filename) {
  try {
    const response = await apiCall();
    downloadBlob(response.data, filename);
    return { success: true };
  } catch (err) {
    const message = await extractBlobErrorMessage(err);
    return { success: false, message };
  }
}
