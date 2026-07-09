export const authorTypes = [
  { value: "fiction", label: "Fiction Author" },
  { value: "nonfiction", label: "Nonfiction Author" },
  { value: "memoir", label: "Memoir Author" },
  { value: "children", label: "Children's Book Author" },
  { value: "series", label: "Series Author" },
  { value: "speaker_expert", label: "Speaker / Expert Author" },
  { value: "not_sure", label: "Not Sure" },
] as const;

export const websiteGoals = [
  { value: "sell_books", label: "Sell more books" },
  { value: "grow_newsletter", label: "Grow newsletter" },
  { value: "look_professional", label: "Look more professional" },
  { value: "book_launch", label: "Promote a book launch" },
  { value: "improve_seo", label: "Improve SEO" },
  { value: "fix_outdated", label: "Fix outdated website" },
  { value: "general_critique", label: "Get general critique" },
] as const;

export type AuthorType = (typeof authorTypes)[number]["value"];
export type WebsiteGoal = (typeof websiteGoals)[number]["value"];
