import { state } from "./state.js";
import { switchLanguage } from "./lang.js";
import { getNBURate } from "./nbuService.js";
import { getDealData } from "./deal.js";
import { loadHistory } from "./history.js";
import { displayData, hideLoading } from "./ui.js";
import { updateDealRate } from "./deal.js";

window.switchLanguage = switchLanguage;
window.updateDealRate = updateDealRate;

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

      state.entityId = recordId;
      state.dealId = recordId;

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
    console.error(error);
  }
}

init();
