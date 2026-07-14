# Deterministic check registry contract

Status: **proposed structure**. The current scoring engine remains the executable authority until checks are migrated to stable IDs.

The registry should become the reviewable interface between the page standard, detector output, scoring engine, recommendations, and tests. It should live in typed application code or validated data, with this document generated from or checked against that source.

## Required fields

```ts
type ScoringCheckDefinition = {
  id: string
  version: number
  title: string
  category: string
  points: number
  requirementLevel: 'core' | 'supporting' | 'conditional'
  applicablePageRoles: string[]
  applicabilityRuleId: string
  requiredSignalIds: string[]
  passRuleId: string
  unknownRuleId: string
  recommendationId: string
  severity: string
  priority: number
  standardReferences: string[]
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

## Current migration gap

The current engine defines rules inline and does not expose stable check IDs. Before changing weights or adding many detectors:

1. assign IDs without changing current score behavior;
2. snapshot existing category totals and report outputs;
3. map each ID to signals, recommendations, and fixtures;
4. add coverage tests ensuring every scored check has a registered recommendation and evidence policy; and
5. only then review applicability and weight changes as separate product decisions.

## Conditional checks requiring a decision

Reader-magnet and media-kit checks should be the first applicability review. Documenting them as conditional does not change their current score. The approved resolution must choose one deterministic behavior: universal, conditionally applicable from observable evidence, advisory-only, or excluded from scoring.
