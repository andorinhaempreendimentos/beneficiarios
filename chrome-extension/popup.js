document.addEventListener("DOMContentLoaded", () => {
  const btnPreencher = document.getElementById("btnPreencher");
  const btnPreencherAleatorio = document.getElementById("btnPreencherAleatorio");
  const statusEl = document.getElementById("status");

  function notificar(msg) {
    statusEl.innerText = msg;
    statusEl.style.display = "block";
    setTimeout(() => {
      statusEl.style.display = "none";
    }, 3000);
  }

  function executarPreenchimento(modo) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) return;
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "preencher_formulario", modo },
        (response) => {
          if (chrome.runtime.lastError) {
            // Tenta injeção direta via Scripting API caso o content script não tenha sido carregado
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ["content.js"]
            }, () => {
              chrome.tabs.sendMessage(tabs[0].id, { action: "preencher_formulario", modo });
              notificar("Formulário preenchido com sucesso!");
            });
          } else {
            notificar("Formulário preenchido com sucesso!");
          }
        }
      );
    });
  }

  btnPreencher.addEventListener("click", () => executarPreenchimento("padrao"));
  btnPreencherAleatorio.addEventListener("click", () => executarPreenchimento("aleatorio"));
});
