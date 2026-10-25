---
title: "When the plumbing makes the Ten O'Clock News"
kind: "thought"
summary: "After every major outage the instinct is to buy more redundancy. For most mid-market businesses, the commercial case has to be made before the technical one."
lenses: [operating-model]
capabilities: [cloud, strategy, commercial]
weight: 14
publish: true
---

When a piece of internet plumbing makes the BBC news, you know operational teams are having a long week. We saw it with CrowdStrike, where a single faulty update grounded airlines and froze hospital systems. We've just seen it again with critical vulnerabilities in PHP, a foundational scripting language quietly underpinning roughly 70% of the web, forcing websites and services worldwide to take themselves offline while they patch.

The original vision of the internet was a decentralised network designed to route around damage. Instead, we've spent twenty years consolidating everything onto a handful of hyperscalers, content delivery networks, security agents and open-source libraries. The efficiency gains are obvious, right up until a single point of failure takes a huge slice of the economy offline at the same time.

Moments like this make a strong case for local infrastructure and sovereign cloud: keeping workloads closer to home on platforms where you actually understand the supply chain and control the blast radius.

Even then, the response has to be commercially rational. After every major outage, the instinct in IT is to design active-active multi-cloud architectures and multiple layers of disaster recovery. For a clearing bank or a hospital trust, that investment is justified. For most mid-market businesses, doubling your infrastructure run cost to insure against a rare upstream outage doesn't stack up. The commercial case has to be made calmly before the technical case automatically wins out.

And if a flaw in the basic plumbing of the web takes half the internet down for an afternoon, most businesses don't need an expensive multi-cloud failover just to keep sending emails into the void. Sometimes the most sensible disaster recovery plan is to close the laptop, go outside and take a break.
