/* SIP · Mi registro SERUMS
   Guarda atenciones en este dispositivo (localStorage), exporta a Excel (.xlsx) y a copia de seguridad (.json).
   Lo usan las herramientas (EDI ahora; HIS y FUA después). No envía datos a ningún servidor. */
(function () {
  "use strict";
  var KEY = "sip_registro_v1";

  function leer() {
    try { var a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function escribir(a) { localStorage.setItem(KEY, JSON.stringify(a)); }

  /* Guarda un registro; si ya existe uno con el mismo id lo reemplaza (no duplica). */
  function guardar(rec) {
    var a = leer();
    rec.id = rec.id || ("r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    rec.guardado = new Date().toISOString();
    var i = a.findIndex(function (r) { return r.id === rec.id; });
    if (i >= 0) a[i] = rec; else a.push(rec);
    escribir(a);
    return { total: a.length, actualizado: i >= 0 };
  }
  function borrar(id) { escribir(leer().filter(function (r) { return r.id !== id; })); }
  function vaciar() { escribir([]); }

  /* Une una copia de seguridad con lo que ya hay (no borra nada; ignora ids repetidos). */
  function importar(texto) {
    var nuevo = JSON.parse(texto);
    if (nuevo && nuevo.registros) nuevo = nuevo.registros;
    if (!Array.isArray(nuevo)) throw new Error("El archivo no es una copia de seguridad válida.");
    var a = leer(), ids = {}, n = 0;
    a.forEach(function (r) { ids[r.id] = 1; });
    nuevo.forEach(function (r) { if (r && r.id && r.tipo && !ids[r.id]) { a.push(r); ids[r.id] = 1; n++; } });
    escribir(a);
    return n;
  }
  function copiaJSON() {
    return JSON.stringify({ app: "SIP-SERUM-APP", version: 1, exportado: new Date().toISOString(), registros: leer() }, null, 1);
  }

  /* ---------- Escritor mínimo de .xlsx (zip sin compresión) ---------- */
  var enc = new TextEncoder();
  function crc32(b) {
    var crc = -1;
    for (var i = 0; i < b.length; i++) {
      crc ^= b[i];
      for (var k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
    return (crc ^ -1) >>> 0;
  }
  function u16(n) { return [n & 255, (n >> 8) & 255]; }
  function u32(n) { return [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255]; }
  function zip(files) {
    var partes = [], central = [], off = 0;
    files.forEach(function (f) {
      var nm = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data), sz = data.length;
      var lh = [0x50, 0x4b, 3, 4].concat(u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(sz), u32(sz), u16(nm.length), u16(0));
      partes.push(new Uint8Array(lh), nm, data);
      var ch = [0x50, 0x4b, 1, 2].concat(u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(sz), u32(sz), u16(nm.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off));
      central.push(new Uint8Array(ch), nm);
      off += lh.length + nm.length + sz;
    });
    var csz = 0; central.forEach(function (c) { csz += c.length; });
    var fin = [0x50, 0x4b, 5, 6].concat(u16(0), u16(0), u16(files.length), u16(files.length), u32(csz), u32(off), u16(0));
    return new Blob(partes.concat(central, [new Uint8Array(fin)]), { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }
  function xml(t) { return String(t).replace(/[&<>"]/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]; }).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ""); }
  function col(n) { var s = ""; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  /* Estilos: 0 normal, 1 encabezado, 2 verde, 3 amarillo, 4 rojo, 5 título */
  var ESTILO = { V: 2, A: 3, R: 4 };
  function hoja(rows, anchos) {
    var x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
    if (anchos) x += "<cols>" + anchos.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join("") + "</cols>";
    x += "<sheetData>";
    rows.forEach(function (r, ri) {
      x += '<row r="' + (ri + 1) + '">';
      r.forEach(function (c, ci) {
        var v = c, s = ri === 0 ? 1 : 0;
        if (c && typeof c === "object") { v = c.v; if (c.s != null) s = c.s; }
        if (v === null || v === undefined || v === "") { if (s) x += '<c r="' + col(ci) + (ri + 1) + '" s="' + s + '"/>'; return; }
        var ref = col(ci) + (ri + 1);
        if (typeof v === "number" && isFinite(v)) x += '<c r="' + ref + '" s="' + s + '"><v>' + v + "</v></c>";
        else x += '<c r="' + ref + '" s="' + s + '" t="inlineStr"><is><t xml:space="preserve">' + xml(v) + "</t></is></c>";
      });
      x += "</row>";
    });
    return x + "</sheetData></worksheet>";
  }
  var ESTILOS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFBDD7EE"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFC6EFCE"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFFEB9C"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFFC7CE"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF999999"/></left><right style="thin"><color rgb="FF999999"/></right><top style="thin"><color rgb="FF999999"/></top><bottom style="thin"><color rgb="FF999999"/></bottom><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>' +
    '<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>' +
    '<xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFill="1" applyBorder="1"/></cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  /* hojas: [{nombre, filas:[[...]], anchos:[...]}] */
  function xlsx(hojas) {
    var NS = "http://schemas.openxmlformats.org/";
    var files = [
      { name: "[Content_Types].xml", text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        hojas.map(function (h, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join("") + "</Types>" },
      { name: "_rels/.rels", text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + NS + 'officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: "xl/workbook.xml", text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="' + NS + 'spreadsheetml/2006/main" xmlns:r="' + NS + 'officeDocument/2006/relationships"><sheets>' +
        hojas.map(function (h, i) { return '<sheet name="' + xml(h.nombre.replace(/[\[\]:*?\/\\]/g, " ").slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join("") + "</sheets></workbook>" },
      { name: "xl/_rels/workbook.xml.rels", text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        hojas.map(function (h, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="' + NS + 'officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join("") +
        '<Relationship Id="rId' + (hojas.length + 1) + '" Type="' + NS + 'officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: "xl/styles.xml", text: ESTILOS }
    ];
    hojas.forEach(function (h, i) { files.push({ name: "xl/worksheets/sheet" + (i + 1) + ".xml", text: hoja(h.filas, h.anchos) }); });
    return zip(files);
  }

  /* ---------- Hojas del informe ---------- */
  var NIVEL = { V: "Desarrollo normal", A: "Rezago en el desarrollo", R: "Riesgo de retraso en el desarrollo" };
  function fechaISO(r) { return r.fecha || (r.guardado || "").slice(0, 10); }
  function ddmmaa(iso) { var p = (iso || "").split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : iso || ""; }
  function hojasInforme(regs) {
    regs = regs.slice().sort(function (a, b) { return fechaISO(a) < fechaISO(b) ? -1 : 1; });
    var p = function (r) { return r.paciente || {}; }, d = function (r) { return r.datos || {}; };
    /* Resumen por mes y tipo */
    var meses = {}, tipos = {};
    regs.forEach(function (r) {
      var m = fechaISO(r).slice(0, 7) || "sin fecha"; tipos[r.tipo] = 1;
      meses[m] = meses[m] || {}; meses[m][r.tipo] = (meses[m][r.tipo] || 0) + 1;
    });
    var tl = Object.keys(tipos).sort(), ml = Object.keys(meses).sort();
    var res = [["Mes"].concat(tl, ["Total"])];
    var tot = {}; var gt = 0;
    ml.forEach(function (m) {
      var fila = [m], s = 0;
      tl.forEach(function (t) { var n = meses[m][t] || 0; fila.push(n); s += n; tot[t] = (tot[t] || 0) + n; });
      fila.push(s); gt += s; res.push(fila);
    });
    res.push([{ v: "TOTAL", s: 1 }].concat(tl.map(function (t) { return { v: tot[t] || 0, s: 1 }; }), [{ v: gt, s: 1 }]));
    var edi = regs.filter(function (r) { return r.tipo === "EDI"; });
    if (edi.length) {
      res.push([""], [{ v: "Resultado global de la prueba EDI", s: 1 }, { v: "Cantidad", s: 1 }]);
      ["V", "A", "R"].forEach(function (k) { res.push([{ v: NIVEL[k], s: ESTILO[k] }, edi.filter(function (r) { return r.resultado === k; }).length]); });
    }
    var H = [{ nombre: "Resumen", filas: res, anchos: [16].concat(tl.map(function () { return 12; }), [10]) }];
    /* Detalle EDI */
    if (edi.length) {
      var f = [["Fecha de evaluación", "Aplicación", "Niño(a)", "Fecha de nacimiento", "Edad", "Edad corregida", "Semanas de gestación", "Grupo de edad", "Motriz gruesa", "Motriz fina", "Lenguaje", "Social", "Conocimiento", "Señales de alarma presentes", "Exploración neurológica alterada", "FRB presentes", "Señales de alerta presentes", "Resultado global", "Madre/padre/cuidador", "Teléfonos", "Tipo de seguro", "IPRESS", "Microrred/RIS", "Población indígena", "Quién aplica"]];
      var nm = { V: "Verde", A: "Amarillo", R: "Rojo", "": "" };
      edi.forEach(function (r) {
        var x = d(r), q = p(r);
        var c = function (k) { return { v: nm[x[k] || ""], s: ESTILO[x[k]] || 0 }; };
        f.push([ddmmaa(fechaISO(r)), x.aplicacion || "", q.nombre || "", q.fnac || "", x.edad || "", x.edadCorr || "", x.semanas === "" || x.semanas == null ? "" : x.semanas, (x.grupo || "") + (x.rango ? " · " + x.rango : ""), c("MG"), c("MF"), c("LE"), c("SO"), c("CO"), x.ala, x.en, x.frb, x.ale, { v: NIVEL[r.resultado] || "", s: ESTILO[r.resultado] || 0 }, q.cuidador || "", q.tel || "", q.seguro || "", r.ipress || "", r.micro || "", r.indigena || "", r.aplica || ""]);
      });
      H.push({ nombre: "EDI", filas: f, anchos: [14, 14, 26, 14, 20, 20, 12, 18, 12, 12, 12, 12, 12, 12, 14, 10, 12, 30, 26, 14, 14, 20, 16, 12, 24] });
    }
    /* Todos los registros */
    var t = [["Fecha", "Tipo", "Detalle", "Paciente", "Resultado", "Registrado el"]];
    regs.forEach(function (r) {
      t.push([ddmmaa(fechaISO(r)), r.tipo, r.titulo || "", p(r).nombre || "", { v: NIVEL[r.resultado] || r.resultado || "", s: ESTILO[r.resultado] || 0 }, (r.guardado || "").replace("T", " ").slice(0, 16)]);
    });
    H.push({ nombre: "Todos los registros", filas: t, anchos: [14, 10, 34, 28, 34, 18] });
    return H;
  }
  function descargar(blob, nombre) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function stamp() { var d = new Date(); return d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0"); }
  function exportarExcel(regs) {
    regs = regs || leer();
    descargar(xlsx(hojasInforme(regs)), "informe-serums-" + stamp() + ".xlsx");
  }
  function exportarCopia() {
    descargar(new Blob([copiaJSON()], { type: "application/json" }), "respaldo-serums-" + stamp() + ".json");
  }

  window.SIP_REGISTRO = { leer: leer, guardar: guardar, borrar: borrar, vaciar: vaciar, importar: importar, copiaJSON: copiaJSON, exportarExcel: exportarExcel, exportarCopia: exportarCopia, xlsx: xlsx, hojasInforme: hojasInforme, NIVEL: NIVEL };
})();
