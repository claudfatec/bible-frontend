# ��� Bíblia Frontend

Um projeto simples em **HTML, CSS e JavaScript puro** para leitura da Bíblia diretamente do navegador.  
O sistema consome arquivos JSON hospedados no repositório [forkbible](https://github.com/claudfatec/forkbible), permitindo selecionar **versão, livro e capítulo** e exibir todos os versículos do capítulo escolhido.

---

## ��� Funcionalidades

- Seleção de **versão bíblica** a partir de um `index.json` que organiza idiomas e traduções.
- Exibição de **livros disponíveis** na versão escolhida.
- Exibição de **capítulo inteiro**, com todos os versículos numerados.
- Busca por **palavra‑chave** em toda a versão carregada.
- Destaque opcional de um versículo específico dentro do capítulo exibido.
- Interface responsiva e leve, sem dependências externas.

----

## ��� Estrutura dos dados

Cada versão é um arquivo JSON no formato:

```json
[
  {
    "abbrev": "gn",
    "chapters": [
      ["No princípio Deus criou os céus e a terra.", "Versículo 2", "..."],
      ["Capítulo 2 - Versículo 1", "..."]
    ]
  },
  {
    "abbrev": "ex",
    "chapters": [...]
  }
]

