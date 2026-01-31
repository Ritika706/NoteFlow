export async function getAxiosErrorMessage(error, fallback = 'Request failed') {
  const status = error?.response?.status;

  // Axios error without a response (network/CORS/etc)
  if (!error?.response) {
    return error?.message || fallback;
  }

  const data = error.response.data;

  // Common case: JSON { message }
  if (data && typeof data === 'object' && typeof data.message === 'string') {
    return data.message;
  }

  // When responseType is 'blob', Axios may give a Blob even for JSON errors
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      const text = await data.text();
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.message === 'string') return parsed.message;
      } catch {
        // not json
      }
      if (text && text.trim()) return text.trim();
    } catch {
      // ignore
    }
  }

  // Fallback
  if (typeof data === 'string' && data.trim()) return data.trim();

  return status ? `${fallback} (HTTP ${status})` : fallback;
}
