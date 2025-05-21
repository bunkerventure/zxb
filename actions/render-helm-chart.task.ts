import { $ } from "zx";
import yaml from "yaml";
import minimist from "minimist";
const argv = minimist(process.argv.slice(2));

import { projectDir, isCI } from "./variables";
import fs from "fs/promises";

export const name = "Render helm chart";

export async function run() {
  const file = argv._[1];
  const chart = argv._[2];

  const manifests = yaml
    .parseAllDocuments(await fs.readFile(`${projectDir}/${file}`, "utf8"))
    .map((x) => x.toJS());
  const chartManifest = manifests.find(
    (x) => x.kind === "HelmRelease" && x?.metadata?.name === chart
  );
  console.log(chartManifest);

  const sourceRef = chartManifest.spec.chart.spec.sourceRef;
  const repoManifest = manifests.find(
    (x) => x.kind === "HelmRepository" && x?.metadata?.name === sourceRef.name
  );

  console.log(repoManifest);

  const tmpDir = `${projectDir}/.tmp/${chartManifest.metadata.name}`;

  await $`helm repo add ${repoManifest.metadata.name} ${repoManifest.spec.url}`;
  await $`helm repo update`;
  await $`rm -rf ${tmpDir}`;
  await $`mkdir -p ${tmpDir}`;

  await fs.writeFile(
    `${tmpDir}/values.yaml`,
    yaml.stringify(chartManifest.spec.values)
  );
  await $`helm template ${repoManifest.metadata.name} ${repoManifest.metadata.name}/${chartManifest.spec.chart.spec.chart} --values ${tmpDir}/values.yaml --no-hooks > ${tmpDir}/manifest.yaml`;
}
