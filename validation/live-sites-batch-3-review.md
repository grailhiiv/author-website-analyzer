# Live-site validation — batch 3 human review

Date: **2026-07-14**

Automated status: **3/3 sites crawled, 7/7 labeled regression expectations passed, 0 crawl failures**. Each crawl saved the bounded maximum of 10 HTML pages. Browser fallback was not needed.

## How to answer

Replace each `[ ]` with:

- `[Y]` when the analyzer's statement is correct;
- `[N]` when the analyzer is wrong; or
- `[?]` when the result is unclear or you did not check it.

Add a short note or the page URL after any `N` or `?`. A secondary role means the page contains meaningful evidence for that function even though it is not the page's main purpose. “Not detected” means the analyzer did not find it within the bounded 10-page crawl; it is not proof that it does not exist anywhere on the full site.

## Kristin Hannah — <https://kristinhannah.com/>

### Page roles detected

- [Y] `/` is primarily the **Home** page.
- [Y] `/about-kristin-bio/` is primarily an **About** page.
- [Y] `/books/` is primarily a **Books index**.
- [Y] `/books/fly-away/` and `/books/the-women/` are **Book detail** pages.
- [Y] `/contact/` is primarily a **Contact** page.
- [Y] `/newsletter/` is primarily a **Newsletter** page.
- [Y] `/privacy-policy/` is primarily a **Privacy** page.
- [Y] The two crawled news/excerpt posts are primarily **Article** pages.

### Features detected

- [Y] The homepage identifies Kristin Hannah and contains a clear positioning headline and genre cues.
- [Y] The site has an About page, author biography, and author photo.
- [Y] The crawl found book titles, covers, descriptions, buy links, retailer links, reviews, and series information.
- [Y] The crawl found a newsletter signup form.
- [Y] The crawl found both a contact email address and a contact form.
- [Y] The crawl found a privacy policy and social-profile links.
- [Y] **Not detected:** a media kit.
- [Y] **Not detected:** a homepage meta description.
- [Y] The analyzer found at least one image with missing alt text.

Notes: The reviewer confirmed the two article-role pages are news posts only.

## Michael Robotham — <https://www.michaelrobotham.com/>

### Page roles detected

- [Y] `/` is primarily the **Home** page and also contains meaningful **Newsletter** evidence.
- [Y] `/about/` is primarily an **About** page.
- [Y] `/books/` is primarily a **Books index**.
- [Y] `/book/bombproof/` and `/book/shatter/` are **Book detail** pages.
- [Y] `/contact/` is primarily a **Contact** page.
- [Y] `/events/` is primarily an **Events** page and also contains meaningful **Newsletter** evidence.
- [Y] `/newsletter/` is primarily a **Newsletter** page.
- [Y] `/privacy-policy/` is primarily a **Privacy** page and also contains meaningful **Contact** evidence.
- [Y] The crawled *Storm Child* post is primarily an **Article** page.

### Features detected

- [Y] The homepage identifies Michael Robotham and contains a clear positioning headline and genre cues.
- [Y] The site has an About page, author biography, and author photo.
- [Y] The crawl found book titles, covers, descriptions, buy links, retailer links, reviews, and series information.
- [Y] The crawl found a newsletter signup form.
- [Y] The crawl found both a contact email address and a contact form.
- [Y] The crawl found a privacy policy and social-profile links.
- [Y] The homepage has a title, H1, and meta description.
- [Y] **Not detected:** a media kit.
- [Y] The analyzer found at least one image with missing alt text.

Notes: The reviewer confirmed the article at <https://www.michaelrobotham.com/storm-child-the-newest-addition-to-the-cyrus-haven-and-evie-cormac-series/>.

## Dervla McTiernan — <https://dervlamctiernan.com/>

### Page roles detected

- [Y] `/` is primarily the **Home** page and also contains meaningful **Article** and **Newsletter** evidence.
- [Y] `/about/` is primarily an **About** page and also contains meaningful **Newsletter** and **Article** evidence.
- [Y] `/book/the-ruin/`, `/book/the-scholar/`, and `/book/the-sisters/` are **Book detail** pages.
- [Y] `/contact/` is primarily a **Contact** page.
- [Y] `/events/` is primarily an **Events** page and also contains meaningful **Article** evidence.
- [Y] `/newsletter/` is primarily a **Newsletter** page and also contains meaningful **Article** evidence.
- [Y] `/subscribe/` is primarily a **Newsletter** page.
- [Y] `/privacy-policy/` is primarily a **Privacy** page and also contains meaningful **Article** and **Contact** evidence.

### Features detected

- [Y] The homepage identifies Dervla McTiernan and contains a clear positioning headline and genre cues.
- [Y] The site has an About page, author biography, and author photo.
- [Y] The crawl found book titles, covers, descriptions, buy links, reviews, and series information.
- [Y] The crawl found buy links, but **did not identify named retailer links**.
- [Y] The crawl found a newsletter signup form.
- [Y] The crawl found both a contact email address and a contact form.
- [Y] The crawl found a privacy policy, social-profile links, and a media kit.
- [Y] The homepage has a title, H1, and meta description.
- [Y] The analyzer did not find missing image alt text in the crawled pages.
- [Y] The analyzer found at least one page with multiple H1 headings.

Notes:

## Manual design review — unscored

