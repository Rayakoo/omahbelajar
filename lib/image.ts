function extractGoogleDriveId(url: string): string | null {
  const match =
    url.match(/\/file\/d\/([^/?#]+)/) ||
    url.match(/[?&]id=([^&]+)/) ||
    url.match(/\/d\/([^/?#]+)/);
  return match ? match[1] : null;
}

const GARAGE_WEB_HOST = "bucket-utama.web.43.156.104.232.sslip.io";

export function transformImageUrl(url: string): string {
  const id = extractGoogleDriveId(url);
  if (id) {
    const directUrl = `https://lh3.googleusercontent.com/d/${id}`;
    return `/api/image-proxy?url=${encodeURIComponent(directUrl)}`;
  }
  if (url.includes(GARAGE_WEB_HOST)) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}
