const INDEX_URL = "https://raw.githubusercontent.com/claudfatec/forkbible/refs/heads/master/json/index.json";
const BASE_URL  = "https://raw.githubusercontent.com/claudfatec/forkbible/refs/heads/master/json";

let bibleData = null;

const versionSelect = document.getElementById("versionSelect");
const bookSelect    = document.getElementById("bookSelect");
const chapterSelect = document.getElementById("chapterSelect"); // Alterado para Select
const verseSelect   = document.getElementById("verseSelect");   // Alterado para Select
const statusEl      = document.getElementById("status");
const chapterDisplay = document.getElementById("chapterDisplay");
const chapterText    = document.getElementById("chapterText");
const chapterTitle   = document.getElementById("chapterTitle");

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

async function init() {
    try {
        setStatus("Carregando...");
        const indexData = await fetch(INDEX_URL).then(r => r.json());
        versionSelect.innerHTML = "";
        indexData.forEach(lang => {
            const group = document.createElement("optgroup");
            group.label = lang.language;
            lang.versions.forEach(v => {
                group.appendChild(new Option(`${v.name} (${v.abbreviation})`, v.abbreviation));
            });
            versionSelect.appendChild(group);
        });

        versionSelect.value = "pt_nvi"; // Default NVI
        await loadVersion(versionSelect.value);
    } catch (err) {
        setStatus("Erro ao iniciar.", true);
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

        updateChapters(); // Popula capítulos do primeiro livro
    } catch (err) {
        setStatus("Erro ao carregar versão.", true);
    }
}

function updateChapters() {
    const book = bibleData.find(b => b.abbrev === bookSelect.value);
    chapterSelect.innerHTML = "";
    book.chapters.forEach((_, i) => {
        chapterSelect.add(new Option(`Capítulo ${i + 1}`, i + 1));
    });
    updateVerses(); // Popula versículos do primeiro capítulo
}

function updateVerses() {
    const book = bibleData.find(b => b.abbrev === bookSelect.value);
    const chapterIdx = parseInt(chapterSelect.value) - 1;
    const verses = book.chapters[chapterIdx];

    verseSelect.innerHTML = '<option value="">Todos os Versículos</option>';
    verses.forEach((_, i) => {
        verseSelect.add(new Option(`Versículo ${i + 1}`, i + 1));
    });
}

function loadText() {
    const bookId = bookSelect.value;
    const chapNum = parseInt(chapterSelect.value);
    const verseNum = parseInt(verseSelect.value);
    
    const book = bibleData.find(b => b.abbrev === bookId);
    const verses = book.chapters[chapNum - 1];
    const bookName = BOOK_NAME_MAP[bookId] || bookId.toUpperCase();

    chapterTitle.textContent = `${bookName} ${chapNum}`;
    chapterText.innerHTML = "";

    verses.forEach((v, i) => {
        const n = i + 1;
        // Se um versículo específico foi selecionado, apenas ele ou destaque
        if (!verseNum || n === verseNum) {
            const verseDiv = document.createElement("div");
            verseDiv.className = `verse-line ${n === verseNum ? 'highlight' : ''}`;
            verseDiv.innerHTML = `<strong>${n}</strong> ${v}`;
            verseDiv.onclick = () => shareVerse(bookName, chapNum, n, v);
            chapterText.appendChild(verseDiv);
        }
    });

    chapterDisplay.hidden = false;
    document.activeElement.blur();
    chapterDisplay.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function shareVerse(book, chap, vNum, text) {
    const data = {
        title: 'Bíblia Online',
        text: `"${text}" - ${book} ${chap}:${vNum}`,
        url: window.location.href
    };
    if (navigator.share) await navigator.share(data);
}

// Event Listeners
versionSelect.onchange = () => loadVersion(versionSelect.value);
bookSelect.onchange = updateChapters;
chapterSelect.onchange = updateVerses;
document.getElementById("loadChapterBtn").onclick = loadText;

init();
