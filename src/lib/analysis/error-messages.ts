export const GENERIC_PUBLIC_ANALYSIS_ERROR =
  "We ran into a technical problem while building this report. Please try the scan again.";

const PUBLIC_ERROR_PREFIXES = [
  "Enter a ",
  "That website",
  "We could not reach that website",
  "We could not verify that website address",
  "We could not establish a secure connection to that website",
  "The website homepage could not be crawled",
  "The homepage could not be read well enough to analyze",
] as const;

export function getAnalysisErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "The analysis job could not be completed.";
}

export function getPublicAnalysisErrorMessage(error: unknown) {
  const message = getAnalysisErrorMessage(error).trim();

  if (message.includes("exceeded the maximum allowed runtime")) {
    return "The website took too long to analyze. Please try the scan again.";
  }

  if (PUBLIC_ERROR_PREFIXES.some((prefix) => message.startsWith(prefix))) {
    return message;
  }

  return GENERIC_PUBLIC_ANALYSIS_ERROR;
}
