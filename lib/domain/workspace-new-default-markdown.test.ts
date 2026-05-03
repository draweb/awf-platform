import { describe, expect, it } from "vitest";
import { DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD } from "./workspace-new-default-markdown";

describe("DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD", () => {
  const TOTAL_SECTIONS = 13;

  it(`incluye las ${TOTAL_SECTIONS} secciones numeradas esperadas`, () => {
    for (let i = 1; i <= TOTAL_SECTIONS; i++) {
      expect(DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD).toContain(`## ${i}.`);
    }
  });

  it("es un string no vacío", () => {
    expect(DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD.length).toBeGreaterThan(500);
  });

  it("usa @COMPLETAR como marcador para input del usuario", () => {
    const matches = DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD.match(/@COMPLETAR/g);
    expect(matches!.length).toBeGreaterThanOrEqual(15);
  });

  it("incluye instrucciones directas para el agente copiloto", () => {
    expect(DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD).toContain("Regla para el agente:");
    expect(DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD).toContain("agente copiloto de configuración");
  });

  it("evita duplicar la constitución estructurada: remisión al panel", () => {
    expect(DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD).toContain("Constitución estructurada");
    expect(DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD).toContain("panel");
    expect(DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD).not.toContain("## 14.");
    expect(DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD).not.toMatch(/IDENTIDAD DEL PROYECTO/);
    expect(DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD).not.toMatch(/STACK TÉCNICO/);
  });

  it("define las secciones del playbook operativo", () => {
    const expectedHeaders = [
      "Fuentes de verdad y roles",
      "ESTRUCTURA DEL REPOSITORIO",
      "COMANDOS OPERATIVOS",
      "Política normativa (solo lectura cruzada)",
      "DEVOPS Y DEPLOY",
      "FLUJOS DE TRABAJO",
      "PROBLEMAS CONOCIDOS",
      "SUB-AGENTES",
      "INTEGRACIONES (MCP)",
      "HOOKS (AUTOMATIZACIÓN)",
      "PRIORIDAD DE GENERACIÓN",
      "FORMATO DE SALIDA",
      "VALIDACIÓN",
    ];
    for (const header of expectedHeaders) {
      expect(DEFAULT_NEW_WORKSPACE_SYSTEM_PROMPT_MD).toContain(header);
    }
  });
});
