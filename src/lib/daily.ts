// Utilitaires partagés pour faire tourner un contenu (citations, quiz...) chaque
// jour : même résultat pour tout le monde un jour donné, différent le lendemain.

export function dayIndex(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 86400000);
}

// Sélectionne une fenêtre de `count` éléments qui glisse dans le pool au fil des
// jours, en bouclant une fois le pool épuisé.
export function dailySubset<T>(items: T[], count: number): T[] {
  const total = items.length;
  const start = (dayIndex() * count) % total;
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(items[(start + i) % total]);
  }
  return result;
}

// Mélange déterministe : même ordre pour tout le monde un jour donné, mais un
// ordre différent chaque jour.
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = seed;
  function next() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  }
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
