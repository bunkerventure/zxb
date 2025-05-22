#!/usr/bin/env zx
import { $ } from "zx";
import { projectDir } from "./variables.ts";
import fs from "fs";

export const name = "Generate GitVersion";

export async function run() {
  if (await fs.existsSync(`${projectDir}/GitVersion.yaml`)) {
    fs.writeFileSync(
      `${projectDir}/GitVersion.yaml`,
      "mode: ContinuousDeployment\n"
    );
  }

  const versionOutput =
    await $`docker run --rm -v "$(pwd):/repo" gittools/gitversion:6.3.0 /repo`.quiet();
  const versionObj = JSON.parse(versionOutput.stdout.toString());
  const version = versionObj.FullSemVer;

  if (process.env.CI == "true") {
    await $`git config user.name "${process.env.GITHUB_USERNAME}"
      git config user.email "github-actions@users.noreply.github.com"
      existingTag=$(git tag -l "${version}")
      if [ -z "$existingTag" ]; then
          echo "tagging with version ${version}"
          git tag -a "${version}" -m "Version ${version}"
          git push origin "${version}"
      else 
          echo "tag ${version} already exists"
      fi`;
  } else {
    console.log(
      `Tagging with version ${version} but skipping it locally (Only CI)`
    );
  }

  return { version };
}
