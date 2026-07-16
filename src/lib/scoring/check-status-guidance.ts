import type {
  ScoringCheckDefinition,
  ScoringCheckId,
} from "@/lib/scoring/check-registry";

type CheckStatusGuidanceSeed = {
  passedDetails: string;
  passedRecommendation: string;
  maintenanceTip: string;
  verificationTip: string;
};

export type CheckStatusGuidance = {
  details: string;
  recommendation: string;
  practicalActions: string[];
};

const CHECK_STATUS_GUIDANCE = {
  "brand.author_name": {
    passedDetails:
      "The scan found the author name presented clearly in the website content or identity signals.",
    passedRecommendation:
      "Keep the published author name prominent and consistent across the homepage, page title, and navigation.",
    maintenanceTip:
      "Check that the author name remains visible in the desktop and mobile header.",
    verificationTip:
      "Confirm that a new visitor can see the published author name in the homepage title, main heading, or header.",
  },
  "brand.genre_positioning": {
    passedDetails:
      "The scan found wording that communicates the author's genre or writing category.",
    passedRecommendation:
      "Keep the primary genre or writing category close to the author name and introductory message.",
    maintenanceTip:
      "Review the genre wording when the author brand or publishing focus changes.",
    verificationTip:
      "Read the homepage introduction and confirm that it names the primary genre or writing category in plain language.",
  },
  "brand.homepage_headline": {
    passedDetails:
      "The homepage includes a headline that gives visitors useful author-brand context.",
    passedRecommendation:
      "Preserve one clear headline that connects the author identity with the books or reader promise.",
    maintenanceTip:
      "Check that promotional banners do not compete with or obscure the main author headline.",
    verificationTip:
      "Confirm that the main homepage headline identifies the author, the type of books, or a clear reader promise.",
  },
  "brand.about_path": {
    passedDetails:
      "The scan found an About page, author biography section, or a clear path to author information.",
    passedRecommendation:
      "Keep the About path easy to find from the primary navigation or homepage.",
    maintenanceTip:
      "Review the biography periodically so titles, credentials, and links remain current.",
    verificationTip:
      "Use the main navigation and homepage links to confirm that readers can reach a visible author biography.",
  },
  "brand.homepage_content_depth": {
    passedDetails:
      "The homepage contains enough introductory text to give readers useful context about the author or books.",
    passedRecommendation:
      "Keep the introduction concise, specific, and connected to a clear next step.",
    maintenanceTip:
      "Re-read the homepage introduction after major content edits to make sure it still explains what the author writes.",
    verificationTip:
      "Confirm that the public homepage contains a meaningful introduction rather than only images, sliders, or navigation labels.",
  },
  "books.cover_visibility": {
    passedDetails:
      "The scan found a visible book-cover image in the inspected website content.",
    passedRecommendation:
      "Keep at least one current, readable book cover prominent on the homepage or Books page.",
    maintenanceTip:
      "Check that cover images remain sharp, correctly cropped, and readable on mobile screens.",
    verificationTip:
      "Confirm that a current book cover is visibly displayed and not hidden inside a slider, popup, or inaccessible image.",
  },
  "books.title_visibility": {
    passedDetails:
      "The scan found book-title text presented in the inspected website content.",
    passedRecommendation:
      "Keep each book title in real text near its cover, description, and purchase options.",
    maintenanceTip:
      "Check new book sections to make sure the title is not shown only inside the cover artwork.",
    verificationTip:
      "Confirm that each featured book has a readable text title beside or directly below its cover.",
  },
  "books.description": {
    passedDetails:
      "The scan found descriptive copy that explains a book or gives readers a useful story hook.",
    passedRecommendation:
      "Keep the strongest book description close to the related cover and buying action.",
    maintenanceTip:
      "Review each new release page for a concise hook or synopsis before publishing it.",
    verificationTip:
      "Confirm that at least one featured book includes a visible hook, blurb, or short description in page text.",
  },
  "books.purchase_links": {
    passedDetails:
      "The scan found a visible link or action that can take readers toward purchasing a book.",
    passedRecommendation:
      "Keep purchase actions clearly labeled, working, and close to the correct book.",
    maintenanceTip:
      "Test every purchase link after changing retailers, editions, or book-page layouts.",
    verificationTip:
      "Click the visible book-buying actions and confirm that each reaches the intended retailer or purchase page.",
  },
  "books.retailer_options": {
    passedDetails:
      "The scan found more than one retailer or purchase destination for readers.",
    passedRecommendation:
      "Keep the available retailer choices grouped together and remove destinations that no longer sell the book.",
    maintenanceTip:
      "Test retailer links periodically and confirm that they point to the correct book edition and region.",
    verificationTip:
      "Confirm that at least two current retailer options are visibly offered for a featured book.",
  },
  "books.reader_proof": {
    passedDetails:
      "The scan found reader proof such as reviews, praise, endorsements, ratings, or awards.",
    passedRecommendation:
      "Keep the strongest credible proof near the featured book and identify its source clearly.",
    maintenanceTip:
      "Replace weak or outdated quotes when stronger attributed reviews become available.",
    verificationTip:
      "Confirm that visible review excerpts, endorsements, ratings, or awards are attributed to a credible source.",
  },
  "books.featured_book": {
    passedDetails:
      "The scan found a featured-book presentation in the inspected website content.",
    passedRecommendation:
      "Keep one priority book easy to discover with its cover, title, hook, and buying action together.",
    maintenanceTip:
      "Update the featured selection when the author's current release or promotional priority changes.",
    verificationTip:
      "Confirm that one current book is intentionally featured with enough information for a new reader to act.",
  },
  "engagement.newsletter_signup": {
    passedDetails:
      "The scan found a newsletter signup path or an email subscription form.",
    passedRecommendation:
      "Keep the signup short, clearly labeled, and connected to the correct mailing list.",
    maintenanceTip:
      "Submit a test address periodically and confirm that the success message and welcome email work.",
    verificationTip:
      "Complete the newsletter form or follow the subscribe link and confirm that it accepts a valid email address.",
  },
  "engagement.homepage_signup": {
    passedDetails:
      "The scan found a newsletter signup form or clear subscription link on the homepage.",
    passedRecommendation:
      "Keep the homepage signup visible without forcing readers to search for a separate subscription page.",
    maintenanceTip:
      "Check the signup placement on mobile and after homepage layout changes.",
    verificationTip:
      "Confirm that a visible signup form or clearly labeled newsletter link appears on the public homepage.",
  },
  "engagement.reader_magnet": {
    passedDetails:
      "The scan found a reader incentive such as a sample, bonus scene, free book, or reading guide.",
    passedRecommendation:
      "Keep the reader magnet specific, relevant, and clear about what subscribers will receive.",
    maintenanceTip:
      "Test the incentive delivery and update any expired files or welcome-email links.",
    verificationTip:
      "Confirm that the site visibly offers a reader incentive and explains how and when it will be delivered.",
  },
  "engagement.subscriber_benefit": {
    passedDetails:
      "The scan found wording that explains what readers receive by subscribing.",
    passedRecommendation:
      "Keep the subscriber benefit specific and place it beside the signup action.",
    maintenanceTip:
      "Update the benefit statement whenever newsletter content, frequency, or incentives change.",
    verificationTip:
      "Read the signup copy and confirm that it states what subscribers can expect, such as release news or bonus content.",
  },
  "search.title_tag": {
    passedDetails: "The homepage includes a non-empty HTML title tag.",
    passedRecommendation:
      "Keep the title unique, descriptive, and focused on the author and primary writing category.",
    maintenanceTip:
      "Review the browser title after SEO, theme, or homepage-setting changes.",
    verificationTip:
      "Inspect the public homepage source or browser tab and confirm that a meaningful title tag is present.",
  },
  "search.author_title_format": {
    passedDetails:
      "The homepage title contains useful author or brand-identifying wording.",
    passedRecommendation:
      "Keep the published author name near the beginning of the title and retain relevant genre context.",
    maintenanceTip:
      "Preview the title in search results after changing the author brand or homepage SEO settings.",
    verificationTip:
      "Confirm that the homepage title identifies the author or author brand instead of using only a vague slogan.",
  },
  "search.meta_description": {
    passedDetails: "The homepage includes a non-empty meta description.",
    passedRecommendation:
      "Keep the description concise and aligned with the author, books, and most useful reader action.",
    maintenanceTip:
      "Review the description whenever the featured book or primary homepage message changes.",
    verificationTip:
      "Inspect the homepage metadata and confirm that a distinct, meaningful meta description is present.",
  },
  "search.single_h1": {
    passedDetails:
      "The inspected page has one identifiable main heading without a multiple-H1 conflict.",
    passedRecommendation:
      "Keep one primary H1 that describes the page and use lower heading levels for supporting sections.",
    maintenanceTip:
      "Recheck heading levels after editing page-builder sections or theme templates.",
    verificationTip:
      "Inspect the homepage heading structure and confirm that it contains one clear H1.",
  },
  "search.h1_clarity": {
    passedDetails:
      "The main heading includes useful wording that supports author or book clarity.",
    passedRecommendation:
      "Keep the H1 understandable on its own and connected to the author identity or reader promise.",
    maintenanceTip:
      "Read the H1 without surrounding images to confirm that it remains specific and meaningful.",
    verificationTip:
      "Confirm that the visible H1 helps a new visitor understand whose site it is or what the author writes.",
  },
  "search.indexability": {
    passedDetails:
      "The scan did not find an obvious robots or noindex signal blocking the inspected page from search engines.",
    passedRecommendation:
      "Keep important public pages crawlable and review indexing settings after SEO or privacy changes.",
    maintenanceTip:
      "Use a search-engine URL inspection tool after migrations, redesigns, or domain changes.",
    verificationTip:
      "Inspect robots.txt and page-level robots metadata to confirm that important public pages are not blocked or marked noindex.",
  },
  "search.internal_links": {
    passedDetails:
      "The scan found useful internal links connecting visitors to important website content.",
    passedRecommendation:
      "Keep descriptive links to Books, About, Contact, newsletter, and other priority reader paths.",
    maintenanceTip:
      "Test internal links after renaming pages, changing permalinks, or restructuring navigation.",
    verificationTip:
      "Follow homepage links and confirm that readers can reach the site's important author, book, and contact pages.",
  },
  "mobile.pagespeed_performance": {
    passedDetails:
      "PageSpeed reported a mobile performance score at or above the current target.",
    passedRecommendation:
      "Protect the mobile performance baseline when adding images, scripts, fonts, embeds, or marketing tools.",
    maintenanceTip:
      "Retest mobile performance after theme updates and major homepage content changes.",
    verificationTip:
      "Run a current mobile PageSpeed audit and confirm that the performance score meets the analyzer target.",
  },
  "mobile.pagespeed_accessibility": {
    passedDetails:
      "PageSpeed reported a mobile accessibility score at or above the current target.",
    passedRecommendation:
      "Maintain accessible contrast, labels, alternative text, and touch targets as the site changes.",
    maintenanceTip:
      "Recheck keyboard, screen-reader labels, and mobile controls after updating the theme or forms.",
    verificationTip:
      "Run a current mobile PageSpeed accessibility audit and review both the score and individual audit results.",
  },
  "mobile.text_contrast": {
    passedDetails:
      "Measured mobile text samples met the analyzer's baseline contrast requirement with sufficient coverage.",
    passedRecommendation:
      "Preserve readable text and control contrast across mobile backgrounds, overlays, and interaction states.",
    maintenanceTip:
      "Recheck contrast after changing brand colors, hero images, overlays, buttons, or link styles.",
    verificationTip:
      "Measure representative mobile headings, body text, links, and buttons against their rendered backgrounds.",
  },
  "mobile.pagespeed_seo": {
    passedDetails:
      "PageSpeed reported a mobile SEO score at or above the current target.",
    passedRecommendation:
      "Maintain crawlable links and complete page metadata as mobile content and templates change.",
    maintenanceTip:
      "Review the individual SEO audits after changing navigation, metadata, or rendering behavior.",
    verificationTip:
      "Run a current mobile PageSpeed SEO audit and confirm that the score meets the analyzer target.",
  },
  "mobile.image_alt_text": {
    passedDetails:
      "The scan did not find the current missing-alt-text signal on inspected meaningful images.",
    passedRecommendation:
      "Keep descriptive alt text on book covers, author portraits, and other meaningful images.",
    maintenanceTip:
      "Review alt text whenever new book covers, banners, or author photos are uploaded.",
    verificationTip:
      "Inspect meaningful homepage images and confirm that each has useful alt text while decorative images use empty alt text.",
  },
  "mobile.homepage_structure": {
    passedDetails:
      "The homepage loaded successfully and exposed a readable main heading to the scan.",
    passedRecommendation:
      "Keep the primary content and H1 available without requiring login, interaction, or optional overlays.",
    maintenanceTip:
      "Test the public homepage in a signed-out mobile browser after theme, popup, or consent-tool changes.",
    verificationTip:
      "Open the public homepage on mobile and confirm that it loads successfully with a visible main heading.",
  },
  "mobile.viewport_fit": {
    passedDetails:
      "The rendered mobile homepage showed no confirmed page-level horizontal overflow.",
    passedRecommendation:
      "Preserve responsive widths and wrapping so the page continues to fit without sideways scrolling.",
    maintenanceTip:
      "Retest the mobile viewport after adding sliders, forms, embeds, tables, or fixed-width media.",
    verificationTip:
      "Open the homepage at a phone width and confirm that the document does not scroll sideways or clip essential content.",
  },
  "technical.desktop_performance": {
    passedDetails:
      "PageSpeed reported a desktop performance score at or above the current target.",
    passedRecommendation:
      "Protect the desktop performance baseline when introducing larger media, scripts, widgets, or fonts.",
    maintenanceTip:
      "Retest desktop performance after theme updates and major page-layout changes.",
    verificationTip:
      "Run a current desktop PageSpeed audit and confirm that the performance score meets the analyzer target.",
  },
  "technical.mobile_best_practices": {
    passedDetails:
      "PageSpeed reported a mobile best-practices score at or above the current target.",
    passedRecommendation:
      "Maintain secure, error-free browser behavior as scripts, embeds, and dependencies change.",
    maintenanceTip:
      "Review browser-console errors and PageSpeed audit details after plugin or integration updates.",
    verificationTip:
      "Run a current mobile PageSpeed best-practices audit and inspect any individual warnings or failures.",
  },
  "technical.desktop_best_practices": {
    passedDetails:
      "PageSpeed reported a desktop best-practices score at or above the current target.",
    passedRecommendation:
      "Keep desktop browser integrations secure, current, and free of avoidable console errors.",
    maintenanceTip:
      "Retest after updating analytics, embeds, third-party widgets, or frontend libraries.",
    verificationTip:
      "Run a current desktop PageSpeed best-practices audit and inspect any individual warnings or failures.",
  },
  "technical.desktop_accessibility": {
    passedDetails:
      "PageSpeed reported a desktop accessibility score at or above the current target.",
    passedRecommendation:
      "Maintain accessible labels, contrast, headings, and keyboard behavior across desktop layouts.",
    maintenanceTip:
      "Repeat keyboard and automated accessibility checks after changing navigation, forms, or templates.",
    verificationTip:
      "Run a current desktop PageSpeed accessibility audit and review both the score and individual findings.",
  },
  "technical.https": {
    passedDetails: "The inspected homepage uses an HTTPS address.",
    passedRecommendation:
      "Keep HTTPS enforced for every public hostname and avoid loading insecure page assets.",
    maintenanceTip:
      "Monitor certificate renewal and test HTTP-to-HTTPS redirects after hosting or domain changes.",
    verificationTip:
      "Open the homepage and key public URLs and confirm that they use valid HTTPS without certificate or mixed-content warnings.",
  },
  "technical.page_responses": {
    passedDetails:
      "The homepage and inspected pages returned successful responses under this technical-health check.",
    passedRecommendation:
      "Keep important pages available and update links promptly when URLs are retired or moved.",
    maintenanceTip:
      "Run a broken-link check after changing permalinks, navigation, or hosting configuration.",
    verificationTip:
      "Open the scanned URLs and confirm that they return successful pages rather than errors or unnecessary redirect chains.",
  },
  "technical.indexability": {
    passedDetails:
      "The technical scan did not find an obvious indexing block on the inspected public content.",
    passedRecommendation:
      "Preserve search-engine access when changing robots rules, SEO plugins, or deployment settings.",
    maintenanceTip:
      "Review robots.txt and noindex settings after staging-to-production migrations.",
    verificationTip:
      "Inspect robots.txt, response headers, and page metadata for directives that could block important public pages.",
  },
  "technical.canonical_or_schema": {
    passedDetails:
      "The scan found a canonical URL or relevant Person or Organization structured data.",
    passedRecommendation:
      "Keep canonical and identity markup accurate, consistent, and aligned with the public author URL.",
    maintenanceTip:
      "Validate structured data after changing domains, author names, SEO plugins, or page templates.",
    verificationTip:
      "Inspect the homepage source for a valid canonical tag or accurate Person or Organization structured data.",
  },
  "trust.author_bio": {
    passedDetails:
      "The scan found author-biography content in the inspected website pages.",
    passedRecommendation:
      "Keep the biography current, specific, and easy for readers, press, and event organizers to find.",
    maintenanceTip:
      "Update the bio when books, awards, credentials, representation, or speaking details change.",
    verificationTip:
      "Confirm that a visible author bio explains the writer's work and appears on an accessible About page or section.",
  },
  "trust.author_photo": {
    passedDetails:
      "The scan found an image signal consistent with a visible author photo.",
    passedRecommendation:
      "Keep a current, professional author portrait visible with descriptive alt text.",
    maintenanceTip:
      "Check that the portrait remains sharp, correctly cropped, and identifiable on mobile screens.",
    verificationTip:
      "Confirm that an accessible About or homepage section displays a recognizable author portrait with useful alt text.",
  },
  "trust.contact_path": {
    passedDetails:
      "The scan found a contact form, email path, or clearly identified contact destination.",
    passedRecommendation:
      "Keep the contact path easy to find and make sure submissions reach a monitored inbox.",
    maintenanceTip:
      "Send a test message periodically and review spam filtering and confirmation behavior.",
    verificationTip:
      "Follow the site's Contact path and submit or inspect the form or email link to confirm that it works.",
  },
  "trust.social_profiles": {
    passedDetails: "The scan found links to one or more social profiles.",
    passedRecommendation:
      "Keep only active, relevant author profiles and make their destinations clear to readers.",
    maintenanceTip:
      "Test profile links and remove abandoned, renamed, or unrelated accounts.",
    verificationTip:
      "Open each visible social link and confirm that it reaches the author's active official profile.",
  },
  "trust.media_kit": {
    passedDetails:
      "The scan found a media-kit or press-resource signal in the inspected website content.",
    passedRecommendation:
      "Keep media resources current, downloadable, and easy for press or event organizers to use.",
    maintenanceTip:
      "Review biographies, cover files, headshots, contact details, and usage labels after each release.",
    verificationTip:
      "Confirm that the media or press page provides usable author assets, book information, and a contact path.",
  },
  "trust.privacy_policy": {
    passedDetails: "The scan found a privacy-policy page or link.",
    passedRecommendation:
      "Keep the policy accessible and aligned with the site's actual forms, analytics, cookies, and email tools.",
    maintenanceTip:
      "Review the policy whenever data collection, newsletter, analytics, or form services change.",
    verificationTip:
      "Open the Privacy link and confirm that the policy is public, current, and describes the site's actual data practices.",
  },
  "trust.reader_proof": {
    passedDetails:
      "The scan found credibility proof such as praise, reviews, awards, ratings, or related structured data.",
    passedRecommendation:
      "Keep credible proof attributed and place the strongest examples near the author or featured books.",
    maintenanceTip:
      "Add stronger recent proof as it becomes available and remove claims that can no longer be supported.",
    verificationTip:
      "Confirm that visible praise, reviews, awards, or ratings identify a credible source or supporting context.",
  },
  "usability.primary_navigation": {
    passedDetails:
      "The rendered homepage provided usable primary navigation across every required viewport.",
    passedRecommendation:
      "Preserve clear, working navigation paths to Books, About, newsletter signup, and contact information.",
    maintenanceTip:
      "Test desktop, tablet, and mobile menus after changing theme navigation or menu items.",
    verificationTip:
      "Open and use the primary menu at desktop, tablet, and mobile widths and confirm that important internal links are reachable.",
  },
  "usability.page_responses": {
    passedDetails:
      "The pages inspected for site usability returned successful responses.",
    passedRecommendation:
      "Keep reader-facing links pointed directly to available pages and repair broken destinations quickly.",
    maintenanceTip:
      "Check links after deleting pages, changing slugs, or reorganizing the website.",
    verificationTip:
      "Open the scanned reader paths and confirm that they load successfully without errors or avoidable redirect chains.",
  },
  "usability.privacy_policy": {
    passedDetails:
      "The scan found a privacy-policy path available to website visitors.",
    passedRecommendation:
      "Keep the Privacy link consistently available, especially near forms and in the site footer.",
    maintenanceTip:
      "Check the footer and form disclosures after theme or form-builder changes.",
    verificationTip:
      "Use the public footer and relevant forms to confirm that visitors can reach the privacy policy.",
  },
  "usability.canonical_or_schema": {
    passedDetails:
      "The scan found canonical or structured identity markup that supports consistent site interpretation.",
    passedRecommendation:
      "Keep identity and canonical markup aligned with the current author brand and preferred public URL.",
    maintenanceTip:
      "Validate the markup after domain, SEO-plugin, or template changes.",
    verificationTip:
      "Inspect the homepage markup and confirm that its canonical URL or author identity data is valid and current.",
  },
  "usability.freshness": {
    passedDetails:
      "The scan found a current-enough freshness signal in the inspected website content.",
    passedRecommendation:
      "Keep visible dates, book availability, event details, biography information, and links current.",
    maintenanceTip:
      "Schedule a recurring content review instead of relying only on an automatically updated copyright year.",
    verificationTip:
      "Review the footer and dated content and confirm that the site does not present obviously stale information.",
  },
} as const satisfies Record<ScoringCheckId, CheckStatusGuidanceSeed>;

