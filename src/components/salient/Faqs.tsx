import Image from 'next/image'

import { Container } from '@/components/salient/Container'
import backgroundImage from '@/images/background-faqs.jpg'

const faqs = [
  [
    {
      question: 'Is this a generic SEO audit?',
      answer:
        'No. SEO is one category, but the scorecard is built around author outcomes like book promotion, reader conversion, newsletter growth, trust, and launch readiness.',
    },
    {
      question: 'How are numeric scores created?',
      answer:
        'Scores come from deterministic checks. AI can explain findings in clear language, but it does not invent or change the numeric score.',
    },
    {
      question: 'Can I scan any author website?',
      answer:
        'You can enter a public website URL. The scanner reviews visible pages and records what it can safely inspect.',
    },
  ],
  [
    {
      question: 'What happens after I submit a site?',
      answer:
        'The app queues a scan, generates a report record, and sends you to the report page when the initial scorecard is ready.',
    },
    {
      question: 'Why ask for author type and website goal?',
      answer:
        'Those choices help the recommendations stay relevant for the author context, such as fiction, nonfiction, speaker, coach, or list-building goals.',
    },
    {
      question: 'Will it change my website?',
      answer:
        'No. It only reviews public pages and gives recommendations. You decide what to update.',
    },
  ],
  [
    {
      question: 'What does the admin area show?',
      answer:
        'Admin pages collect scorecards, leads, report status, and settings so GrailHiiv can review scan activity from one backend.',
    },
    {
      question: 'Can the design grow with future pages?',
      answer:
        'Yes. Public pages now use Salient section patterns and backend pages use Catalyst components, giving future content a consistent base.',
    },
    {
      question: 'Where should I start?',
      answer:
        'Start with the analyze form, then compare the generated report with the sample report to see the full scorecard shape.',
    },
  ],
]

export function Faqs() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-slate-50 py-20 sm:py-32"
    >
      <Image
        className="absolute top-0 left-1/2 max-w-none -translate-y-1/4 translate-x-[-30%]"
        src={backgroundImage}
        alt=""
        width={1558}
        height={946}
        unoptimized
      />
      <Container className="relative">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2
            id="faq-title"
            className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-700">
            Practical answers about the scanner, scoring rules, and how the
            author website scorecard is meant to be used.
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3"
        >
          {faqs.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="flex flex-col gap-y-8">
                {column.map((faq, faqIndex) => (
                  <li key={faqIndex}>
                    <h3 className="font-display text-lg/7 text-slate-900">
                      {faq.question}
                    </h3>
                    <p className="mt-4 text-sm text-slate-700">{faq.answer}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
