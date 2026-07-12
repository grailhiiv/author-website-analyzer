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
One deterministic pass, fail, or unknown rule within a scoring module. A failed check creates one finding.
_Avoid_: AI judgment, recommendation

**Finding**:
The saved issue created when a deterministic scoring check fails, including its evidence, priority, primary recommendation, and practical actions.
_Avoid_: Score, AI critique

**Primary Recommendation**:
The fixed, rule-based direction attached to a failed scoring check. It states what should be improved.
_Avoid_: AI suggestion, practical action

**Practical Action**:
One fixed, concrete implementation step attached to a primary recommendation. A finding can contain several practical actions.
_Avoid_: Scoring check, primary recommendation
