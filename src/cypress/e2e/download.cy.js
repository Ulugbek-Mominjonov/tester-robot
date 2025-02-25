import { log } from "console";

describe("File Download Test", () => {
  Cypress.env("USERS").forEach((user) => {
    it("Should login and download a file", () => {
      cy.on("window:before:load", (win) => {
        win.addEventListener("unhandledrejection", (event) => {
          if (
            event.reason.message &&
            event.reason.message.includes("WebSocket connection")
          ) {
            event.preventDefault(); // Xatoni to‘xtatamiz
          }
        });

        win.addEventListener("error", (event) => {
          if (event.message.includes("WebSocket connection")) {
            event.preventDefault(); // Xatoni to‘xtatamiz
          }
        });

        const originalWebSocket = win.WebSocket;
        win.WebSocket = function (url, protocols) {
          if (url.includes("wss://127.0.0.1:64443/service/cryptapi")) {
            console.log("WebSocket bloklandi:", url);
            return { close: () => { } }; // Bo‘sh obyekt qaytariladi
          }
          return new originalWebSocket(url, protocols);
        };
      });

      cy.visit(Cypress.env("SITE_URL"));

      cy.contains("tr", "Логин").find('input[type="text"]').type(user.username);
      cy.get('input[type="password"]').type(user.password);
      cy.contains("table", "Войти в систему").click();
      cy.url().should("include", "/");
      cy.wait(2000); // 2 soniya kutish
      cy.get('body').then(($body) => {
        if ($body.find('div.z-messagebox-window.z-window-highlighted.z-window-highlighted-shadow').length > 0) {
          cy.get('button.z-messagebox-btn.z-button-os').click();
        }
      });




      cy.contains("table", "Отчеты ").click();
      cy.contains("a", " Выписка по счету за период").click();

      user.accounts.forEach((account) => {
        cy.contains("tr", "Маска счёта").find("i").last().click();
        cy.contains("tr", account.account_number).click();
        cy.contains("tr", "Начальная дата")
          .find('input[type="text"]')
          .first()
          .clear()
          .type(Cypress.env("FROM_DATE"));
        cy.contains("tr", "Конечная дата")
          .find('input[type="text"]')
          .first()
          .clear()
          .type(Cypress.env("TO_DATE"));
        cy.contains("div", " Выгрузить отчет в EXCEL").click();

        cy.wait(3000).then(() => {
          cy.task("renameFile", {
            oldName: "Accont_payments.xlsx",
            newName: `ipakyuli_${
              account.account_number
            }_${new Date().toLocaleDateString("ru-RU")}.xlsx`,
          }).then((result) => {
            console.log(result);
          });
        });

        // cy.wrap(null).wait(3000);
        cy.get('div[title="Закрыть выгрузку файла..."]').click();
      });

      cy.contains("table", "Выход ").click();
    });
  });
});
