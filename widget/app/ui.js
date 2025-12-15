import { state } from "./state.js";
import { translations } from "./translations.js";

export function updateUI() {
  const t = translations[state.currentLang];
  document.getElementById("title").textContent = t.title;
  document.getElementById("loadingText").textContent = t.loadingText;
  document.getElementById("nbuLabel").textContent = t.nbuLabel;
  document.getElementById("dealLabel").textContent = t.dealLabel;
  document.getElementById("differenceLabel").textContent = t.differenceLabel;
  document.getElementById("btnText").textContent = t.btnText;
  document.getElementById("logTitle").textContent = t.logTitle;
  document.getElementById("historyTitle").textContent = t.historyTitle;
  document.getElementById("historyDateHeader").textContent = t.historyDate;
  document.getElementById("historyRateHeader").textContent = t.historyRate;
  document.getElementById("historyDiffHeader").textContent = t.historyDiff;
}

export function addLog(message) {
  const logContainer = document.getElementById("logContainer");
  const timestamp = new Date().toLocaleTimeString(
    state.currentLang === "uk" ? "uk-UA" : "en-US"
  );
  const logEntry = document.createElement("div");
  logEntry.className = "log-entry";
  logEntry.textContent = `[${timestamp}] ${message}`;
  logContainer.insertBefore(logEntry, logContainer.firstChild);
}

export function showError(message) {
  const errorDiv = document.getElementById("error");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
}

export function hideLoading() {
  document.getElementById("loading").style.display = "none";
  document.getElementById("content").style.display = "block";
}

export function calculateDifference() {
  if (state.nbuRate === 0 || state.dealRate === 0) {
    return null;
  }
  const diff = (state.dealRate / state.nbuRate - 1) * 100;
  return Math.round(diff * 10) / 10;
}

export function displayData() {
  document.getElementById(
    "nbuRate"
  ).textContent = `${state.nbuRate.toFixed(2)} ₴`;
  document.getElementById("dealRate").textContent = state.dealRate
    ? `${state.dealRate.toFixed(2)} ₴`
    : translations[state.currentLang].notAvailable;

  const difference = calculateDifference();

  if (difference !== null) {
    const diffElement = document.getElementById("difference");
    const diffValue = document.getElementById("differenceValue");

    diffElement.style.display = "block";
    diffValue.textContent = `${difference > 0 ? "+" : ""}${difference}%`;
    diffElement.className = `difference ${
      difference > 0 ? "positive" : "negative"
    }`;

    if (Math.abs(difference) >= 5) {
      document.getElementById("updateBtn").style.display = "block";
    }
  }
}

export function prependHistoryRow(record) {
  const historyContainer = document.getElementById("historyTableBody");

  const emptyRow = historyContainer.querySelector(".empty-history");
  if (emptyRow) emptyRow.remove();

  const date = new Date(record.Created_Time);
  const formattedDate = date.toLocaleString(
    state.currentLang === "uk" ? "uk-UA" : "en-US",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${formattedDate}</td>
    <td>${record.Rate.toFixed(2)} ₴</td>
    <td class="${record.Difference >= 0 ? "text-success" : "text-danger"}">
      ${record.Difference > 0 ? "+" : ""}${record.Difference.toFixed(1)}%
    </td>
  `;

  historyContainer.prepend(row);
}
