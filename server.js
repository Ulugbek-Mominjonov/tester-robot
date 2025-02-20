import { exec } from "child_process";
import config from "./src/config/index.js";
import { sendToTelegram } from "./src/services/telegramService.js";
import sendFilesData from "./src/services/readExcelFileService.js";

console.log("🚀Cypress test ishga tushdi...");
exec("npx cypress run", async (error, stdout, stderr) => {
  if (error) {
    console.error("❌ Xatolik:", stderr);
  } else {
    console.log(stdout);
    const downloadsFolder = config.downloadPath;

    console.log("🚀Telegramga fayllar yuborilmoqda...");
    await sendToTelegram(downloadsFolder);

    console.log("🚀Excel fayllardagi ma'lumotlar bazaga yuborilmoqda...");
    await sendFilesData();
  }
});
