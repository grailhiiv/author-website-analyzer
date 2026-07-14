# Page-by-page author website standards

Use these profiles to guide crawling, detection, future scoring proposals, QA fixtures, and author-friendly explanations. A page may serve more than one purpose; classify its primary role from combined evidence and retain its secondary evidence.

## Homepage

**Reader questions:** Whose site is this? What do they write? What should I explore or do next?

- **Core:** a visible author identity; a clear statement or strong contextual evidence of the author's work; a path to books; understandable primary navigation; and a meaningful next action.
- **Supporting:** a featured or recent book, newsletter invitation, concise credibility evidence, and a short introduction that links to About.
- **Conditional:** event promotion, retailer badges, reader magnet, reviews, awards, or a direct store.
- **Observable evidence:** `Person` or `ProfilePage` structured data; site name; title; H1; hero copy; author photo; headings; navigation labels; book cover/title pairs; calls to action; book, about, contact, and signup links.
- **Do not count:** a logo without an accessible or nearby author name; generic copy such as “Welcome”; a decorative book image with no title or book context; or a newsletter word with no usable signup route.
- **Relevant categories:** Brand Clarity, Book Visibility, Reader Engagement, Author Trust, Site Usability.

## About

**Reader questions:** Who is the author, what do they write, and why should I trust or follow them?

- **Core:** a clearly attributed author name and a substantive biography connected to the author's work.
- **Supporting:** an author photo with meaningful alternative text, credentials or relevant personal context, notable publications or recognition, and links to books or contact.
- **Conditional:** short and long bios, representation details, speaking topics, awards, memberships, or downloadable materials.
- **Observable evidence:** About/Bio navigation context; `Person` or `ProfilePage` data; first-person or third-person biographical copy; author-name headings; portrait image context; credentials; book references.
- **Do not count:** a team/company About page with no identified author; a single sentence that repeats the homepage tagline; an unlabeled stock portrait; or unrelated testimonials as author credentials.
- **Relevant categories:** Brand Clarity, Author Trust, Search Visibility.

## Books index or bibliography

**Reader questions:** What has this author written, and which book should I explore?

- **Core:** recognizable book titles; clear links or controls that lead to individual book information or purchase paths; and enough organization to distinguish works.
- **Supporting:** cover images with useful text alternatives, series grouping, format or availability information, concise hooks, and consistent card/link behavior.
- **Conditional:** filters, forthcoming titles, editions, translations, awards, or direct sales.
- **Observable evidence:** Books/Novels/Works/Bibliography navigation context; repeated Book entities; title-cover-link groups; retailer or book-detail links; series labels; headings for published and forthcoming work.
- **Do not count:** a generic image gallery; a list of article titles; bookstore affiliate links unrelated to the author; or filenames alone without visible book context.
- **Relevant categories:** Book Visibility, Site Usability, Search Visibility.

## Book detail

**Reader questions:** What is this book, is it for me, and how can I get it?

- **Core:** book title; cover or clearly identified book artwork; meaningful synopsis or description; and at least one valid discovery, purchase, borrow, preorder, or retailer path.
- **Supporting:** author name; genre/category; publication or format information; series name and order; multiple retailer choices; readable calls to action; related books; and shareable metadata.
- **Conditional:** reviews, endorsements, awards, excerpts, content notes, book-club resources, ISBN, accessibility formats, or direct-sale fulfillment details.
- **Observable evidence:** `Book` structured data; H1/title; cover image context; synopsis-length prose; ISBN; series/order language; retailer domains; purchase verbs; Open Graph metadata; breadcrumb or Books-parent link.
- **Do not count:** a retailer logo with no destination; a title mentioned only in a sitewide footer; an image inferred as a cover only because it is portrait-shaped; or an excerpt without identifying the book.
- **Relevant categories:** Book Visibility, Brand Clarity, Search Visibility, Site Usability.

## Series

**Reader questions:** Which books belong to the series, and in what order should I read them?

- **Core:** series identity and an understandable list of member books.
- **Supporting:** explicit reading or publication order; links to each book; cover/title pairs; status such as complete or ongoing; and consistent numbering.
- **Conditional:** prequels, companion works, box sets, crossover guidance, or alternate recommended orders.
- **Observable evidence:** Series/Reading Order navigation context; numbered book groups; phrases such as “Book 1”; `isPartOf` or `position` structured data; linked Book entities.
- **Do not count:** unrelated numbered lists, navigation order, review rankings, or a single book merely containing the word “series.”
- **Relevant categories:** Book Visibility, Site Usability.

## Newsletter or signup

**Reader questions:** What will I receive, how often or in what form, and can I subscribe safely?

- **Core:** a clear signup purpose and a usable email-submission route, either on-site or through an identifiable hosted provider.
- **Supporting:** an explicit value promise; accessible label and instructions; understandable consent/privacy context; usable validation, error, and success states; and a link to relevant privacy information.
- **Conditional:** frequency, welcome sequence, preference choices, double opt-in explanation, or a reader magnet whose delivery terms are clear.
- **Observable evidence:** an email input within a form; accessible name; submit control; newsletter/subscribe copy; embedded-provider markup; or a hosted signup link to a recognized service.
- **Do not count:** a plain email address; a social-follow link; an email input used only for account login or checkout; or “subscribe” that refers to a paid product with no author-news context.
- **Relevant categories:** Reader Engagement, Author Trust, Site Usability.

## Contact

**Reader questions:** How do I contact the author or the appropriate representative?

