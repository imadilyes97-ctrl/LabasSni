(function () {
  "use strict";

  var CLIENT_ID = (document.currentScript && document.currentScript.getAttribute("data-client-id")) || "default";
  var APP_URL = "https://lebessni.com"; // À remplacer par l'URL de déploiement

  // Éviter double injection
  if (document.getElementById("tryon-widget-root")) return;

  // 1. Injecter le bouton flottant
  var btn = document.createElement("div");
  btn.id = "tryon-widget-btn";
  btn.innerHTML =
    '<button style="all:unset;cursor:pointer;display:flex;align-items:center;gap:8px;padding:12px 20px;background:#4f46e5;color:#fff;border-radius:999px;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(79,70,229,0.4);transition:transform .2s,box-shadow .2s" onmouseover="this.style.transform=\'scale(1.05)\';this.style.boxShadow=\'0 6px 28px rgba(79,70,229,0.6)\'" onmouseout="this.style.transform=\'scale(1)\';this.style.boxShadow=\'0 4px 20px rgba(79,70,229,0.4)\'">' +
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>' +
    "Essaie-le sur toi" +
    "</button>";
  btn.style.cssText =
    "position:fixed;bottom:24px;right:24px;z-index:9999999;";

  // 2. Créer l'iframe (cachée par défaut)
  var iframe = document.createElement("iframe");
  iframe.id = "tryon-widget-frame";
  iframe.src = APP_URL + "/widget-frame?client=" + encodeURIComponent(CLIENT_ID);
  iframe.style.cssText =
    "position:fixed;bottom:90px;right:24px;width:420px;height:620px;max-width:calc(100vw - 48px);max-height:calc(100vh - 120px);border:none;border-radius:20px;box-shadow:0 8px 40px rgba(0,0,0,0.3);display:none;z-index:9999998;background:#0a0a0f;overflow:hidden;";
  iframe.setAttribute("allow", "camera;microphone");

  // 3. Toggle ouverture/fermeture
  btn.addEventListener("click", function () {
    var open = iframe.style.display !== "none";
    iframe.style.display = open ? "none" : "block";
  });

  // 4. Écouter les messages de l'iframe pour fermer
  window.addEventListener("message", function (e) {
    if (e.data === "close-widget") {
      iframe.style.display = "none";
    }
    if (e.data === "open-widget") {
      iframe.style.display = "block";
    }
  });

  document.body.appendChild(btn);
  document.body.appendChild(iframe);
})();