Completed by Codex using live browser inspection at desktop, 768 px tablet, and 390 px mobile widths. `Y` means the site meets the standard overall; it does not mean there are no improvement opportunities. These 20 pillars support recommendations only and do not alter the analyzer score.

### Site Structure

| # | Manual check | Kristin | Michael | Dervla |
|---:|---|:---:|:---:|:---:|
| 5 | Reader journey and navigation are clear. | Y | Y | N |
| 13 | The homepage prioritizes the most important reader tasks. | Y | Y | N |
| 18 | Layout structure and spacing make pages easy to scan. | Y | Y | Y |
| 4 | Books and series are organized clearly. | Y | Y | Y |
| 8 | Content appears current and maintained. | Y | N | Y |

Record the click count from the homepage:

| Task | Kristin | Michael | Dervla |
|---|:---:|:---:|:---:|
| Reach a book purchase destination | 1 | 1 | 2 |
| Reach or submit the newsletter form | 0 | 0 | 0 |
| Reach the contact method or form | 1 | 1 | 2 |

### Visual Design

| # | Manual check | Kristin | Michael | Dervla |
|---:|---|:---:|:---:|:---:|
| 1 | The visual direction aligns with the author's genre. | Y | Y | Y |
| 2 | The first impression clearly communicates who the author is and what they write. | Y | Y | Y |
| 3 | The site feels professional and intentional. | Y | Y | Y |
| 7 | Visual and content choices build trust and credibility. | Y | Y | Y |
| 9 | Desktop, tablet, and mobile layouts work well. | Y | Y | Y |
| 10 | Text is readable and color contrast appears accessible. | Y | Y | Y |
| 11 | Components, styles, and behavior are consistent across pages. | Y | Y | Y |
| 12 | The site's emotional tone supports the books and author brand. | Y | Y | Y |
| 15 | Book covers are prominent and integrated well. | Y | Y | Y |
| 16 | Typography is readable and creates a clear hierarchy. | Y | Y | Y |
| 17 | Color choices are coherent, readable, and brand-appropriate. | Y | Y | Y |
| 19 | Images are high quality, appropriately cropped, and not distracting. | Y | Y | Y |
| 20 | The presentation fits the author's intended readers. | Y | Y | Y |

### Conversion Design

| # | Manual check | Kristin | Michael | Dervla |
|---:|---|:---:|:---:|:---:|
| 6 | The design guides visitors toward useful reader actions. | Y | Y | N |
| 14 | Buy, newsletter, sample, and contact calls to action are clear and prominent. | Y | Y | N |

Additional supporting check: Are forms easy to understand, reasonably short, and limited to necessary information?

| Site | Y / N / ? | Note |
|---|:---:|---|
| Kristin Hannah | Y | Two labeled fields: name and email. |
| Michael Robotham | Y | One email field; the shortest signup of the three. |
| Dervla McTiernan | Y | Three fields: first name, country, and email. The country field adds friction but is still reasonable for regional publishing updates. |

### Design evidence and recommendations

The live responsive check found no horizontal overflow at either 390 px or 768 px on any of the three homepages. Visual judgments used the `design-taste-frontend` criteria for audience fit, hierarchy, typography, spacing, imagery, and brand direction. Interaction judgments used the [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md) for navigation, form clarity, headings, responsiveness, and accessibility-oriented behavior.

#### Kristin Hannah

- **What works:** The professional portrait, large author wordmark, bestselling-author statement, latest cover, and immediate order action create a premium editorial presentation. Books, newsletter, and contact are directly exposed in the primary navigation.
- **Main concerns:** The header has many peer-level links and the homepage is long, so secondary content competes with the primary book journey. The first-visit cookie panel also occupies substantial screen space.
- **Recommendation:** Preserve the current brand direction, but group secondary destinations such as photo gallery, tour dates, and book clubs. Keep the latest book and newsletter as the strongest actions. The analyzer-confirmed missing homepage meta description, media kit, and image alt text should remain separate technical/content recommendations.

#### Michael Robotham

- **What works:** The bold yellow-on-charcoal system, condensed display type, and “International Crime Writer” positioning immediately establish the crime brand. The latest book is prominent, an order action is available, and the newsletter asks only for an email address.
- **Main concerns:** The Books menu contains a very long list of individual titles. On the homepage, the current *Tell Me Something True* promotion competes with a separate message calling *Storm Child* the latest book, so the content hierarchy appears inconsistent or stale. Condensed uppercase type is effective for headings but becomes harder to scan when overused.
- **Recommendation:** Group the Books menu by series or route readers to a well-structured books index, remove or relabel the conflicting *Storm Child* promotion, and reserve condensed uppercase type for short headings and actions.

#### Dervla McTiernan

- **What works:** The clean editorial layout, strong book-cover treatment, restrained palette, and contemporary typography fit a modern crime/thriller audience. The 390 px layout is especially clean and the books are organized into series, standalone thrillers, and audio novellas.
- **Main concerns:** A hamburger-only navigation is used even on desktop, making Books, Newsletter, and Contact two-click destinations. The first prominent label, “Out April 2026,” communicates timing rather than an action, while “Learn More” is generic. The homepage also contains two H1 headings.
- **Recommendation:** Expose Books and Newsletter in the desktop header, use a specific latest-book action such as “Pre-order *Three Reasons for Revenge*” or “Explore the book,” make the purchase path visible from the first section, and retain one H1 for a clearer document hierarchy.
