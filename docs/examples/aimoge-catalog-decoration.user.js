// ==UserScript==
// @name         Aimoge catalog decoration example
// @match        https://nijiurachan.net/*
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  function install(aimoge) {
    aimoge.register("catalog:rendered", function (payload) {
      if (payload.element.dataset.aimogeCatalogMarked) return;
      payload.element.dataset.aimogeCatalogMarked = "1";
      payload.element.classList.add("aimoge-catalog-extension-marked");
      payload.element.title = "threadId: " + payload.threadId;
    });
  }

  if (window.aimoge) {
    install(window.aimoge);
  } else {
    (window.aimogeQueue = window.aimogeQueue || []).push(install);
  }
})();
