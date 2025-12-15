import { state } from "./state.js";
import { translations } from "./translations.js";
import {
  getHistoryCache,
  setHistoryCache,
  createLocalHistoryRecord,
} from "./storage.js";
import { addLog, prependHistoryRow } from "./ui.js";

export async function createHistoryRecord(rate, difference) {
  try {
    const response = await ZOHO.CRM.API.insertRecord({
      Entity: "Exchange_Rate_History",
      Trigger: [],
      APIData: [
        {
          Name: `Rate ${rate}`,
          Deal: { id: state.dealId },
          Rate: rate,
          Rate_Source: "НБУ",
          Difference: difference ?? 0,
        },
      ],
    });

    const result = response?.data?.[0];

    const localRecord = createLocalHistoryRecord(rate, difference);
    const cache = getHistoryCache();
    cache.unshift(localRecord);
    setHistoryCache(cache);
    prependHistoryRow(localRecord);

    if (result?.status === "success") {
      addLog("Запис додано в історію");
    } else {
      console.error("Insert history failed:", response);
    }
  } catch (error) {
    console.error("History insert error:", error);
  }
}

export async function loadHistory() {
  try {
    const response = await ZOHO.CRM.API.searchRecord({
      Entity: "Exchange_Rate_History",
      Type: "criteria",
      Query: `(Deal:equals:${state.dealId})`,
      sort_order: "desc",
      sort_by: "Created_Time",
      per_page: 5,
    });

    const historyContainer = document.getElementById("historyTableBody");
    historyContainer.innerHTML = "";

    const apiRecords = (response.data || []).map((r) => ({
      id: r.id,
      Rate: r.Rate,
      Difference: r.Difference ?? 0,
      Created_Time: r.Created_Time,
    }));

    let cache = getHistoryCache().filter(
      (lr) =>
        !apiRecords.some(
          (ar) =>
            ar.Rate === lr.Rate &&
            Math.abs(new Date(ar.Created_Time) - new Date(lr.Created_Time)) <
              5000
        )
    );

    const allRecords = [...cache, ...apiRecords];

    if (allRecords.length > 0) {
      allRecords.forEach((record) => prependHistoryRow(record));
    } else {
      historyContainer.innerHTML = `<tr class="empty-history"><td colspan="3" class="text-center">${translations[state.currentLang].noHistory}</td></tr>`;
    }

    setHistoryCache(cache);
  } catch (error) {
    console.error("Error loading history:", error);
  }
}
