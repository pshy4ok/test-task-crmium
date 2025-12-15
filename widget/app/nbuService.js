import { state } from "./state.js";
import { translations } from "./translations.js";
import { addLog, showError, displayData } from "./ui.js";
import { saveRateToLocalStorage, getRateFromLocalStorage } from "./storage.js";

export async function getNBURate() {
  try {
    const cached = getRateFromLocalStorage();
    if (cached) {
      state.nbuRate = cached.Rate;
      displayData();
      addLog(`Завантажено з кешу: ${state.nbuRate.toFixed(2)}`);
    }

    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const response = await fetch(
      `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&date=${today}&json`
    );

    if (!response.ok) {
      throw new Error("NBU API error");
    }

    const data = await response.json();
    if (data && data.length > 0) {
      state.nbuRate = data[0].rate;
      saveRateToLocalStorage(state.nbuRate);
      addLog(
        `${translations[state.currentLang].logFetched} ${state.nbuRate.toFixed(
          2
        )}`
      );
      return state.nbuRate;
    }
    throw new Error("No data from NBU");
  } catch (error) {
    const cached = getRateFromLocalStorage();
    if (cached) {
      addLog(`Використано кешований курс через помилку API`);
      return cached.Rate;
    }
    showError(translations[state.currentLang].errorNBU);
    throw error;
  }
}
