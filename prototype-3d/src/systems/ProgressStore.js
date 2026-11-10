export class ProgressStore {
  constructor(key = 'capivara-adventure-v1') { this.key = key; }
  load() {
    try {
      const value = JSON.parse(localStorage.getItem(this.key) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch { return {}; }
  }
  save(progress) {
    try {
      localStorage.setItem(this.key, JSON.stringify({
        collected: Array.isArray(progress.collected) ? progress.collected : [],
        talked: Array.isArray(progress.talked) ? progress.talked : [],
        portalUnlocked: Boolean(progress.portalUnlocked),
        glacialMode: Boolean(progress.glacialMode),
        glacialCrystals: Array.isArray(progress.glacialCrystals) ? progress.glacialCrystals : [],
        mammothRescued: Boolean(progress.mammothRescued),
        cerradoMode: Boolean(progress.cerradoMode),
        cerradoSeeds: Array.isArray(progress.cerradoSeeds) ? progress.cerradoSeeds : [],
        anteaterHelped: Boolean(progress.anteaterHelped),
        cerradoAnimals: Array.isArray(progress.cerradoAnimals) ? progress.cerradoAnimals : [],
        updatedAt: Date.now()
      }));
      return true;
    } catch { return false; }
  }
  reset() {
    try { localStorage.removeItem(this.key); return true; }
    catch { return false; }
  }
}
