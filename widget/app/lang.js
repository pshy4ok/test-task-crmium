import { state } from "./state.js";
import { translations } from "./translations.js";
import { updateUI } from "./ui.js";

export function switchLanguage(lang) {
  state.currentLang = lang;
  updateUI();

  const logEntries = document.querySelectorAll(".log-entry");
  logEntries.forEach((entry) => {
    const text = entry.textContent;
    const timestampMatch = text.match(/\[(.+?)\]/);
    if (!timestampMatch) return;

    const timestamp = timestampMatch[0];
    const message = text.replace(/\[.+?\]\s*/, "");

    let translatedMessage = message;

    if (
      message.includes("Курс НБУ отримано:") ||
      message.includes("NBU rate fetched:")
    ) {
      const rateMatch = message.match(/[\d.]+/);
      const rate = rateMatch ? rateMatch[0] : "";
      translatedMessage = `${translations[lang].logFetched} ${rate}`;
    } else if (
      message.includes("Натиснуто кнопку") ||
      message.includes("Update button clicked")
    ) {
      translatedMessage = translations[lang].logButtonClicked;
    } else if (
      message.includes("успішно оновлено") ||
      message.includes("successfully updated")
    ) {
      translatedMessage = translations[lang].logUpdated;
    }

    entry.textContent = `${timestamp} ${translatedMessage}`;
  });
}
