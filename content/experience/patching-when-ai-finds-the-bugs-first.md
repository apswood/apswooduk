---
title: "Patching when AI finds the bugs first"
kind: "thought"
summary: "Bug discovery has been industrialised. A monthly patch cycle behind a slow approval queue was built for a slower world."
lenses: [hands-on, operating-model]
capabilities: [security, automation, service-delivery]
highlight: true
weight: 10
publish: true
---

Patching is about to get a lot harder, and most operational teams are still set up for a slower world.

Earlier this year, Anthropic launched Project Glasswing, giving major technology partners early access to Claude Mythos. Within weeks it had uncovered more than 10,000 high or critical severity vulnerabilities. Mozilla’s Firefox 150 release alone fixed 271 flaws found by Mythos in a single audit cycle, compared with 22 found by the previous model. And it isn't just Anthropic. With Google applying Gemini to autonomous vulnerability research, OpenAI scaling its reasoning models for deep code auditing, and Microsoft embedding AI directly into its internal security workflows, bug discovery has been industrialised.

That volume is now landing directly on enterprise infrastructure teams. Microsoft’s October Patch Tuesday fixed 1,413 vulnerabilities, including an actively exploited zero-day, which is more in a single month than its previous record for an entire year. Microsoft has already said its growing use of AI to find flaws in legacy code means monthly update volumes will keep climbing. In the same month, Citrix, Fortinet and Ivanti were all shipping urgent fixes for perimeter flaws that attackers were already exploiting in the wild.

Meanwhile, the 2026 Verizon DBIR puts the median remediation time for known exploited vulnerabilities at 43 days, with only 26% of organisations fully patching them.

A monthly patching cycle sitting behind a slow approval queue was designed for a world where finding and weaponising bugs was manual and expensive. That world has gone. When vendors drop 1,400 fixes on a Tuesday, threat actors are using the exact same frontier models to reverse-engineer those patches and build exploits by Wednesday.

For IT managers, patching has to be treated as core operational architecture rather than routine housekeeping. Know what assets you actually own. Automate ring-based testing and deployment so a major release takes days instead of weeks. Put VPNs, firewalls and remote access gateways at the front of the queue, because that's where attackers go first. If a legacy system can't be patched straight away, network segmentation has to contain it.

For MSPs, waiting for the customer to raise a ticket or approve a routine change window is no longer viable. Proactive and advisory delivery has to be the default. That means telling customers what's coming before they ask, and making the case for modernising fragile estates while it's still a choice rather than an incident.
