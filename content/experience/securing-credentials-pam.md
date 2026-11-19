---
title: "Securing credentials: password vault to privileged access"
attribution: "Led"
role_line: "Led a CISO-sponsored password security programme and followed it through to a FortiPAM privileged access rollout"
lenses: [hands-on, operating-model]
capabilities: [security, engineering, service-governance]
roles: ["2022-05-head-of-technical-delivery"]
sector: "Managed services"
status: "Complete"
lesson: "Cleaning up legacy credentials is only half the job; the platform has to stop the old habits coming back."
weight: 3
highlight: true
publish: true
---

Years of acquisitions and team changes had left operational credentials spread across legacy stores and internal wikis, with inconsistent standards and limited oversight. Under executive sponsorship from the CISO, I led Project Ice Age to audit every credential for strength, reuse and staleness, migrate them into one central vault and work with the internal systems team to decommission the legacy stores so no passwords remained in wikis.

We tracked progress through a dashboard measured against a 90% strong or very strong password target. Two practical constraints shaped the work. First, an organisational restructure made it harder to identify the right owners for older credentials. Second, the strength checks flagged false positives where the vault held non-password entries such as notes or safe combinations, which we resolved by separating those records into their own categories.

The programme resolved the immediate hygiene gap and built a clear risk case for full privileged access management. I carried that follow-on work through to completion, rolling out FortiPAM to meet audit requirements with automated password management, a secure proxy, unified complexity rules, session recording and SAML single sign-on.
