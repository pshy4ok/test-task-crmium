import { state, STORAGE_KEY, HISTORY_CACHE_KEY } from "./state.js";

export function saveRateToLocalStorage(rate) {
  const data = {
    Rate: rate,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getRateFromLocalStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return null;
}

export function getHistoryCache() {
  const cache = localStorage.getItem(`${HISTORY_CACHE_KEY}_${state.dealId}`);
  return cache ? JSON.parse(cache) : [];
}

export function setHistoryCache(records) {
  localStorage.setItem(
    `${HISTORY_CACHE_KEY}_${state.dealId}`,
    JSON.stringify(records)
  );
}

export function createLocalHistoryRecord(rate, difference) {
  return {
    localId: Date.now() + Math.random(),
    Rate: rate,
    Difference: difference ?? 0,
    Created_Time: new Date().toISOString(),
  };
}
