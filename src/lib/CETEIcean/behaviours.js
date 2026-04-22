/* ══════════════════════════════════════════════════════════════════

   Ceresa TEI Preview – CETEIcean Behaviours & App Logic

   Aligned with ceresa.framework / tei_ceresa.odd

   ══════════════════════════════════════════════════════════════════ */



/* ── CETEIcean Behaviours ─────────────────────────────────────────

   Elements NOT listed here are rendered as custom elements (tei-*)

   and styled purely via CSS. This includes:

     - choice (sic/corr, orig/reg, abbr/expan) → CSS toggle via mode

     - lb, pb, cb → CSS display via mode

     - del, add, subst → CSS display via mode

     - supplied, gap, unclear → CSS via mode

     - hi, rs, foreign → CSS

     - fw, handShift, metamark → CSS

   ──────────────────────────────────────────────────────────────── */



var teiBehaviors = {

  "tei": {

    /* Hide teiHeader */

    "teiHeader": function(e) { this.hideContent(e, false); },



    /* Set document title from titleStmt */

    "title": [["tei-titlestmt>tei-title", function(elt) {

      var t = elt.ownerDocument.createElement("title");

      t.textContent = elt.textContent;

      elt.ownerDocument.querySelector("head").appendChild(t);

    }]],



    /* Convert head to h1-h6 based on nesting depth */

    "head": function(elt) {

      var p = elt.parentElement;

      if (p && /^tei-(table|figure|list|listbibl)$/i.test(p.localName)) return;

      var level = 1, a = elt.parentElement;

      while (a) {

        if (/^tei-(div|body|front|back)$/.test(a.localName)) level++;

        a = a.parentElement;

      }

      if (level > 6) level = 6;

      var h = elt.ownerDocument.createElement("h" + level);

      for (var i = 0; i < elt.childNodes.length; i++) {

        h.appendChild(elt.childNodes[i].cloneNode(true));

      }

      return h;

    },



    /* Links */

    "ptr": ["<a href=\"$rw@target\">$@target</a>"],

    "ref": [["[target]", ["<a href=\"$rw@target\">", "</a>"]]],



    /* Images */

    "graphic": function(elt) {

      var img = elt.ownerDocument.createElement("img");

      img.src = this.rw(elt.getAttribute("url"));

      if (elt.hasAttribute("width"))  img.setAttribute("width",  elt.getAttribute("width"));

      if (elt.hasAttribute("height")) img.setAttribute("height", elt.getAttribute("height"));

      var fig = elt.closest("tei-figure");

      if (fig) {

        var fd = fig.querySelector("tei-figdesc");

        if (fd) img.alt = fd.textContent;

      }

      return img;

    },



    /* Gloss lists → dl/dt/dd */

    "list": [["[type=gloss]", function(elt) {

      var dl = elt.ownerDocument.createElement("dl");

      Array.from(elt.children).forEach(function(ch) {

        if (ch.localName === "tei-label") {

          var dt = elt.ownerDocument.createElement("dt");

          dt.innerHTML = ch.innerHTML;

          dl.appendChild(dt);

        }

        if (ch.localName === "tei-item") {

          var dd = elt.ownerDocument.createElement("dd");

          dd.innerHTML = ch.innerHTML;

          dl.appendChild(dd);

        }

      });

      return dl;

    }]],



    /* Tables → HTML table */

    "table": function(elt) {

      var doc = elt.ownerDocument, tbl = doc.createElement("table");

      if (elt.hasAttribute("id")) tbl.id = elt.getAttribute("id");

      Array.from(elt.children).forEach(function(ch) {

        if (ch.localName === "tei-head") {

          var cap = doc.createElement("caption");

          cap.innerHTML = ch.innerHTML;

          tbl.appendChild(cap);

        } else if (ch.localName === "tei-row") {

          var tr = doc.createElement("tr");

          var isLbl = ch.getAttribute("role") === "label";

          Array.from(ch.children).forEach(function(c) {

            if (c.localName === "tei-cell") {

              var td = doc.createElement((c.getAttribute("role") === "label" || isLbl) ? "th" : "td");

              td.innerHTML = c.innerHTML;

              if (c.hasAttribute("cols")) td.colSpan = c.getAttribute("cols");

              if (c.hasAttribute("rows")) td.rowSpan = c.getAttribute("rows");

              tr.appendChild(td);

            }

          });

          tbl.appendChild(tr);

        }

      });

      return tbl;

    },



    /* Apparatus: show lemma, tooltip with readings */

    "app": function(elt) {

      var doc = elt.ownerDocument, span = doc.createElement("span");

      span.classList.add("tei-apparatus");

      var lem = elt.querySelector("tei-lem");

      if (lem) {

        span.innerHTML = lem.innerHTML;

        var tips = [];

        elt.querySelectorAll("tei-rdg").forEach(function(r) {

          var w = r.getAttribute("wit") || "";

          tips.push((w ? w + ": " : "") + r.textContent);

        });

        if (tips.length) span.title = tips.join(" | ");

      } else {

        span.innerHTML = elt.innerHTML;

      }

      return span;

    },



    /* Verse lines */

    "l": function(elt) {

      var div = elt.ownerDocument.createElement("div");

      div.classList.add("tei-verse-line");

      div.innerHTML = elt.innerHTML;

      if (elt.hasAttribute("n")) {

        var num = elt.ownerDocument.createElement("span");

        num.classList.add("line-number");

        num.textContent = elt.getAttribute("n");

        div.prepend(num);

      }

      return div;

    },



    /* Figures */

    "figure": function(elt) {

      var doc = elt.ownerDocument, fig = doc.createElement("figure");

      Array.from(elt.children).forEach(function(ch) {

        if (ch.localName === "tei-graphic") {

          fig.appendChild(ch.cloneNode(true));

        } else if (ch.localName === "tei-head" || ch.localName === "tei-figdesc") {

          var cap = doc.createElement("figcaption");

          cap.innerHTML = ch.innerHTML;

          fig.appendChild(cap);

        } else {

          fig.appendChild(ch.cloneNode(true));

        }

      });

      return fig;

    },



    /* Cast lists */

    "castList": function(elt) {

      var ul = elt.ownerDocument.createElement("ul");

      ul.classList.add("cast-list");

      elt.querySelectorAll("tei-castitem").forEach(function(ci) {

        var li = elt.ownerDocument.createElement("li");

        li.innerHTML = ci.innerHTML;

        ul.appendChild(li);

      });

      return ul;

    },



    /* Example XML */

    "egXML": function(elt) {

      var pre = elt.ownerDocument.createElement("pre");

      var code = elt.ownerDocument.createElement("code");

      pre.appendChild(code);

      var c = this.serialize(elt, true).replace(/</g, "&lt;");

      var ws = c.match(/^[\t ]+/);

      if (ws) c = c.replace(new RegExp("^" + ws[0], "mg"), "");

      code.innerHTML = c;

      return pre;

    }

  },



  "teieg": {

    "egXML": function(elt) {

      var pre = elt.ownerDocument.createElement("pre");

      var code = elt.ownerDocument.createElement("code");

      pre.appendChild(code);

      var c = this.serialize(elt, true).replace(/</g, "&lt;");

      var ws = c.match(/^[\t ]+/);

      if (ws) c = c.replace(new RegExp("^" + ws[0], "mg"), "");

      code.innerHTML = c;

      return pre;

    }

  },



  "functions": {}

};





