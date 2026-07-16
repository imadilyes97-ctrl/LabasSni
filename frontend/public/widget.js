(function () {
  "use strict";

  var script = document.currentScript;

  // ──────────── Lire les data-* attributes ────────────
  var config = {
    productType:  script && script.getAttribute("data-product-type")  || null,
    ton:          script && script.getAttribute("data-ton")          || null,
    boutique:     script && script.getAttribute("data-boutique")     || "",
    primaryColor: script && script.getAttribute("data-primary-color")|| "#4f46e5",
    position:     script && script.getAttribute("data-position")     || "bottom-right",
    clientId:     script && script.getAttribute("data-client-id")    || "default",
  };

  var APP_URL = "https://lebessni.com";

  // ──────────── Éviter double injection ────────────
  if (document.getElementById("tryon-widget-root")) return;

  // ──────────── Construire les query params ────────────
  var qp = new URLSearchParams();
  if (config.productType) qp.set("product_type", config.productType);
  if (config.ton)         qp.set("ton", config.ton);
  if (config.boutique)    qp.set("boutique", config.boutique);
  qp.set("client", config.clientId);

  var isLeft = config.position === "bottom-left";
  var query  = qp.toString();

  // ──────────── Injecter les styles ────────────
  var style = document.createElement("style");
  style.id = "tryon-widget-styles";
  style.textContent =
    "#tryon-widget-btn{" +
      "position:fixed;" +
      (isLeft ? "left:24px;" : "right:24px;") +
      "bottom:24px;z-index:9999999;" +
      "cursor:pointer;display:flex;align-items:center;justify-content:center;" +
      "width:56px;height:56px;border-radius:50%;border:none;" +
      "background:" + config.primaryColor + ";" +
      "color:#fff;box-shadow:0 4px 20px " + config.primaryColor + "66;" +
      "transition:transform .2s,box-shadow .2s,opacity .3s;" +
    "}" +
    "#tryon-widget-btn:hover{" +
      "transform:scale(1.08);" +
      "box-shadow:0 6px 28px " + config.primaryColor + "99;" +
    "}" +
    "#tryon-widget-btn svg{" +
      "width:24px;height:24px;" +
    "}" +
    "#tryon-widget-frame{" +
      "position:fixed;" +
      (isLeft ? "left:24px;" : "right:24px;") +
      "bottom:90px;" +
      "width:380px;height:600px;" +
      "max-width:calc(100vw - 48px);max-height:calc(100vh - 120px);" +
      "border:none;border-radius:20px;" +
      "box-shadow:0 8px 40px rgba(0,0,0,.3);" +
      "z-index:9999998;background:#0a0a0f;overflow:hidden;" +
      "opacity:0;transform:scale(.95) translateY(10px);" +
      "pointer-events:none;" +
      "transition:opacity .25s ease,transform .25s ease;" +
    "}" +
    "#tryon-widget-frame.open{" +
      "opacity:1;transform:scale(1) translateY(0);" +
      "pointer-events:auto;" +
    "}";

  document.head.appendChild(style);

  // ──────────── Créer le FAB (bouton flottant) ────────────
  var btn = document.createElement("button");
  btn.id = "tryon-widget-btn";
  btn.setAttribute("aria-label", "Ouvrir l'essayage virtuel");
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
    '</svg>';

  // ──────────── Créer l'iframe (fermée par défaut) ────────────
  var iframe = document.createElement("iframe");
  iframe.id = "tryon-widget-frame";
  iframe.src = APP_URL + "/widget-frame?" + query;
  iframe.setAttribute("allow", "camera;microphone");
  iframe.setAttribute("loading", "lazy");

  // ──────────── Toggle ouverture/fermeture ────────────
  var isOpen = false;
  btn.addEventListener("click", function () {
    isOpen = !isOpen;
    iframe.classList.toggle("open", isOpen);
  });

  // ──────────── Écouter les messages de l'iframe ────────────
  window.addEventListener("message", function (e) {
    if (e.data === "close-widget") {
      isOpen = false;
      iframe.classList.remove("open");
    }
    if (e.data === "open-widget") {
      isOpen = true;
      iframe.classList.add("open");
    }
  });

  document.body.appendChild(btn);
  document.body.appendChild(iframe);
})();
