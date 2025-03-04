Cypress.on("window:before:load", (win) => {
  const originalWebSocket = win.WebSocket;

  win.WebSocket = function (url, protocols) {
    if (url.includes("wss://127.0.0.1:64443/service/cryptapi")) {
      console.log("Blocked WebSocket connection:", url);
      return { close: () => {} }; // WebSocket'ni blok qilish
    }
    return new originalWebSocket(url, protocols);
  };
});

Cypress.on("uncaught:exception", (err, runnable) => {
  console.log(1111);
  if (
    err.message.includes(
      "WebSocket connection to 'wss://127.0.0.1:64443/service/cryptapi' failed"
    )
  ) {
    console.log(2222);
    return false; // Xatoni e’tiborsiz qoldiramiz
  }
  return true;
});
