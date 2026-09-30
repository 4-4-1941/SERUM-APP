window.SERUMS_DATA = {};
// Compatibility entry: ordered, parser-time scripts preserve existing synchronous consumers.
(function () {
  const entry = document.currentScript;
  if (document.readyState !== 'loading') throw new Error('Cargar este archivo como script normal durante el parseo HTML.');
  const base = new URL('./core/', entry.src);
  (entry.hasAttribute('data-defer-catalogs') ? ["sip-data-config","sip-data-cases","sip-data-dashboard"] : ["sip-data-config","sip-data-cases","sip-data-dashboard","sip-data-reference","sip-data-assistant","sip-data-training"]).forEach(name => {
    const url = new URL(name + '.js?v=20260929-core-final', base).href;
    document.write('<script src="' + url.replace(/&/g,'&amp;').replace(/"/g,'&quot;') + '"><\/script>');
  });
})();
