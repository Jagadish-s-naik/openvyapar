/**
 * Clean & Human-Friendly Date/Time Formatters for OpenVyapar
 */

export function parseValidDate(value: string | number | Date | undefined | null): Date {
  if (!value) return new Date();
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatDate(value: string | number | Date | undefined | null): string {
  const d = parseValidDate(value);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(value: string | number | Date | undefined | null): string {
  const d = parseValidDate(value);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatRelativeTime(value: string | number | Date | undefined | null): string {
  const d = parseValidDate(value);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 15) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;

  return formatDate(d);
}

export function formatAuditTimestamp(value: string | number | Date | undefined | null): {
  dateStr: string;
  timeStr: string;
  relativeStr: string;
} {
  const d = parseValidDate(value);
  return {
    dateStr: formatDate(d),
    timeStr: formatTime(d),
    relativeStr: formatRelativeTime(d),
  };
}
