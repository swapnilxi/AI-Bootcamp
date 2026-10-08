/* config.js — THE place to configure the landing page.
   Set APP_URL to the deployed Next.js app; every Book / Portal / Services / About link is rewritten from it.
   When served by the app itself (http/https origin), the current origin is used automatically. */
(function (MS) {
  "use strict";

  // Edit this for static hosting (e.g. opening the file from disk or a separate CDN deploy).
  var FALLBACK_APP_URL = "https://ai-bootcamp-lms-zeta.vercel.app";

  MS.APP_URL = window.location.origin.indexOf("http") === 0 ? window.location.origin : FALLBACK_APP_URL;

  // selector -> app path. Selectors may match several elements.
  MS.LINKS = [
    ["#brand-link", "/"],
    ["#nav-login-btn", "/login"],
    ["#nav-book-btn", "/book"],
    ["#hero-book-btn", "/book"],
    ["#hero-services-btn", "/services"],
    ["#about-read-more", "/about"],
    [".app-book-link", "/book"],
    [".app-portal-link", "/login"],
    [".footer-book-link", "/book"],
    [".footer-services-link", "/services"],
    ["#footer-about-link", "/about"],
    ["#footer-classes-link", "/classes"],
    ["#footer-contact-link", "/contact"],
    ["#footer-portal-link", "/login"]
  ];

  MS.applyLinks = function () {
    MS.LINKS.forEach(function (pair) {
      document.querySelectorAll(pair[0]).forEach(function (el) { el.href = MS.APP_URL + pair[1]; });
    });
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  };
})(window.AIBootcamp = window.AIBootcamp || {});
