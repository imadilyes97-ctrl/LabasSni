/**
 * lebeSsni Widget v2
 * Bouton flottant "Essayez-moi !" + popup + détection automatique du produit
 *
 * Usage :
 *   <script src="https://labas-sni.vercel.app/widget.js"
 *     data-boutique="MaBoutique"
 *     data-primary="#6366f1"
 *   ></script>
 *
 * Le widget détecte automatiquement : og:image, og:title, JSON-LD, h1
 * Le vendeur n'a rien à configurer dans le dashboard !
 */

(function () {
  "use strict";

  var S = document.currentScript;
  var C = {
    boutique: S.getAttribute("data-boutique") || "",
    primary: S.getAttribute("data-primary") || "#4f46e5",
    bg: S.getAttribute("data-bg") || "#0a0a0f",
    text: S.getAttribute("data-text") || "#f4f4f5",
    ton: S.getAttribute("data-ton") || "",
    lang: S.getAttribute("data-lang") || "fr",
    hideChat: S.getAttribute("data-hide-chat") === "true",
    position: S.getAttribute("data-position") || "bottom-right",
    btnText: S.getAttribute("data-btn-text") || "\u{1F455} Essayez-moi !",
    btnSize: S.getAttribute("data-btn-size") || "medium",
    logo: S.getAttribute("data-logo") || "",
    pImg: S.getAttribute("data-product-image") || "",
    pName: S.getAttribute("data-product-name") || "",
    pType: S.getAttribute("data-product-type") || "",
  };

  // ── Détection automatique du produit ──
  function detectProduct() {
    var p = { image: C.pImg, name: C.pName, type: C.pType };
    if (p.image && p.name) return p;

    var m;
    if (!p.image) { m = document.querySelector("meta[property='og:image']"); if (m) p.image = m.content || m.getAttribute("content") || ""; }
    if (!p.name)  { m = document.querySelector("meta[property='og:title']"); if (m) p.name = m.content || m.getAttribute("content") || ""; }

    if (!p.image || !p.name) {
      var ld = document.querySelectorAll("script[type='application/ld+json']");
      for (var i = 0; i < ld.length; i++) try {
        var d = JSON.parse(ld[i].textContent), items = d["@graph"] || [d];
        for (var j = 0; j < items.length; j++) if (items[j]["@type"] === "Product") {
          if (!p.image && items[j].image) p.image = Array.isArray(items[j].image) ? items[j].image[0] : items[j].image;
          if (!p.name  && items[j].name)  p.name  = items[j].name;
        }
      } catch (_) {}
    }

    if (!p.name)  { var h1 = document.querySelector("h1"); if (h1) p.name = h1.textContent || ""; }

    if (!p.image) {
      var pi = document.querySelector("meta[property*='product:image'], meta[name*='product:image']");
      if (pi) p.image = pi.content || "";
    }

    if (!p.image) {
      var main = document.querySelector("main, .product, article, #main, .main");
      if (main) { var imgs = main.querySelectorAll("img"); for (var k = 0; k < imgs.length; k++) { if (imgs[k].width > 100 || imgs[k].naturalWidth > 100) { p.image = imgs[k].src; break; } } }
    }
    return p;
  }

  // ── Construction ──
  function build(product) {
    var base = "https://labas-sni.vercel.app";

    var q = new URLSearchParams();
    if (C.boutique) q.set("boutique", C.boutique);
    if (C.primary !== "#4f46e5") q.set("primary_color", encodeURIComponent(C.primary));
    if (C.bg !== "#0a0a0f") q.set("bg_color", encodeURIComponent(C.bg));
    if (C.text !== "#f4f4f5") q.set("text_color", encodeURIComponent(C.text));
    if (C.ton) q.set("ton", encodeURIComponent(C.ton));
    if (C.lang !== "fr") q.set("lang", C.lang);
    if (C.hideChat) q.set("hide_chat", "true");
    if (product.name)  q.set("product_name", product.name);
    if (product.image) q.set("product_image", product.image);
    if (product.type)  q.set("product_type", product.type);
    if (C.logo) q.set("logo_url", C.logo);
    q.set("hide_header", "true");

    var url = base + "/widget-frame?" + q.toString();

    // Styles
    var st = document.createElement("style");
    st.textContent = [
      "#lebessni-btn{position:fixed;z-index:999999;display:flex;align-items:center;gap:8px;padding:12px 20px;border:none;border-radius:50px;cursor:pointer;font-size:15px;font-weight:600;color:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:all 0.2s ease;user-select:none;background:" + C.primary + ";}",
      "#lebessni-btn:hover{transform:scale(1.05);filter:brightness(1.1);}",
      "#lebessni-btn:active{transform:scale(0.95);}",
      "#lebessni-btn." + C.position + "{bottom:24px;right:24px;}",
      "#lebessni-overlay{position:fixed;inset:0;z-index:9999998;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:all 0.25s ease;}",
      "#lebessni-overlay.open{opacity:1;visibility:visible;}",
      "#lebessni-popup{position:fixed;z-index:9999999;width:420px;max-width:95vw;height:90vh;max-height:720px;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);opacity:0;visibility:hidden;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.9);transition:all 0.25s ease;}",
      "#lebessni-popup.open{opacity:1;visibility:visible;transform:translate(-50%,-50%) scale(1);}",
      "#lebessni-popup iframe{width:100%;height:100%;border:none;background:" + C.bg + ";}",
      "@media (max-width:480px){#lebessni-popup{width:100vw;height:100vh;max-height:100vh;border-radius:0;}}",
    ].join("");
    document.head.appendChild(st);

    // Conteneur
    var dv = document.createElement("div");
    dv.id = "lebessni-widget";

    var ov = document.createElement("div");
    ov.id = "lebessni-overlay";

    var pp = document.createElement("div");
    pp.id = "lebessni-popup";
    var fr = document.createElement("iframe");
    fr.src = url;
    fr.setAttribute("allow", "camera");
    pp.appendChild(fr);

    var btn = document.createElement("button");
    btn.id = "lebessni-btn";
    btn.className = C.btnSize + " " + C.position;
    btn.textContent = C.btnText;

    dv.appendChild(ov);
    dv.appendChild(pp);
    dv.appendChild(btn);
    document.body.appendChild(dv);

    function open() {
      ov.classList.add("open");
      pp.classList.add("open");
      btn.style.opacity = "0";
      btn.style.pointerEvents = "none";
      fr.src = url + "&_t=" + Date.now();
    }

    function close() {
      ov.classList.remove("open");
      pp.classList.remove("open");
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
    }

    btn.onclick = open;
    ov.onclick = close;
    window.addEventListener("message", function (e) { if (e.data === "close-widget") close(); });
  }

  if (!document.getElementById("lebessni-widget")) {
    var product = detectProduct();
    build(product);
  }
})();
