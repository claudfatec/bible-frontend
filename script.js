const INDEX_URL = "https://raw.githubusercontent.com/claudfatec/forkbible/refs/heads/master/json/index.json";
const BASE_URL  = "https://raw.githubusercontent.com/claudfatec/forkbible/refs/heads/master/json";

let bibleData = null;

const versionSelect = document.getElementById("versionSelect");
const bookSelect    = document.getElementById("bookSelect");
const chapterInput  = document.getElementById("chapterInput");
const verseInput    = document.getElementById("verseInput");
const statusEl      = document.getElementById("status");
const chapterDisplay = document.getElementById("chapterDisplay");
const chapterTitle   = document.getElementById("chapterTitle");
const chapterText    = document.getElementById("chapterText");
const searchResultsSection = document.getElementById("searchResults");
const resultsList    = document.getElementById("resultsList");

const BOOK_NAME_MAP = {
  gn: "Gênesis", ex: "Êxodo", lv: "Levítico", nm: "Números", dt: "Deuteronômio",
  js: "Josué", jz: "Juízes", rt: "Rute", "1sm": "1 Samuel", "2sm": "2 Samuel",
  "1rs": "1 Reis", "2rs": "2 Reis", "1cr": "1 Crônicas", "2cr": "2 Crônicas",
  ed: "Esdras", ne: "Neemias", et: "Ester", jó: "Jó", sl: "Salmos", pv: "Provérbios",
  ec: "Eclesiastes", ct: "Cantares", is: "Isaías", jr: "Jeremias", lm: "Lamentações",
  ez: "Ezequiel", dn: "Daniel", os: "Oséias", jl: "Joel", am: "Amós", ob: "Obadias",
  jn: "Jonas", mq: "Miquéias", na: "Naum", hc: "Habacuque", sf: "Sofonias",
  ag: "Ageu", zc: "Zacarias", ml: "Malaquias",
  mt: "Mateus", mc: "Marcos", lc: "Lucas", jo: "João", at: "Atos",
  rm: "Romanos", "1co": "1 Coríntios", "2co": "2 Coríntios", gl: "Gálatas",
  ef: "Efésios", fp: "Filipenses", cl: "Colossenses", "1ts": "1 Tessalonicenses",
  "2ts": "2 Tessalonicenses", "1tm": "1 Timóteo", "2tm": "2 Timóteo", tt: "Tito",
  fm: "Filemom", hb: "Hebreus", tg: "Tiago", "1pe": "1 Pedro", "2pe": "2 Pedro",
  "1jo": "1 João", "2jo": "2 João", "3jo": "3 João", jd: "Judas", ap: "Apocalipse"
};

function setStatus(msg, isError = false) {
  statusEl.textContent = msg || "";
  statusEl.className = isError ? "error" : "";
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function initVersions() {
  try {
    setStatus("Carregando...");
    const indexData = await fetch(INDEX_URL).then(r => r.json());
    versionSelect.innerHTML = "";
    indexData.forEach(lang => {
      const group = document.createElement("optgroup");
      group.label = lang.language;
      lang.versions.forEach(v => {
        const opt = new Option(`${v.name} (${v.abbreviation})`, v.abbreviation);
        group.appendChild(opt);
      });
      versionSelect.appendChild(group);
    });
    if (versionSelect.value) await loadVersion(versionSelect.value);
  } catch (err) {
    setStatus("Erro ao carregar lista.", true);
  }
}

async function loadVersion(versionId) {
  try {
    setStatus("Carregando versão...");
    const resp = await fetch(`${BASE_URL}/${versionId}.json`);
    bibleData = await resp.json();
    bookSelect.innerHTML = "";
    bibleData.forEach(book => {
      bookSelect.add(new Option(BOOK_NAME_MAP[book.abbrev] || book.abbrev.toUpperCase(), book.abbrev));
    });
    setStatus("");
  } catch (err) {
    setStatus("Erro ao carregar versão.", true);
  }
}

function loadChapter() {
  const bookId = bookSelect.value;
  const chapterNum = Number(chapterInput.value);
  const book = bibleData?.find(b => b.abbrev === bookId);
  const verses = book?.chapters[chapterNum - 1];

  if (!verses) {
    setStatus("Selecione um capítulo válido.", true);
    return;
  }

  searchResultsSection.hidden = true;
  chapterTitle.textContent = `${BOOK_NAME_MAP[bookId] || bookId.toUpperCase()} ${chapterNum}`;
  
  const verseToHighlight = Number(verseInput.value);
  chapterText.innerHTML = verses.map((v, i) => {
    const n = i + 1;
    const txt = escapeHtml(v);
    return n === verseToHighlight 
      ? `<strong>${n}</strong> <mark>${txt}</mark>` 
      : `<strong>${n}</strong> ${txt}`;
  }).join("<br><br>");

  chapterDisplay.hidden = false;
  setStatus("");

  // UX Mobile: Rolar para o texto e fechar teclado
  document.activeElement.blur();
  chapterDisplay.scrollIntoView({ behavior: "smooth", block: "start" });
}

function searchKeyword() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  if (!query) return;

  const results = [];
  bibleData.forEach(book => {
    book.chapters.forEach((chap, ci) => {
      chap.forEach((v, vi) => {
        if (v.toLowerCase().includes(query)) {
          results.push({
            book: BOOK_NAME_MAP[book.abbrev] || book.abbrev,
            chapter: ci + 1, verse: vi + 1, text: v
          });
        }
      });
    });
  });

  resultsList.innerHTML = results.length ? results.map(r => `
    <li class="result-item">
      <div class="meta">${r.book} ${r.chapter}:${r.verse}</div>
      <div class="snippet">${escapeHtml(r.text)}</div>
    </li>`).join("") : "<li>Sem resultados.</li>";

  chapterDisplay.hidden = true;
  searchResultsSection.hidden = false;
  
  document.activeElement.blur();
  searchResultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Eventos
versionSelect.addEventListener("change", () => loadVersion(versionSelect.value));
document.getElementById("loadChapterBtn").addEventListener("click", loadChapter);
document.getElementById("searchBtn").addEventListener("click", searchKeyword);
document.getElementById("clearSearchBtn").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  searchResultsSection.hidden = true;
});

initVersions();