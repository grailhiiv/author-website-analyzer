const steps = [
  {
    number: "1",
    copy: "Enter a domain or website URL in the field above.",
  },
  {
    number: "2",
    copy: "The analyzer checks your site across key author-focused areas.",
  },
  {
    number: "3",
    copy: "Review key findings, and clear recommendations for what to improve next.",
  },
];

const HowItWorks = ({ showTopBorder = true }: { showTopBorder?: boolean }) => {
  return (
    <section
      className={`py-20 sm:py-24 ${
        showTopBorder
          ? "border-t border-gray-200 dark:border-gray-800"
          : ""
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="my-6 text-5xl text-gray-950 dark:text-white">
            How to Use the Website Analyzer
          </h2>
          <p className="mx-auto max-w-[600px] text-gray-600 dark:text-gray-300">
            The analyzer checks your author website for the signals that matter
            most.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 sm:gap-12 lg:grid-cols-3 lg:gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-4 text-left sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[5rem_minmax(0,1fr)] lg:gap-4"
            >
              <p className="text-right text-7xl font-semibold leading-none text-blue-600 sm:text-8xl dark:text-blue-400">
                {step.number}
              </p>
              <p className="text-xl leading-8 text-gray-950 dark:text-white">
                {step.copy}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
