/** Valor sentinela del &lt;select&gt; para “seguir latest” (no pin). */
export const WORKSPACE_VERSION_SELECT_LATEST = "__awf_latest__";

export function workspaceArtifactPinSelectModel(pinnedVersion: string, publishedVersions: string[]) {
  const pin = pinnedVersion.trim();
  const legacyOption = pin !== "" && !publishedVersions.includes(pin);
  const selectValue = pin === "" ? WORKSPACE_VERSION_SELECT_LATEST : pin;
  return { selectValue, legacyOption, legacyPin: pin };
}