function evidenceCollectionTip(source: ScoringCheckDefinition["source"]) {
  if (source === "pagespeed") {
    return "Make sure PageSpeed can access the public homepage without authentication, bot challenges, or a blocking consent screen.";
  }

  if (source === "rendered") {
    return "Make sure the public homepage can be rendered without authentication, bot challenges, or an overlay that permanently hides the page.";
  }

  if (source === "crawl") {
    return "Make sure the relevant public pages are linked, return successful HTML responses, and can be reached by the scanner.";
  }

  return "Make sure the relevant content is public, readable as page text or markup, and available without requiring visitor interaction.";
}

function unknownDetails(reasonCode: string) {
  if (reasonCode === "required_viewport_evidence_missing") {
    return "The scan could not capture every required screen size, so this check could not be confirmed reliably.";
  }

  if (reasonCode === "evidence_coverage_insufficient") {
    return "The page loaded, but the scan did not collect enough reliable evidence to confirm this check.";
  }

  if (reasonCode === "stored_result_missing") {
    return "This check was not recorded in the saved scan, so its status cannot be confirmed from this report.";
  }

  return "The scan did not collect enough reliable evidence to confirm whether this check passed or needs attention.";
}

export function getPassedCheckGuidance(
  check: ScoringCheckDefinition,
): CheckStatusGuidance {
  const guidance = CHECK_STATUS_GUIDANCE[check.id];

  return {
    details: guidance.passedDetails,
    recommendation: guidance.passedRecommendation,
    practicalActions: [
      guidance.maintenanceTip,
      "Review this check after major website, theme, content, or integration changes.",
      "Run a fresh analyzer scan after significant updates to confirm that the check still passes.",
    ],
  };
}

export function getUnknownCheckGuidance(
  check: ScoringCheckDefinition,
  reasonCode: string,
): CheckStatusGuidance {
  const guidance = CHECK_STATUS_GUIDANCE[check.id];

  return {
    details: `${unknownDetails(reasonCode)} ${guidance.verificationTip}`,
    recommendation: `Verify this item manually before deciding whether a website change is needed. ${guidance.verificationTip}`,
    practicalActions: [
      guidance.verificationTip,
      evidenceCollectionTip(check.source),
      "Run a fresh analyzer scan after improving access or evidence coverage and compare the new result.",
    ],
  };
}
