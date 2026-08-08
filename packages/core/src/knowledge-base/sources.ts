import type { KnowledgeBaseSource } from "../contract";

export const ZOKU_DOCS_SITE_URL = "https://isnaenihidayat.github.io/zoku";
export const ZOKU_DOCS_LLMS_URL = `${ZOKU_DOCS_SITE_URL}/llms.txt`;

export const DEFAULT_KNOWLEDGE_SOURCES: KnowledgeBaseSource[] = [
  {
    id: "zoku-docs",
    title: "Zoku Documentation",
    url: ZOKU_DOCS_LLMS_URL,
    description:
      "Official Zoku docs index (llms.txt). Fetch this first with web_fetch, then fetch specific .md pages listed in the index.",
    kind: "url",
    inherited: true,
    enabled: true,
  },
];

export async function listKnowledgeBaseSources(): Promise<KnowledgeBaseSource[]> {
  return DEFAULT_KNOWLEDGE_SOURCES.filter((source) => source.enabled).map((source) => ({
    ...source,
  }));
}
