const PRACTICAL_ACTIONS: Readonly<Record<string, readonly string[]>> = {
  "Place the author's name clearly in the homepage title and main heading.": [
    "Add the author name to the browser title for the homepage.",
    "Show the same name in the main visible homepage heading.",
    "Check the mobile header so the name remains visible without opening the menu.",
  ],
  "Add simple wording that tells readers what kind of books the author writes.": [
    "Name the primary genre or writing category beside the author name.",
    "Repeat that category in the homepage introduction or featured-book copy.",
    "Use reader-friendly wording such as 'historical romance author' instead of an internal label.",
  ],
  "Use one clear homepage headline that connects the author name, genre, or main reader promise.": [
    "Write one headline that identifies the author and the kind of books readers can expect.",
    "Place it above the fold near the primary image or featured book.",
    "Remove competing slogans that make the main message harder to understand.",
  ],
  "Add an About page or a visible homepage link to the author's bio.": [
    "Create a dedicated About page with a short author biography.",
    "Add an About link to the main navigation and footer.",
    "Include a short homepage bio with a clear link to the full page.",
  ],
  "Add a short introduction that tells readers who the author is and what to do next.": [
    "Add at least one useful introductory paragraph to the homepage.",
    "Explain what the author writes and who the books are for.",
    "End the introduction with a next step such as viewing books or joining the newsletter.",
  ],
  "Show the primary book cover clearly on the homepage or Books page.": [
    "Display a high-quality cover for the newest or most important book.",
    "Link the cover to a book detail page or purchase destination.",
    "Verify that the cover is readable and not cropped on mobile screens.",
  ],
  "Make each book title easy to find near the cover and description.": [
    "Place the full book title beside or directly below its cover.",
    "Use a real text heading rather than relying on words inside the cover image.",
    "Keep the title, cover, description, and buying action together on mobile.",
  ],
  "Add a short book description that helps readers understand why the book is for them.": [
    "Write a concise hook or two-to-three sentence description for each featured book.",
    "Mention the central promise, conflict, or reader appeal without overexplaining the plot.",
    "Place the description before the purchase buttons.",
  ],
  "Add visible buy links near each featured book and on the Books page.": [
    "Add a clearly labeled purchase button beside every featured book.",
    "Use descriptive labels such as 'Buy the book' or the retailer name.",
    "Test each link on desktop and mobile to confirm it reaches the correct edition.",
  ],
  "Offer the main retailer links your readers use, such as Amazon, Apple Books, Kobo, Barnes & Noble, or Bookshop.": [
    "List the retailers where each book is currently available.",
    "Keep retailer choices together beneath the book description.",
    "Remove unavailable stores and periodically test every retailer link.",
  ],
  "Add a short praise or reviews section to help new readers trust the book.": [
    "Select two or three strong review excerpts or endorsements.",
    "Attribute each quote to its reviewer, publication, or source.",
    "Place the strongest proof near the featured book and its buying action.",
  ],
  "Feature at least one current book prominently with its title, cover, description, and buying action.": [
    "Choose the book that should receive the most reader attention now.",
    "Build one complete feature containing its cover, title, hook, and purchase action.",
    "Position the feature high enough on the homepage to be found quickly.",
  ],
  "Add a simple newsletter signup so interested readers can stay connected.": [
    "Add an email signup form connected to the author's mailing platform.",
    "Ask only for the information needed to subscribe.",
    "Show a clear success message and test that new subscribers reach the correct list.",
  ],
  "Place a newsletter signup or clear subscribe link on the homepage.": [
    "Add a signup block to the homepage instead of hiding it on a separate page.",
    "Repeat the signup near the footer for readers who reach the end of the page.",
    "Use a visible button label such as 'Join the newsletter'.",
  ],
  "Offer a simple reader magnet if it fits the author's goals and genre.": [
    "Choose a useful incentive such as a sample chapter, bonus scene, or reading guide.",
    "Explain exactly what the reader receives after subscribing.",
    "Automate delivery and test the download or welcome email before publishing.",
  ],
  "Tell readers what they will receive, such as book news, release updates, or a free sample.": [
    "Add one sentence beside the signup form describing the newsletter content.",
    "State any immediate subscriber benefit or reader magnet.",
    "Set a realistic expectation for email frequency when possible.",
  ],
  "Add a clear page title that includes the author name and writing category.": [
    "Write a unique homepage title using the author name and primary genre.",
    "Keep the important wording near the beginning of the title.",
    "Preview the title in search results and shorten it if it is truncated.",
  ],
  "Use a homepage title such as 'Author Name | Genre Author' or another clear author-brand format.": [
    "Lead with the author's published name.",
    "Add the main genre or author category after the name.",
    "Remove vague phrases that do not help readers or search engines identify the site.",
  ],
  "Add a short meta description that summarizes the author, books, and reader action.": [
    "Write a distinct homepage description in plain language.",
    "Mention the author, genre or books, and the most useful next step.",
    "Keep it concise enough to display well in typical search results.",
  ],
  "Use one clear H1 on each important page, especially the homepage.": [
    "Identify the single main topic of each page and make it the H1.",
    "Change decorative or repeated H1 elements to lower-level headings.",
    "Check that the heading hierarchy remains logical below the H1.",
  ],
  "Make the homepage H1 clear enough for a new reader to understand the site in a few seconds.": [
    "Include the author name, genre, or reader promise in the H1.",
    "Replace poetic but unclear wording with a specific author-focused statement.",
    "Read the H1 without the surrounding design to confirm it still makes sense.",
  ],
  "Review robots and indexing settings before relying on search visibility.": [
    "Inspect the site's robots.txt file for accidental crawl blocks.",
    "Check important pages for noindex directives.",
    "Request indexing again after correcting the settings.",
  ],
  "Link clearly to Books, About, Contact, Newsletter, and other important reader paths.": [
    "Add the essential reader destinations to the primary navigation.",
    "Link relevant homepage sections to their detailed pages.",
    "Use descriptive link labels rather than vague text such as 'Learn more'.",
  ],
  "Review image sizes, scripts, hosting, and caching so mobile visitors get a faster experience.": [
    "Compress and correctly size hero images, book covers, and author photos.",
    "Delay or remove nonessential third-party scripts on initial load.",
    "Enable effective caching and retest the homepage with a mobile performance audit.",
  ],
  "Review mobile accessibility basics such as contrast, labels, alt text, and tap targets.": [
    "Correct low-contrast text and controls.",
    "Add accessible labels and alternative text where they are missing.",
    "Increase small buttons and links so they are easy to tap without overlap.",
  ],
  "Review the mobile Lighthouse search checks for crawlability and page metadata issues.": [
    "Open the failed mobile SEO audit details and address each reported item.",
    "Confirm that the page has a valid title, description, and crawlable links.",
    "Rerun the audit after deployment to verify the corrections.",
  ],
  "Add useful alt text to important images, especially book covers and author photos.": [
    "Describe the purpose or content of each meaningful image.",
    "Include the book title in a cover's alt text and the author name in a portrait's alt text.",
    "Leave purely decorative images with empty alt text so screen readers can skip them.",
  ],
  "Make sure the homepage loads cleanly and presents a readable main heading.": [
    "Fix loading errors or overlays that prevent the homepage content from being inspected.",
    "Provide one visible text H1 in the initial page content.",
    "Retest the public page without being logged in or accepting optional prompts.",
  ],
  "Capture screenshots during analysis so mobile layout issues can be reviewed more confidently.": [
    "Allow the analyzer's browser capture to access the public site.",
    "Remove consent dialogs or bot challenges that permanently cover the page.",
    "Run a fresh scan and review both desktop and mobile captures.",
  ],
  "Review image delivery, scripts, hosting, and caching so desktop pages load more quickly.": [
    "Serve appropriately sized modern image formats where supported.",
    "Remove unused scripts, widgets, and styles from the initial page load.",
    "Configure browser and edge caching, then rerun the desktop audit.",
  ],
  "Review browser errors, security settings, and modern web best practices.": [
    "Open the mobile best-practices audit and list the exact failed checks.",
    "Resolve browser console errors and insecure resource requests.",
    "Update outdated libraries or embeds, then rerun the audit.",
  ],
  "Clean up technical issues reported by Lighthouse best practices.": [
    "Review every failed desktop best-practices item in Lighthouse.",
    "Fix console errors, insecure requests, and outdated browser integrations.",
    "Deploy the changes and verify them with a fresh desktop audit.",
  ],
  "Fix accessibility issues that make the site harder to read or navigate.": [
    "Use the desktop audit to identify the highest-impact accessibility failures.",
    "Correct contrast, form labels, link names, and heading order.",
    "Test keyboard navigation and rerun the accessibility audit.",
  ],
  "Serve the full website over HTTPS and redirect old HTTP addresses.": [
    "Install or renew a valid TLS certificate for every public hostname.",
    "Redirect all HTTP requests to the matching HTTPS address.",
    "Update internal links and embedded assets so they no longer request insecure URLs.",
  ],
  "Fix failed or redirected pages that readers may hit while browsing the site.": [
    "Review each scanned URL that did not return a successful response.",
    "Restore missing pages or redirect retired URLs to the closest useful destination.",
    "Update navigation and internal links so they point directly to the final URL.",
  ],
  "Review robots settings and remove accidental noindex directives from public pages.": [
    "Check robots.txt for rules that block important public sections.",
    "Remove noindex metadata from pages intended to appear in search.",
    "Verify the deployed page with a search-engine URL inspection tool.",
  ],
  "Add canonical URLs and appropriate Person or Organization schema.": [
    "Add a self-referencing canonical URL to each important public page.",
    "Add Person schema for the author with consistent name and official profile links.",
    "Validate the structured data and canonical tags after deployment.",
  ],
  "Add a concise author bio that helps readers, press, and event hosts understand the author.": [
    "Write a short third-person biography covering genre, notable work, and relevant credentials.",
    "Publish the bio on a dedicated About page and summarize it on the homepage.",
    "Keep a copy-ready version available for press and event use.",
  ],
  "Add a professional author photo with descriptive alt text.": [
    "Choose a current, high-resolution portrait that matches the author brand.",
    "Display it on the About page and other relevant trust sections.",
    "Use alt text that identifies the person by their author name.",
  ],
  "Add a simple contact page or email path for readers, press, and opportunities.": [
    "Create a clearly labeled Contact page linked from the navigation or footer.",
    "Provide a working form or purpose-specific email address.",
    "Test submission, confirmation, spam handling, and the destination inbox.",
  ],
  "Link only to active author profiles that help build trust with readers.": [
    "Choose the social platforms the author actively maintains.",
    "Add recognizable text or icon links in the header, footer, or contact area.",
    "Test each profile link and remove abandoned or unrelated accounts.",
  ],
  "Add a media kit if the author wants interviews, speaking, events, or press opportunities.": [
    "Create a media page containing approved bios, photos, book details, and contact information.",
    "Provide downloadable high-resolution assets with clear usage labels.",
    "Link the media kit from the About or Contact page.",
  ],
  "Add a privacy policy, especially if the site collects email subscribers or contact form messages.": [
    "Publish a privacy policy describing the data collected and why.",
    "Name the services used for newsletters, forms, analytics, and cookies.",
    "Link the policy from the footer and beside forms where appropriate.",
  ],
  "Add a small section for praise, awards, reviews, or reader testimonials when available.": [
    "Collect credible proof such as review excerpts, awards, or professional endorsements.",
    "Attribute each item clearly and link to its source when useful.",
    "Place the strongest proof near the author bio or featured book.",
  ],
  "Make sure important pages are linked clearly from the homepage so they can be reviewed.": [
    "List the pages a reader must be able to reach from the homepage.",
    "Add direct links to Books, About, Contact, and Newsletter destinations.",
    "Run a new scan after confirming those links work without scripts or login prompts.",
  ],
  "Review broken pages, redirects, and unavailable content.": [
    "Export or list every non-successful URL found by the scan.",
    "Repair broken destinations and shorten unnecessary redirect chains.",
    "Update all menus and content links to point to working final URLs.",
  ],
  "Add or update a privacy policy and link it from the footer.": [
    "Create a policy that matches the site's actual forms, analytics, cookies, and email tools.",
    "Add a persistent Privacy link in the site footer.",
    "Review the policy whenever the site's data collection tools change.",
  ],
  "Add basic technical structure such as canonical URLs and appropriate Person or Organization schema.": [
    "Add canonical tags to the homepage and other important indexable pages.",
    "Publish accurate Person or Organization structured data for the author brand.",
    "Validate the markup and correct any errors or conflicting identity details.",
  ],
  "Refresh the footer date and review the site for other stale content.": [
    "Update the copyright year or make it update automatically.",
    "Check book availability, event dates, biography details, and external links.",
    "Schedule a recurring content review so the site continues to look maintained.",
  ],
  "Make the primary menu easy to find and give readers direct paths to Books, About, newsletter signup, and contact information.": [
    "Keep the primary menu visible on desktop and provide a clearly labeled menu control on smaller screens.",
    "Verify that opening the mobile menu reveals working internal links to the most important reader destinations.",
    "Test Books, About, newsletter, and Contact paths at desktop, tablet, and mobile widths.",
  ],
  "Remove mobile horizontal overflow so readers can use the page without sideways scrolling or clipped content.": [
    "Identify the element extending beyond the mobile viewport, such as an image, slider, form, or fixed-width container.",
    "Use responsive widths and wrapping while containing intentionally clipped carousel or off-canvas content.",
    "Retest the homepage at a phone width and confirm it no longer scrolls sideways.",
  ],
  "Increase mobile text contrast so important author and book content remains readable.": [
    "Review the flagged text and its rendered background color at the mobile breakpoint.",
    "Adjust text, overlay, or background colors to meet the baseline contrast ratio without losing the author brand.",
    "Recheck buttons, links, headings, and body copy in normal and interactive states.",
  ],
};

export function getPracticalActions(recommendation: string): string[] {
  const actions = PRACTICAL_ACTIONS[recommendation];

  if (!actions) {
    throw new Error(
      `Missing deterministic practical actions for recommendation: ${recommendation}`,
    );
  }

  return [...actions];
}
