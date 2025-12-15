import { state } from "./state.js";
import { translations } from "./translations.js";
import { addLog, showError, calculateDifference } from "./ui.js";
import { createHistoryRecord } from "./history.js";

export async function getDealData(entityId) {
  try {
    if (!entityId) {
      throw new Error("No entity ID provided");
    }

    state.dealId = entityId;

    const response = await ZOHO.CRM.API.getRecord({
      Entity: "Deals",
      RecordID: state.dealId,
    });

    if (response.data && response.data.length > 0) {
      const deal = response.data[0];
      state.dealRate = deal.Currency_Rate || 0;
      return state.dealRate;
    }
    throw new Error("No deal data in response");
  } catch (error) {
    showError(translations[state.currentLang].errorCRM);
    throw error;
  }
}

export async function updateDealRate() {
  addLog(translations[state.currentLang].logButtonClicked);

  const btn = document.getElementById("updateBtn");
  const btnSpinner = document.getElementById("btnSpinner");

  btn.disabled = true;
  btnSpinner.style.display = "inline-block";

  try {
    const difference = calculateDifference();

    const response = await ZOHO.CRM.API.updateRecord({
      Entity: "Deals",
      APIData: {
        id: state.dealId,
        Currency_Rate: state.nbuRate,
      },
    });

    if (response.data && response.data.length > 0) {
      await createHistoryRecord(state.nbuRate, difference);

      state.dealRate = state.nbuRate;
      document.getElementById(
        "dealRate"
      ).textContent = `${state.dealRate.toFixed(2)} ₴`;
      document.getElementById("difference").style.display = "none";
      btn.style.display = "none";

      addLog(translations[state.currentLang].logUpdated);
    } else {
      throw new Error("Update failed");
    }
  } catch (error) {
    showError(translations[state.currentLang].errorUpdate);
  } finally {
    btn.disabled = false;
    btnSpinner.style.display = "none";
  }
}
