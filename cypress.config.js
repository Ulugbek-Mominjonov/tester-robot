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
      // USERS: [
      //   {
      //     id: 39,
      //     username: "New_132",
      //     password: "a12345678",
      //     bank_id: 4,
      //     bank_name: "AGROBANK",
      //     accounts: [
      //       {
      //         aloqabank_login_id: 39,
      //         account_number: "20208000105324093002",
      //       },
      //     ],
      //   },
      //   // {
      //   //   id: 40,
      //   //   username: "EXCELLENT SERVICE",
      //   //   password: "asdf123456+",
      //   //   bank_id: 4,
      //   //   bank_name: "AGROBANK",
      //   //   accounts: [
      //   //     {
      //   //       aloqabank_login_id: 40,
      //   //       account_number: "20208000205324182003",
      //   //     },
      //   //   ],
      //   // },
      // ],
      FROM_DATE: new Date().toLocaleDateString("ru-RU"), //"15.02.2025",
      TO_DATE: new Date().toLocaleDateString("ru-RU"), //"15.02.2025",
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
