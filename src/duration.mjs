export function formatDurationMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return '';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h${remainder ? ` ${remainder}m` : ''}`;
}

export function formatDurationRange(range) {
  if (!Array.isArray(range) || range.length !== 2) return '';
  const [minimum, maximum] = range;
  if (minimum === maximum) return formatDurationMinutes(minimum);
  return `${formatDurationMinutes(minimum)} – ${formatDurationMinutes(maximum)}`;
}
