import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

try {
  const packageJson = await readJson(path.join(root, "package.json"));
  const packageLock = await readJson(path.join(root, "package-lock.json"));
  const directDependencies = Object.keys(packageJson.dependencies ?? {});
  const problems = [];

  for (const dependency of directDependencies) {
    const installedPath = path.join(
      root,
      "node_modules",
      ...dependency.split("/"),
      "package.json",
    );
    const lockedVersion =
      packageLock.packages?.[`node_modules/${dependency}`]?.version;

    try {
      const installedPackage = await readJson(installedPath);

      if (lockedVersion && installedPackage.version !== lockedVersion) {
        problems.push(
          `${dependency}: installed ${installedPackage.version}, locked ${lockedVersion}`,
        );
      }
    } catch {
      problems.push(`${dependency}: missing from node_modules`);
    }
  }

  if (problems.length > 0) {
    console.error("\nDependencies are not synchronized with package-lock.json:");

    for (const problem of problems) {
      console.error(`- ${problem}`);
    }

    console.error(
      "\nRun `npm ci`, then retry the command. The repo's .npmrc handles the current peer-dependency policy.\n",
    );
    process.exit(1);
  }
} catch (error) {
  console.error("Unable to verify installed dependencies.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
