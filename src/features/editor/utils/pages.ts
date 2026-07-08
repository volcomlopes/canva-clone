import { uuid } from "uuidv4";

// ============================================
// FUNDACAO MULTIPAGINA (Slides 1)
// Funcoes puras: sem React, sem Fabric. So transformam dados.
// ============================================

export const CURRENT_PAGE_VERSION = 2;
export const MAX_PAGES = 50;

// Uma pagina = um canvas serializado (o mesmo formato que o Fabric ja gera)
export interface EditorPage {
  id: string;
  json: any; // conteudo do canvas (objects, background, etc)
}

// O documento version 2 completo
export interface EditorDocumentV2 {
  version: 2;
  pages: EditorPage[];
}

// Gera id unico de pagina
export const makePageId = (): string => {
  return uuid();
};

// Detecta se um objeto ja parseado esta no formato version 2
export const isV2Document = (data: any): data is EditorDocumentV2 => {
  return (
    !!data &&
    typeof data === "object" &&
    data.version === 2 &&
    Array.isArray(data.pages)
  );
};

// ============================================
// MIGRACAO LAZY: pega qualquer formato e devolve version 2
// - Se ja e v2: retorna como esta (com paginas garantidas)
// - Se e formato antigo (1 tela): embrulha numa unica pagina
// - Se e string: faz o parse antes
// ============================================
export const migrateToV2 = (input: string | any): EditorDocumentV2 => {
  let data: any = input;

  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch {
      // String invalida: cria documento vazio de 1 pagina
      return {
        version: 2,
        pages: [{ id: makePageId(), json: {} }],
      };
    }
  }

  // Ja e v2
  if (isV2Document(data)) {
    // Garante ao menos 1 pagina
    if (!data.pages || data.pages.length === 0) {
      return {
        version: 2,
        pages: [{ id: makePageId(), json: {} }],
      };
    }
    // Garante que toda pagina tem id
    const pages = data.pages.map((p) => ({
      id: p.id || makePageId(),
      json: p.json ?? {},
    }));
    return { version: 2, pages };
  }

  // Formato antigo: o data inteiro E o conteudo de 1 tela
  return {
    version: 2,
    pages: [{ id: makePageId(), json: data ?? {} }],
  };
};

// Extrai o json de uma pagina especifica (pra carregar no canvas)
export const getPageJson = (
  doc: EditorDocumentV2,
  pageId: string
): any | null => {
  const page = doc.pages.find((p) => p.id === pageId);
  return page ? page.json : null;
};

// Retorna o id da primeira pagina (a "capa")
export const getFirstPageId = (doc: EditorDocumentV2): string => {
  return doc.pages[0]?.id || makePageId();
};

// Atualiza o json de uma pagina e devolve o documento novo (imutavel)
export const setPageJson = (
  doc: EditorDocumentV2,
  pageId: string,
  json: any
): EditorDocumentV2 => {
  const pages = doc.pages.map((p) =>
    p.id === pageId ? { ...p, json } : p
  );
  return { ...doc, pages };
};

// Serializa o documento v2 pra string (pra salvar no banco)
export const serializeDocument = (doc: EditorDocumentV2): string => {
  return JSON.stringify(doc);
};