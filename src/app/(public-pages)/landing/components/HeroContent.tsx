import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { startWebsiteAnalysis } from "../actions";

const HeroContent = ({ activeDomain }: { activeDomain?: string }) => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (
      !activeDomain ||
      window.sessionStorage.getItem("scroll-to-website-result") !== "1"
    ) {
      return;
    }

    window.sessionStorage.removeItem("scroll-to-website-result");
    window.requestAnimationFrame(() => {
      const result = document.getElementById("website-audit-result");

      if (!result) {
        return;
      }

      window.scrollTo({
        top: window.scrollY + result.getBoundingClientRect().top,
        behavior: "smooth",
      });
    });
  }, [activeDomain]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const websiteUrl = String(formData.get("websiteUrl") ?? "");

    startTransition(async () => {
      const result = await startWebsiteAnalysis({ websiteUrl });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      window.sessionStorage.setItem("scroll-to-website-result", "1");
      router.replace(`/?domain=${encodeURIComponent(result.domain)}`, {
        scroll: false,
      });
    });
  };

  return (
    <section className="mx-auto flex min-h-[100dvh] max-w-7xl items-center px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="w-full text-left">
        <h1 className="relative z-10 max-w-4xl text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-gray-950 sm:text-5xl md:text-6xl lg:text-7xl dark:text-white">
          Author Website Analyzer
        </h1>

        <p className="relative z-10 mt-7 max-w-3xl text-base leading-7 text-gray-600 sm:text-lg md:text-xl md:leading-8 dark:text-gray-300">
          Run a free audit of your author website in seconds. Get a clear,
          practical report showing how well your site supports your book,
          author brand, reader experience, and marketing goals.
        </p>

        <div className="relative z-10 mt-10 max-w-3xl">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="hero-website-url" className="sr-only">
              Author website URL
            </label>
            <input
              id="hero-website-url"
              name="websiteUrl"
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoComplete="url"
              spellCheck={false}
              required
              placeholder="Enter a domain or website URL"
              className="min-h-16 min-w-0 flex-1 rounded-full border border-gray-300 bg-white px-5 text-base text-gray-900 shadow-sm outline-none transition placeholder:text-gray-500 hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={isPending}
              className="min-h-16 shrink-0 cursor-pointer rounded-full bg-blue-600 px-7 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:min-w-56"
            >
              {isPending ? "Analyzing..." : "Analyze Website"}
            </button>
          </form>

          {error ? (
            <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : null}

          <p className="mt-5 text-sm text-gray-500 sm:text-base dark:text-gray-400">
            4,000+ sites analyzed · No login required · See your result in 30
            seconds
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroContent;
