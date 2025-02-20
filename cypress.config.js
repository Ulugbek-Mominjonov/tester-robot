import { defineConfig } from "cypress";
import fs from "fs";
import path from "path";
import configFile from "./src/config/index.js";
import axios from "axios";

export default defineConfig({
  e2e: {
    defaultBrowser: "chrome",
    specPattern: "src/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    fixturesFolder: "src/cypress/fixtures",
    supportFile: false,
    screenshotsFolder: undefined,
    downloadsFolder: configFile.downloadPath,
    env: {
      SITE_URL: configFile.bankUrl,
      CASH_URL: configFile.cashUrl,
      CASH_USERNAME: configFile.cashUsername,
      CASH_PASSWORD: configFile.cashPassword,

      FROM_DATE: new Date().toLocaleDateString("ru-RU"), //"15.02.2025",
      TO_DATE: new Date().toLocaleDateString("ru-RU"), //"15.02.2025",
    },
    async setupNodeEvents(on, config) {
      const downloadsFolder = config.downloadsFolder;

      // API'dan foydalanuvchilarni olish
      try {
        const username = config.env.CASH_USERNAME;
        const password = config.env.CASH_PASSWORD;
        const response = await axios.get(config.env.CASH_URL, {
          headers: {
            Authorization: `Basic ${btoa(`${username}:${password}`)}`,
            "Content-Type": "application/json",
          },
          params: {
            bank_name: 3,
          },
        });
        config.env.USERS = response.data.data;
        console.log("✅ USERS API'dan yuklandi:", config.env.USERS);
      } catch (error) {
        console.error("❌ USERS API'dan yuklashda xatolik:", error.message);
      }

      on("task", {
        renameFile({ oldName, newName }) {
          const oldPath = path.join(downloadsFolder, oldName);
          const newPath = path.join(downloadsFolder, newName);

          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            return `✅ Fayl o‘zgartirildi: ${newPath}`;
          }
          return `❌ Fayl topilmadi: ${oldName}`;
        },
      });

      on("after:run", () => {
        const downloadsHtmlPath = path.join(downloadsFolder, "downloads.html");

        if (fs.existsSync(downloadsHtmlPath)) {
          fs.unlinkSync(downloadsHtmlPath);
          console.log("🗑️ `downloads.html` o‘chirildi.");
        }
      });

      return config;
    },
  },
});
