"use client";

import { ImageIcon } from "lucide-react";
import { useState } from "react";

type PreviewMode = "desktop" | "mobile";

type WebsitePreviewTabsProps = {
  desktopScreenshotUrl: string | null;
  domain: string;
  mobileScreenshotUrl: string | null;
};

export function WebsitePreviewTabs({
  desktopScreenshotUrl,
  domain,
  mobileScreenshotUrl,
}: WebsitePreviewTabsProps) {
  const [activeMode, setActiveMode] = useState<PreviewMode>("desktop");
  const screenshotUrl =
    activeMode === "desktop" ? desktopScreenshotUrl : mobileScreenshotUrl;
  const tabs: PreviewMode[] = ["desktop", "mobile"];

  return (
    <div className="min-w-0 xl:border-l xl:border-gray-200 xl:pl-7 dark:xl:border-gray-800">
      <div className="flex justify-center">
        <div
          className="inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-900"
          role="tablist"
          aria-label="Website screenshot preview"
        >
          {tabs.map((mode) => (
            <button
              key={mode}
              id={`website-preview-${mode}-tab`}
              type="button"
              role="tab"
              aria-controls="website-preview-panel"
              aria-selected={activeMode === mode}
              onClick={() => setActiveMode(mode)}
              className={`min-h-9 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                activeMode === mode
                  ? "bg-white text-gray-950 shadow-sm dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {mode === "desktop" ? "Desktop" : "Mobile"}
            </button>
          ))}
        </div>
      </div>

      <div
        id="website-preview-panel"
        role="tabpanel"
        aria-labelledby={`website-preview-${activeMode}-tab`}
        className={`mt-4 flex aspect-[4/3] w-full items-start justify-center overflow-hidden ${
          activeMode === "desktop"
            ? "rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900"
            : "bg-transparent"
        }`}
      >
        {screenshotUrl ? (
          activeMode === "desktop" ? (
            // The scan can return local or externally hosted screenshot URLs.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={activeMode}
              src={screenshotUrl}
              alt={`Desktop screenshot of ${domain}`}
              className="h-full w-full bg-white object-cover object-top"
            />
          ) : (
            <div className="aspect-[390/844] h-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900">
              {/* Show the saved mobile viewport as a plain, non-scrollable screenshot. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={activeMode}
                src={screenshotUrl}
                alt={`Mobile screenshot of ${domain}`}
                className="h-full w-full bg-white object-cover object-top"
              />
            </div>
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <ImageIcon className="size-7 text-gray-400" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
              {activeMode === "desktop" ? "Desktop" : "Mobile"} preview
              unavailable
            </p>
            <p className="mt-1 max-w-52 text-xs leading-5 text-gray-500 dark:text-gray-400">
              This screenshot was not saved during the scan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
