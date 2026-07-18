// ==UserScript==
// @name         Aimoge NG extension example
// @match        https://nijiurachan.net/*
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  function install(aimoge) {
    aimoge.register("post:beforeRender", function (post) {
      if (typeof post.body === "string" && /広告サンプル/.test(post.body)) {
        return null;
      }
      return post;
    });
  }

  if (window.aimoge) {
    install(window.aimoge);
  } else {
    (window.aimogeQueue = window.aimogeQueue || []).push(install);
  }
})();