- **Core:** at least one legitimate contact route and enough context to know what it is for.
- **Supporting:** accessible form labels; clear required fields; usable success/error feedback; spam protection that does not block assistive technology; privacy context; and alternatives for rights, publicity, events, or representation.
- **Conditional:** agent/publicist details, response expectations, topic routing, postal address, or social contact.
- **Observable evidence:** Contact navigation context; `mailto:` link; visible email; labeled contact form; representation terms; external form with a clear destination.
- **Do not count:** an email found only in source comments; a nonfunctional button; a newsletter form; or social icons alone unless the page explicitly presents them as the contact method.
- **Relevant categories:** Author Trust, Reader Engagement, Site Usability.

## Events

**Reader questions:** What is happening, when and where is it, and how can I attend?

- **Core for a listed event:** event name, date, location or online status, and a details/registration route when required.
- **Supporting:** local time and timezone where ambiguity is possible, accessibility/venue details, host, price, status changes, and separation of upcoming from past events.
- **Conditional:** `Event` structured data, calendar download, map, replay, or signing policies.
- **Observable evidence:** Events/Appearances navigation context; date/time elements; venue/address or online-event phrases; ticket/RSVP links; `Event` schema.
- **Do not count:** publication dates, blog archives, copyright years, or an old event presented as upcoming.
- **Relevant categories:** Reader Engagement, Author Trust, Search Visibility, Site Usability.

## Media or press kit

**Reader questions:** Can I quickly get approved facts, assets, and the correct media contact?

- **Conditional:** this page is valuable when the author actively supports interviews, speaking, events, rights, or press. Its absence is not universally a quality failure.
- **Core when present:** clearly attributed author information, a contact route, and accurate reusable material.
- **Supporting:** short and long bios; high-resolution approved photos with credit guidance; book covers and descriptions; recent releases; interview topics; previous coverage; and downloadable assets with formats/sizes.
- **Observable evidence:** Media/Press/Press Kit navigation context; download links; image resolution or file metadata; bio sections; publicity/contact language; book facts.
- **Do not count:** a page containing only press quotes, a generic Downloads page, low-resolution thumbnails presented as press assets, or unrelated company media resources.
- **Relevant categories:** Author Trust, Brand Clarity, Book Visibility.

## Blog or news index

**Reader questions:** What has the author published recently, and where can I read it?

- **Conditional:** a blog is not required for every author website.
- **Core when present:** identifiable post titles that lead to readable posts; a usable distinction between posts; and truthful date/status presentation when shown.
- **Supporting:** excerpts, topics/categories, pagination, search, consistent imagery, and an RSS or follow route.
- **Observable evidence:** Blog/News navigation context; repeated article links; dates; excerpts; `Blog` or `CollectionPage` data; pagination.
- **Do not count:** a book list, press-clipping list, or event archive solely because it uses date cards.
- **Relevant categories:** Reader Engagement, Search Visibility, Site Usability.

## Article or post

**Reader questions:** What is this content, who published it, and what should I read next?

- **Core when present:** descriptive title; main content; stable URL; and an understandable link back to the site or related content.
- **Supporting:** author attribution, truthful publication/updated dates, descriptive metadata, semantic headings, useful image text alternatives, related internal links, and `Article`/`BlogPosting` data.
- **Conditional:** comments, share controls, citations, video/audio alternatives, or newsletter invitation.
- **Observable evidence:** article element or structured data; H1/title; byline; `datePublished`/`dateModified`; substantial main text; category and related links.
- **Do not count:** navigation labels as headings, a date without article context, scraped third-party text, or boilerplate as main content.
- **Relevant categories:** Search Visibility, Reader Engagement, Author Trust, Site Usability.

## Privacy or legal

**Reader questions:** What happens to information I submit or that the site collects?

- **Conditional:** the exact legal obligation depends on data practices and jurisdiction; this standard is not legal advice.
- **Core when the site collects personal data:** discoverable, relevant privacy information that identifies the site/operator and explains applicable collection and contact practices.
- **Supporting:** effective/update date; newsletter and form practices; analytics/cookie information; processors; rights/contact route; and placement near relevant data collection.
- **Observable evidence:** Privacy/Data Policy navigation or footer link; policy headings and substantive text; links near forms; controller/operator contact.
- **Do not count:** a dead link, placeholder policy, unrelated platform policy, or a Terms page that says nothing about collected personal data.
- **Relevant categories:** Author Trust, Technical Health, Site Usability.

## Store

**Reader questions:** What am I buying, what will it cost, and what happens after purchase?

- **Conditional:** applicable only where products are sold directly or through an embedded commerce flow.
- **Core when present:** identifiable product, price/currency where applicable, clear purchase control, and transparent fulfillment or destination.
- **Supporting:** format/edition, shipping and returns, secure checkout handoff, stock/preorder status, taxes, contact, and accessible cart/checkout controls.
- **Observable evidence:** Product/Offer structured data; price; add-to-cart or buy control; checkout links; format and fulfillment text.
- **Do not count:** retailer-affiliate links as an on-site store, decorative price text, or a button whose destination cannot be inspected.
- **Relevant categories:** Book Visibility, Author Trust, Technical Health, Site Usability.

## Utility or other pages

Login, search results, archives, tag pages, cart, checkout, error pages, and policy subpages should not be forced into a core content role. Preserve their evidence, but do not let them satisfy unrelated author, book, newsletter, or contact checks merely because they share sitewide navigation and footer text.
