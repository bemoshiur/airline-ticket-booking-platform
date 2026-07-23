export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function parseDuration(str: string): number {
  const parts = str.match(/(\d+)h(?:\s*(\d+)m)?/);
  if (!parts) return 0;
  const h = parseInt(parts[1]) || 0;
  const m = parseInt(parts[2]) || 0;
  return h * 60 + m;
}