/* ══════════════════════════════════════════════════════════════════

   App Logic

   ══════════════════════════════════════════════════════════════════ */



(function() {

  "use strict";



  var container = document.getElementById("TEI");

  var endnotes  = document.getElementById("endnotes");

  var noteList  = document.getElementById("endnote-list");

  var fileLabel = document.getElementById("filename");

  var btnLF     = document.getElementById("btn-lf");

  var btnDF     = document.getElementById("btn-df");



  /* ── URL parameter ──────────────────────────────────────────── */



  function getParam(name) {

    return new URLSearchParams(location.search).get(name) || "";

  }



  function extractFilename(url) {

    try { return decodeURIComponent(url.split("/").pop().split("?")[0]); }

    catch(e) { return url; }

  }



  /* ── DF / LF toggle ────────────────────────────────────────── */



  function setMode(mode) {

    document.body.className = "mode-" + mode;

    btnLF.setAttribute("aria-pressed", String(mode === "lf"));

    btnDF.setAttribute("aria-pressed", String(mode === "df"));

    btnLF.classList.toggle("active", mode === "lf");

    btnDF.classList.toggle("active", mode === "df");

    /* Reset individual choice toggles when switching mode */

    container.querySelectorAll("tei-choice.choice-toggled").forEach(function(el) {

      el.classList.remove("choice-toggled");

    });

  }



  btnLF.addEventListener("click", function() { setMode("lf"); });

  btnDF.addEventListener("click", function() { setMode("df"); });



  /* ── Choice click-to-toggle ────────────────────────────────── */



  container.addEventListener("click", function(e) {

    var choice = e.target.closest("tei-choice");

    if (choice) {

      choice.classList.toggle("choice-toggled");

    }

  });



  /* ── Post-processing: endnotes/footnotes ───────────────────── */



  function processNotes() {

    var noteIdx = 0;

    container.querySelectorAll('tei-note[type="endnote"], tei-note[type="footnote"]').forEach(function(note) {

      noteIdx++;

      var id = "endnote-" + noteIdx;



      var sup = document.createElement("sup");

      var a = document.createElement("a");

      a.className = "endnote-ref";

      a.id = "ref-" + id;

      a.href = "#" + id;

      a.textContent = noteIdx;

      a.setAttribute("role", "doc-noteref");

      sup.appendChild(a);



      var li = document.createElement("li");

      li.id = id;

      li.setAttribute("role", "doc-endnote");

      var back = document.createElement("a");

      back.className = "endnote-back";

      back.href = "#ref-" + id;

      back.textContent = "\u2191";

      back.setAttribute("aria-label", "Back to text");

      li.appendChild(back);

      var span = document.createElement("span");

      span.innerHTML = note.innerHTML;

      li.appendChild(span);

      noteList.appendChild(li);



      note.parentNode.replaceChild(sup, note);

    });

    if (noteIdx > 0) endnotes.hidden = false;

  }



  /* ── Post-processing: hyphens before break="no" ──────────── */



  function processHyphens() {

    container.querySelectorAll('tei-lb[break="no"]').forEach(function(lb) {

      var prev = lb.previousSibling;

      if (prev && prev.nodeType === 3) {

        var text = prev.textContent;

        if (/[-\u00AD\u2010\u2011]$/.test(text)) {

          prev.textContent = text.slice(0, -1);

          var span = document.createElement("span");

          span.className = "hyphen-before-break";

          span.textContent = text.slice(-1);

          lb.parentNode.insertBefore(span, lb);

        }

      }

    });

  }



  /* ── Load TEI ─────────────────────────────────────────────── */



  function loadTEI(url) {

    container.innerHTML = '<p class="loading">Loading\u2026</p>';

    endnotes.hidden = true;

    noteList.innerHTML = "";



    var ct = new CETEI();

    ct.addBehaviors(teiBehaviors);

    ct.getHTML5(url, function(data) {

      container.innerHTML = "";

      container.appendChild(data);

      processNotes();

      processHyphens();

    });

  }



  /* ── Init ───────────────────────────────────────────────────── */



  function init() {

    var url = getParam("url");

    if (!url) {

      container.innerHTML =

        '<p class="placeholder">No TEI file URL provided. Use <code>?url=...</code> parameter.</p>';

      return;

    }



    fileLabel.textContent = extractFilename(url);

    loadTEI(url);

  }



  init();

})();
