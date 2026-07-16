# Author Website Analyzer

This context defines the shared product language for scanning author websites and controlling access to their results.

## Language

**Scan**:
One attempt to inspect an author website and collect evidence about its observable content and behavior.
_Avoid_: Audit, analysis run

**Report**:
The scored result produced by a successful scan of an author website.
_Avoid_: Scan, audit

**Report Access Grant**:
Independent permission issued for one email-address and report pair to view that report's locked content.
_Avoid_: Account, subscription, global unlock

**Scoring Check**:
One deterministic rule within a scoring module that resolves to Passed, Needs Review, or Failed. A Failed check creates one finding.
_Avoid_: AI judgment, recommendation

**Finding**:
The saved issue created when a deterministic scoring check fails, including its evidence, priority, and recommendation.
_Avoid_: Score, AI critique

**Primary Recommendation**:
The fixed, rule-based direction attached to a failed scoring check. It states what should be improved.
_Avoid_: AI suggestion, separate action field

**Page Role**:
The primary reader purpose served by a scanned page, inferred from several observable signals such as navigation context, headings, structured data, links, and URL path. A page can support secondary purposes, but one primary role guides evaluation.
_Avoid_: Page type inferred from the URL alone

**Evidence Observation**:
A source-attributed fact collected from a page or response and used to evaluate one or more scoring checks. It records what was observed and where, without deciding the score by itself.
_Avoid_: Finding, AI opinion

**Page Standard**:
The documented observable qualities expected for a page role. A page standard is a calibration reference and does not become a scoring check until the deterministic scoring contract and tests explicitly adopt it.
_Avoid_: Automatic scoring rule
