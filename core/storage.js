(function initSerumsStorage(global) {
  "use strict";

  function loadProgress(key, fallback) {
    try {
      return JSON.parse(global.localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function saveProgress(key, value) {
    global.localStorage.setItem(key, JSON.stringify(value));
  }

  global.SERUMS_STORAGE = Object.freeze({
    loadProgress,
    saveProgress
  });
})(window);
