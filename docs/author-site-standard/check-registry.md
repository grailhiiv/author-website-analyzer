# Deterministic check registry contract

Status: **implemented for all current deterministic scoring checks**. Typed application code in `src/lib/scoring/check-registry.ts` is the executable authority.

The registry is the reviewable interface between deterministic evidence, the scoring engine, recommendations, persisted outcomes, and regression fixtures. All 50 current scoring checks use stable IDs and typed metadata without changing their scores.

## Required fields

```ts
type ScoringCheckDefinition = {
  id: string
  version: number
  title: string
  category: string
  points: number
  source: string
  applicablePageRoles: string[]
  applicabilityRuleId: string
  notApplicableRuleId: string
  evidencePolicyId: string
  passRuleId: string
  unknownRuleId: string
  deduplicationGroupId: string
  standardReferences: string[]
}

type RenderedScoringCheckDefinition = ScoringCheckDefinition & {
  source: "rendered"
  requiredObservationId: string
  requiredViewports: string[]
  viewportPolicyId: string
  findingTitle: string
  finding: string
  recommendation: string
  severity: string
  priority: number
}
```

## Stable ID convention

Use lowercase dot-separated IDs that describe the reader outcome, not an implementation selector. Examples:

- `brand.author_identity`
- `brand.writing_context`
- `books.index_discoverable`
- `books.detail_synopsis`
- `books.purchase_path`
- `engagement.newsletter_signup`
- `trust.contact_route`
- `search.unique_page_title`
- `technical.indexability`
- `usability.primary_navigation`

Do not encode points or DOM selectors in the ID. Points and detector implementations can change without renaming the underlying check.

## Registry behavior

Each entry must specify:

- what makes the check applicable without asking the author for goals/type;
- accepted evidence and accepted alternatives;
- evidence that is too weak or misleading;
- when the result is unknown rather than failed;
- the fixed primary recommendation and practical actions;
- page-standard sections that justify the check; and
- test fixtures for pass, fail, unknown, conflicting, and not-applicable cases.

## Implemented allocation

| Category | Registered checks | Raw points |
| --- | ---: | ---: |
| Brand Clarity | 5 | 15 |
| Book Visibility | 7 | 20 |
| Reader Engagement | 4 | 15 |
| Search Visibility | 7 | 18 |
| Mobile Performance | 7 | 10 |
| Technical Health | 8 | 10 |
| Author Trust | 7 | 10 |
| Site Usability | 5 | 5 |
| **Total** | **50** | **103** |

Search Visibility's 18 raw points continue to normalize to its unchanged 15-point category maximum.

## Scored rendered checks

| Stable ID | Category | Raw points | Confirmed failure | Unknown |
| --- | --- | ---: | --- | --- |
| `usability.primary_navigation` | Site Usability | 1 | Any required viewport has no usable navigation; tablet/mobile menu controls are activated and must reveal internal links | A required viewport was not collected |
| `mobile.viewport_fit` | Mobile Performance | 1 | Mobile has document overflow and an identified unclipped overflow source | Mobile evidence was not collected |
| `mobile.text_contrast` | Mobile Performance | 1 | Sufficiently covered mobile text measurement contains a baseline contrast failure | Fewer than three samples or less than 80% measurement coverage, or mobile evidence was not collected |

All three rendered checks are universal for an eligible author homepage and never become `not_applicable`. Confirmed failure wins over missing evidence in another required viewport. Unknown awards half credit under the current scoring formula and creates no site-problem finding.

They replace existing proxy points, so Mobile Performance remains 10 points, Site Usability remains 5 points, and the eight categories still total 100. Other design observations remain advisory.

## Persistence and calibration

Every registered outcome is saved in `ReportCheckResult` with registry and check versions, state, available and earned points, reason code, and bounded evidence references. Findings store the stable check ID and an origin. Rescoring replaces only deterministic score findings and preserves operational diagnostics.

The anonymized calibration fixture covers a working collapsed menu, a dead menu control, an intentionally clipped carousel, genuine page overflow, and insufficient contrast coverage. Registry tests require all 50 IDs and deduplication groups to be unique, preserve the established raw-point allocation, and require every fixed recommendation to resolve to practical actions.

## Conditional checks requiring a decision

Reader-magnet and media-kit checks should be the first applicability review. Documenting them as conditional does not change their current score. The approved resolution must choose one deterministic behavior: universal, conditionally applicable from observable evidence, advisory-only, or excluded from scoring.
