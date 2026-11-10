export function formatFollowers(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}

export function formatEngagementRate(rate: string | number | null | undefined): string {
  if (rate === null || rate === undefined || rate === '') return 'N/A';
  const val = typeof rate === 'string' ? parseFloat(rate) : rate;
  if (isNaN(val)) return 'N/A';
  return `${val.toFixed(2)}%`;
}

export function getPlatformBadge(platform: string | null | undefined): { label: string; color: string; bg: string } {
  const p = (platform || '').toLowerCase();
  switch (p) {
    case 'youtube':
      return { label: 'YouTube', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
    case 'instagram':
      return { label: 'Instagram', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' };
    case 'tiktok':
      return { label: 'TikTok', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' };
    case 'twitter':
    case 'x':
      return { label: 'X (Twitter)', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' };
    case 'linkedin':
      return { label: 'LinkedIn', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
    default:
      return { label: platform || 'Creator', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' };
  }
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return 'CR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
