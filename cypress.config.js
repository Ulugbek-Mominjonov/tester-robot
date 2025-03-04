import { defineConfig } from "cypress";
import fs from "fs";
import path from "path";
import configFile from "./src/config/index.js";
import fetchUsers from "./src/services/fetchUsers.js";

export default defineConfig({
  e2e: {
    defaultBrowser: "electron",
    chromeWebSecurity: false,
    specPattern: "src/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    fixturesFolder: "src/cypress/fixtures",
    downloadsFolder: configFile.downloadPath,
    experimentalInteractiveRunEvents: true,
    env: {
      SITE_URL: configFile.bankUrl,
      CASH_URL: configFile.cashUrl,
      CASH_USERNAME: configFile.cashUsername,
      CASH_PASSWORD: configFile.cashPassword,
      FROM_DATE: configFile.fromDate,
      TO_DATE: configFile.toDate,
      OLD_FILE_NAME: "Accont_payments.xlsx",
    },
    async setupNodeEvents(on, config) {
      const downloadsFolder = config.downloadsFolder;
      config.env.USERS = await fetchUsers();

      on("before:browser:launch", (browser = {}, launchOptions) => {
        if (browser.name === "chrome") {
          launchOptions.args.push(
            "--disable-web-security",
            "--allow-running-insecure-content",
            "--disable-site-isolation-trials",
            "--ignore-certificate-errors",
            "--allow-insecure-localhost"
          );
        }
        return launchOptions;
      });

      on("task", {
        renameFile({ account_number }) {
          const oldName = config.env.OLD_FILE_NAME;
          const newName =
            config.env.FROM_DATE == config.env.TO_DATE
              ? `agrobank_${account_number}_${config.env.FROM_DATE}.xlsx`
              : `agrobank_${account_number}_${config.env.FROM_DATE}_${config.env.TO_DATE}.xlsx`;
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
