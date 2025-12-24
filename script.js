// URLs de dados
const INDEX_URL = "https://raw.githubusercontent.com/claudfatec/forkbible/refs/heads/master/json/index.json";
const BASE_URL  = "https://raw.githubusercontent.com/claudfatec/forkbible/refs/heads/master/json";

// Estado
let bibleData = null; // array de livros da versão atual

// Elementos da UI
const versionSelect = document.getElementById("versionSelect");
const bookSelect    = document.getElementById("bookSelect");
const chapterInput  = document.getElementById("chapterInput");
const verseInput    = document.getElementById("verseInput");

const loadChapterBtn       = document.getElementById("loadChapterBtn");
const searchInput          = document.getElementById("searchInput");
const searchBtn            = document.getElementById("searchBtn");
const clearSearchBtn       = document.getElementById("clearSearchBtn");

const statusEl             = document.getElementById("status");
const chapterDisplay       = document.getElementById("chapterDisplay");
const chapterTitle         = document.getElementById("chapterTitle");
const chapterText          = document.getElementById("chapterText");
const searchResultsSection = document.getElementById("searchResults");
const resultsList          = document.getElementById("resultsList");

// Mapa opcional de abreviações -> nomes (exibe no select)
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

// Utilidades UI
function setStatus(msg, isError = false) {
  statusEl.textContent = msg || "";
  statusEl.classList.toggle("error", isError);
}
function clearChapter() {
  chapterDisplay.hidden = true;
  chapterTitle.textContent = "";
  chapterText.innerHTML = "";
}
function showChapter(bookAbbrev, chapterNum, verses) {
  const title = BOOK_NAME_MAP[bookAbbrev] || bookAbbrev.toUpperCase();
  chapterTitle.textContent = `${title} ${chapterNum}`;
  chapterText.innerHTML = verses
    .map((v, i) => `<strong>${i + 1}</strong> ${escapeHtml(v)}`)
    .join("<br><br>");
  chapterDisplay.hidden = false;
}
function hideSearchResults() {
  searchResultsSection.hidden = true;
  resultsList.innerHTML = "";
}
function showSearchResults(items) {
  resultsList.innerHTML = "";
  if (!items.length) {
    resultsList.innerHTML = "<li class='result-item'>Nenhum resultado.</li>";
  } else {
    items.forEach(it => {
      const li = document.createElement("li");
      li.className = "result-item";
      li.innerHTML = `
        <div class="meta">${escapeHtml(it.book)} ${it.chapter}:${it.verse}</div>
        <div class="snippet">${escapeHtml(it.text)}</div>
      `;
      resultsList.appendChild(li);
    });
  }
  searchResultsSection.hidden = false;
}
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Fluxo de inicialização
async function initVersions() {
  try {
    setStatus("Carregando lista de versões...");
    const indexData = await fetch(INDEX_URL).then(r => r.json());

    versionSelect.innerHTML = "";
    // Cria optgroups por idioma e opções por versão (abbreviation)
    indexData.forEach(lang => {
      const group = document.createElement("optgroup");
      group.label = lang.language;
      lang.versions.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v.abbreviation; // ex.: pt_nvi
        opt.textContent = `${v.name} (${v.abbreviation})`;
        group.appendChild(opt);
      });
      versionSelect.appendChild(group);
    });

    setStatus("");
    // Carrega a primeira versão automaticamente
    if (versionSelect.value) {
      await loadVersion(versionSelect.value);
    }
  } catch (err) {
    console.error(err);
    setStatus("Erro ao carregar index.json.", true);
  }
}

async function loadVersion(versionId) {
  const url = `${BASE_URL}/${versionId}.json`;
  try {
    setStatus("Carregando versão...");
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    bibleData = await resp.json(); // array de livros: [{abbrev, chapters: [][]}, ...]

    // Preenche livros com base em abbrev
    bookSelect.innerHTML = "";
    bibleData.forEach(book => {
      const opt = document.createElement("option");
      opt.value = book.abbrev;
      opt.textContent = BOOK_NAME_MAP[book.abbrev] || book.abbrev.toUpperCase();
      bookSelect.appendChild(opt);
    });

    clearChapter();
    hideSearchResults();
    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("Erro ao carregar a versão selecionada.", true);
  }
}

// Exibir capítulo inteiro
function loadChapter() {
  hideSearchResults();
  clearChapter();

  const bookId  = bookSelect.value;
  const chapter = Number(chapterInput.value);

  if (!bookId || !chapter) {
    setStatus("Selecione o livro e informe o capítulo.", true);
    return;
  }
  const book = bibleData?.find(b => b.abbrev === bookId);
  if (!book) {
    setStatus("Livro não encontrado nesta versão.", true);
    return;
  }
  const verses = book.chapters[chapter - 1];
  if (!Array.isArray(verses)) {
    setStatus("Capítulo não encontrado.", true);
    return;
  }

  showChapter(bookId, chapter, verses);

  // Se o usuário informou um versículo, podemos rolar/destacar opcionalmente
  const verseNum = Number(verseInput.value);
  if (verseNum && verseNum >= 1 && verseNum <= verses.length) {
    // Destaque visual simples adicionando <mark> ao versículo
    const html = verses
      .map((v, i) => {
        const num = i + 1;
        const text = escapeHtml(v);
        if (num === verseNum) {
          return `<strong>${num}</strong> <mark>${text}</mark>`;
        }
        return `<strong>${num}</strong> ${text}`;
      })
      .join("<br><br>");
    chapterText.innerHTML = html;

    // Rolar até o trecho destacado (heurística simples)
    const firstMark = chapterText.querySelector("mark");
    if (firstMark) firstMark.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  setStatus("");
}

// Busca por palavra-chave na versão carregada
function searchKeyword() {
  clearChapter();

  const query = (searchInput.value || "").trim().toLowerCase();
  if (!query) {
    setStatus("Digite uma palavra‑chave para buscar.", true);
    return;
  }
  if (!Array.isArray(bibleData) || bibleData.length === 0) {
    setStatus("Nenhuma versão carregada para buscar.", true);
    return;
  }

  const results = [];
  bibleData.forEach(book => {
    book.chapters.forEach((chapter, ci) => {
      chapter.forEach((verse, vi) => {
        const text = String(verse);
        if (text.toLowerCase().includes(query)) {
          results.push({
            book: BOOK_NAME_MAP[book.abbrev] || book.abbrev.toUpperCase(),
            chapter: ci + 1,
            verse: vi + 1,
            text
          });
        }
      });
    });
  });

  showSearchResults(results);
  setStatus(results.length ? "" : "Nenhum resultado encontrado.");
}

// Eventos
versionSelect.addEventListener("change", async () => {
  clearChapter();
  hideSearchResults();
  await loadVersion(versionSelect.value);
});

bookSelect.addEventListener("change", () => {
  clearChapter();
  hideSearchResults();
});

loadChapterBtn.addEventListener("click", loadChapter);
searchBtn.addEventListener("click", searchKeyword);
clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  hideSearchResults();
  setStatus("");
});

// Inicialização
initVersions();