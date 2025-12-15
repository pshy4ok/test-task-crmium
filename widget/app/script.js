import { translations } from "./translations.js";

let currentLang = "uk";
let nbuRate = 0;
let dealRate = 0;
let dealId = null;
let entityId = null;
const STORAGE_KEY = "nbu_rate_cache";

function switchLanguage(lang) {
  currentLang = lang;
  updateUI();

  const logEntries = document.querySelectorAll(".log-entry");
  logEntries.forEach((entry) => {
    const text = entry.textContent;
    const timestamp = text.match(/\[(.+?)\]/)[0];
    const message = text.replace(/\[.+?\]\s*/, "");

    let translatedMessage = message;

    if (
      message.includes("Курс НБУ отримано:") ||
      message.includes("NBU rate fetched:")
    ) {
      const rate = message.match(/[\d.]+/)[0];
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

window.switchLanguage = switchLanguage;

function updateUI() {
  const t = translations[currentLang];
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

function addLog(message) {
  const logContainer = document.getElementById("logContainer");
  const timestamp = new Date().toLocaleTimeString(
    currentLang === "uk" ? "uk-UA" : "en-US"
  );
  const logEntry = document.createElement("div");
  logEntry.className = "log-entry";
  logEntry.textContent = `[${timestamp}] ${message}`;
  logContainer.insertBefore(logEntry, logContainer.firstChild);
}

function showError(message) {
  const errorDiv = document.getElementById("error");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
}

function hideLoading() {
  document.getElementById("loading").style.display = "none";
  document.getElementById("content").style.display = "block";
}

async function getNBURate() {
  try {
    const cached = getRateFromLocalStorage();
    if (cached) {
      nbuRate = cached.Rate;
      displayData();
      addLog(`Завантажено з кешу: ${nbuRate.toFixed(2)}`);
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
      nbuRate = data[0].rate;
      saveRateToLocalStorage(nbuRate);
      addLog(`${translations[currentLang].logFetched} ${nbuRate.toFixed(2)}`);
      return nbuRate;
    }
    throw new Error("No data from NBU");
  } catch (error) {
    const cached = getRateFromLocalStorage();
    if (cached) {
      addLog(`Використано кешований курс через помилку API`);
      return cached.Rate;
    }
    showError(translations[currentLang].errorNBU);
    throw error;
  }
}

async function getDealData(entityId) {
  try {
    if (!entityId) {
      throw new Error("No entity ID provided");
    }

    dealId = entityId;

    const response = await ZOHO.CRM.API.getRecord({
      Entity: "Deals",
      RecordID: dealId,
    });

    if (response.data && response.data.length > 0) {
      const deal = response.data[0];
      dealRate = deal.Currency_Rate || 0;
      return dealRate;
    }
    throw new Error("No deal data in response");
  } catch (error) {
    showError(translations[currentLang].errorCRM);
    throw error;
  }
}

function calculateDifference() {
  if (nbuRate === 0 || dealRate === 0) {
    return null;
  }

  const diff = (dealRate / nbuRate - 1) * 100;
  return Math.round(diff * 10) / 10;
}

function displayData() {
  document.getElementById("nbuRate").textContent = `${nbuRate.toFixed(2)} ₴`;
  document.getElementById("dealRate").textContent = dealRate
    ? `${dealRate.toFixed(2)} ₴`
    : translations[currentLang].notAvailable;

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

async function updateDealRate() {
  addLog(translations[currentLang].logButtonClicked);

  const btn = document.getElementById("updateBtn");
  const btnSpinner = document.getElementById("btnSpinner");

  btn.disabled = true;
  btnSpinner.style.display = "inline-block";

  try {
    const difference = calculateDifference();

    const response = await ZOHO.CRM.API.updateRecord({
      Entity: "Deals",
      APIData: {
        id: dealId,
        Currency_Rate: nbuRate,
      },
    });

    if (response.data && response.data.length > 0) {
      await createHistoryRecord(nbuRate, difference);

      dealRate = nbuRate;
      document.getElementById("dealRate").textContent = `${dealRate.toFixed(
        2
      )} ₴`;
      document.getElementById("difference").style.display = "none";
      btn.style.display = "none";

      addLog(translations[currentLang].logUpdated);
    } else {
      throw new Error("Update failed");
    }
  } catch (error) {
    showError(translations[currentLang].errorUpdate);
  } finally {
    btn.disabled = false;
    btnSpinner.style.display = "none";
  }
}

window.updateDealRate = updateDealRate;

function saveRateToLocalStorage(rate) {
  const data = {
    Rate: rate,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getRateFromLocalStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return null;
}

async function createHistoryRecord(rate, difference) {
  try {
    const response = await ZOHO.CRM.API.insertRecord({
      Entity: "Exchange_Rate_History",
      Trigger: [],
      APIData: [
        {
          Name: `Rate ${rate}`,
          Deal: { id: dealId },
          Rate: rate,
          Rate_Source: "НБУ",
          Difference: difference ?? 0,
        },
      ],
    });

    const result = response?.data?.[0];

    if (result?.status === "success") {
      addLog("Запис додано в історію");
      await loadHistory();
    } else {
      console.error("Insert history failed:", response);
    }
  } catch (error) {
    console.error("History insert error:", error);
  }
}

async function loadHistory() {
  try {
    const response = await ZOHO.CRM.API.searchRecord({
      Entity: "Exchange_Rate_History",
      Type: "criteria",
      Query: `(Deal:equals:${dealId})`,
      sort_order: "desc",
      sort_by: "Created_Time",
      per_page: 5,
    });

    const historyContainer = document.getElementById("historyTableBody");
    historyContainer.innerHTML = "";

    if (response.data && response.data.length > 0) {
      response.data.forEach((record) => {
        const date = new Date(record.Created_Time);
        const formattedDate = date.toLocaleString(
          currentLang === "uk" ? "uk-UA" : "en-US",
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
          <td class="${
            record.Difference >= 0 ? "text-success" : "text-danger"
          }">
            ${record.Difference > 0 ? "+" : ""}${record.Difference.toFixed(1)}%
          </td>
        `;
        historyContainer.appendChild(row);
      });
    } else {
      historyContainer.innerHTML = `<tr><td colspan="3" class="text-center">${translations[currentLang].noHistory}</td></tr>`;
    }
  } catch (error) {
    console.error("Error loading history:", error);
  }
}

async function init() {
  try {
    ZOHO.embeddedApp.on("PageLoad", async function (data) {
      let recordId = null;

      if (data && data.EntityId) {
        recordId = data.EntityId;
      } else if (
        data &&
        Array.isArray(data) &&
        data.length > 0 &&
        data[0].EntityId
      ) {
        recordId = data[0].EntityId;
      }

      if (!recordId) {
        throw new Error("Не вдалося отримати ID угоди");
      }

      entityId = recordId;
      dealId = recordId;

      try {
        await Promise.all([getNBURate(), getDealData(recordId)]);

        displayData();
        await loadHistory();
        hideLoading();
      } catch (error) {
        hideLoading();
      }
    });

    await ZOHO.embeddedApp.init();
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
}

init();
