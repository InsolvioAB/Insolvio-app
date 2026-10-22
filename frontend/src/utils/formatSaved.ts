// "Sparad idag" / "Sparad igår" / "Sparad för 3 dagar sedan" -- inte ISO-datum (EJU-193)
export function formatSaved(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Sparad idag';
  if (days === 1) return 'Sparad igår';
  if (days < 30) return `Sparad för ${days} dagar sedan`;
  return `Sparad ${new Date(timestamp).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}
