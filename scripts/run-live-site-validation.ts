import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import {
  runLiveSiteValidation,
  type LiveSiteValidationReport,
} from "@/lib/validation/live-site-validation";

type CliOptions = {
  manifestPath: string;
  outputPath: string;
};

function usage() {
  return [
    "Usage:",
    "  npm run validate:live-sites -- --manifest <approved-manifest.json> [--output <report.json>]",
    "",
    "The manifest must use schemaVersion 1.0.0 and every site must set approved: true.",
  ].join("\n");
}

function requireValue(args: string[], index: number, flag: string) {
  const value = args[index + 1];

  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

export function parseLiveSiteValidationCliArgs(
  args: string[],
  cwd = process.cwd(),
): CliOptions {
  let manifestPath: string | null = null;
  let outputPath: string | null = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--manifest") {
      manifestPath = requireValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--output") {
      outputPath = requireValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      throw new Error(usage());
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!manifestPath) {
    throw new Error(`--manifest is required.\n\n${usage()}`);
  }

  const resolvedManifestPath = path.resolve(cwd, manifestPath);
  const timestamp = new Date().toISOString().replaceAll(":", "-");

  return {
    manifestPath: resolvedManifestPath,
    outputPath: outputPath
      ? path.resolve(cwd, outputPath)
      : path.join(
          cwd,
          "artifacts",
          "live-site-validation",
          `report-${timestamp}.json`,
        ),
  };
}

function hasFailures(report: LiveSiteValidationReport) {
  return (
    report.summary.crawlFailedSites > 0 ||
    report.summary.runnerErrorSites > 0 ||
    report.summary.failedExpectations > 0
  );
}

async function main() {
  const options = parseLiveSiteValidationCliArgs(process.argv.slice(2));
  const manifest = JSON.parse(await readFile(options.manifestPath, "utf8"));
  const report = await runLiveSiteValidation({ manifest });

  await mkdir(path.dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    [
      `Live validation completed: ${report.summary.completedSites}/${report.summary.totalSites} sites`,
      `Expectation results: ${report.summary.passedExpectations} passed, ${report.summary.failedExpectations} failed`,
      `Sanitized report: ${options.outputPath}`,
    ].join("\n"),
  );

  if (hasFailures(report)) {
    process.exitCode = 1;
  }
}

if (process.argv[1]?.endsWith("run-live-site-validation.ts")) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Validation failed.";
    console.error(message);
    process.exitCode = 1;
  });
}
