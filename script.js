// URLs de dados
const INDEX_URL = "https://raw.githubusercontent.com/claudfatec/forkbible/refs/heads/master/json/index.json";
const BASE_URL  = "https://raw.githubusercontent.com/claudfatec/forkbible/refs/heads/master/json";

// Estado da aplicação
let bibleData = null; // Armazena o array de livros da versão atual

// Elementos da Interface (UI)
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

// Mapa de abreviações para nomes completos exibidos no select
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

// Funções Utilitárias de UI
function setStatus(msg, isError = false) {
  statusEl.textContent = msg || "";
  statusEl.className = isError ? "error" : "";
}

function clearChapter() {
  chapterDisplay.hidden = true;
  chapterTitle.textContent = "";
  chapterText.innerHTML = "";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Fluxo de Inicialização e Carregamento
async function initVersions() {
  try {
    setStatus("Carregando lista de versões...");
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

    // Define 'pt_nvi' (Nova Versão Internacional) como padrão se disponível
    const defaultVersion = "pt_nvi";
    if (Array.from(versionSelect.options).some(opt => opt.value === defaultVersion)) {
      versionSelect.value = defaultVersion;
    }

    setStatus("");
    if (versionSelect.value) {
      await loadVersion(versionSelect.value);
    }
  } catch (err) {
    console.error(err);
    setStatus("Erro ao carregar lista de versões.", true);
  }
}

async function loadVersion(versionId) {
  const url = `${BASE_URL}/${versionId}.json`;
  try {
    setStatus("Carregando textos da versão...");
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    bibleData = await resp.json();

    bookSelect.innerHTML = "";
    bibleData.forEach(book => {
      const opt = new Option(BOOK_NAME_MAP[book.abbrev] || book.abbrev.toUpperCase(), book.abbrev);
      bookSelect.add(opt);
    });

    clearChapter();
    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("Erro ao carregar a versão selecionada.", true);
  }
}

// Lógica de exibição de capítulo com melhorias mobile
function loadChapter() {
  searchResultsSection.hidden = true;
  clearChapter();

  const bookId  = bookSelect.value;
  const chapterNum = Number(chapterInput.value);

  if (!bookId || !chapterNum) {
    setStatus("Selecione o livro e informe o capítulo.", true);
    return;
  }

  const book = bibleData?.find(b => b.abbrev === bookId);
  if (!book || !book.chapters[chapterNum - 1]) {
    setStatus("Capítulo não encontrado.", true);
    return;
  }

  const verses = book.chapters[chapterNum - 1];
  const verseToHighlight = Number(verseInput.value);

  chapterTitle.textContent = `${BOOK_NAME_MAP[bookId] || bookId.toUpperCase()} ${chapterNum}`;
  chapterText.innerHTML = verses.map((v, i) => {
    const num = i + 1;
    const text = escapeHtml(v);
    return num === verseToHighlight 
      ? `<strong>${num}</strong> <mark>${text}</mark>` 
      : `<strong>${num}</strong> ${text}`;
  }).join("<br><br>");

  chapterDisplay.hidden = false;
  setStatus("");

  // Melhora UX Mobile: Fecha teclado e rola suavemente para o início do texto
  document.activeElement.blur();
  chapterDisplay.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Busca por palavra-chave na versão carregada
function searchKeyword() {
  clearChapter();
  const query = (searchInput.value || "").trim().toLowerCase();

  if (!query) {
    setStatus("Digite uma palavra‑chave para buscar.", true);
    return;
  }

  const results = [];
  bibleData.forEach(book => {
    book.chapters.forEach((chapter, ci) => {
      chapter.forEach((verse, vi) => {
        if (String(verse).toLowerCase().includes(query)) {
          results.push({
            book: BOOK_NAME_MAP[book.abbrev] || book.abbrev.toUpperCase(),
            chapter: ci + 1,
            verse: vi + 1,
            text: verse
          });
        }
      });
    });
  });

  resultsList.innerHTML = results.length 
    ? results.map(it => `
        <li class="result-item">
          <div class="meta">${escapeHtml(it.book)} ${it.chapter}:${it.verse}</div>
          <div class="snippet">${escapeHtml(it.text)}</div>
        </li>`).join("") 
    : "<li class='result-item'>Nenhum resultado encontrado.</li>";

  searchResultsSection.hidden = false;
  setStatus(results.length ? "" : "Nenhum resultado.");

  // Melhora UX Mobile: Fecha teclado e rola para os resultados
  document.activeElement.blur();
  searchResultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Listeners de Eventos
versionSelect.addEventListener("change", async () => {
  await loadVersion(versionSelect.value);
});

bookSelect.addEventListener("change", clearChapter);
loadChapterBtn.addEventListener("click", loadChapter);
searchBtn.addEventListener("click", searchKeyword);

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  searchResultsSection.hidden = true;
  setStatus("");
});

// Inicializa a aplicação
initVersions();