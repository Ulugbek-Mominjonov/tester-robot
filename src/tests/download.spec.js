import { test } from "@playwright/test";
import config from "../config";
import path from "path";

const users = JSON.parse(process.env.USERS);

test.describe("File Download Test", () => {
  users.forEach((user) => {
    test(`Should login and download a file for user ${user.username}`, async ({
      page,
    }) => {
      await page.goto("/", {
        waitUntil: "networkidle",
      });
      await page.locator('input[name="login"]').fill(user.username);
      await page.locator('input[name="password"]').fill(user.password);
      await page.locator("#sButton").click();
      // await page.waitForTimeout(1000);

      const errorPopup = page.locator(
        "div.z-messagebox-window.z-window-highlighted.z-window-highlighted-shadow"
      );
      if ((await errorPopup.count()) > 0) {
        const buttons = errorPopup.locator(
          "button.z-messagebox-btn.z-button-os"
        );
        for (const button of await buttons.all()) {
          await button.click();
        }
      }

      await page.locator("span:has-text('Отчеты')").hover();
      await page.click("a:has-text('Отчеты')");
      await page.waitForTimeout(1000);

      const frameReport = page.frame({ name: "left" });
      await frameReport.getByRole("cell", { name: "021", exact: true }).click();
      await frameReport.waitForTimeout(1000);

      const frameForm = page.frame({ name: "right" });

      for (const account of user.accounts) {
        await frameForm.locator("#Date_Begin").fill(config.fromDate);
        await frameForm.locator("#Date_End").fill(config.toDate);
        await frameForm.locator("#searchInput").click();
        const selectOptionId = "select#Acc";
        const selectOptionValue = `1101000${account.account_number}`;
        await frameForm.selectOption(selectOptionId, selectOptionValue);
        const selectOptionIdAndValue = `${selectOptionId} option[value="${selectOptionValue}"]`;
        await frameForm.locator(selectOptionIdAndValue).click();
        await page.waitForTimeout(1000);

        await frameForm.locator("#mime").click();
        await frameForm.selectOption("select#mime", "EXCEL");

        const downloadPromise = page.waitForEvent("download");
        await frameForm.locator("#runreport").click();
        const download = await downloadPromise;
        const fileExtension = download.suggestedFilename().split(".").pop();
        const fileName = `universalbank_${account.account_number}_${config.fromDate}_to_${config.toDate}.${fileExtension}`;
        const filePath = path.join(config.downloadPath, fileName);

        await download.saveAs(filePath);

        await page.waitForTimeout(1000);
      }
    });
  });
});
