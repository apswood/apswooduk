---
title: "Pantheon: an open-source AI governance kit"
attribution: "Led"
role_line: "My own open-source project, published under the MIT licence"
lenses: [hands-on, operating-model]
capabilities: [ai-with-oversight, automation, service-governance]
sector: "Personal project"
status: "In active development"
lesson: "AI is most useful in operations when it advises clearly and leaves the decision with a person."
weight: 3
highlight: true
publish: true
---

Pantheon is a starter kit for building AI agents and skills for service governance, operational excellence and infrastructure hardening, aimed at IT operations teams and managed service providers. The code is public on [GitHub](https://github.com/apswood/pantheon-ai-kit).

It brings together patterns I have found useful in running live services. Five specialist agents cover infrastructure hardening audits across common firewall and server platforms, architecture review, service governance and coaching, secret scanning, and design interviews that push towards simpler solutions. Six skills cover everyday governance work such as ticket backlog reviews, workload governance, quality audits and stand-up digests. They draw on ITIL, NIST, NCSC and Cyber Essentials Plus guidance, and on the operational resilience outcomes expected in UK financial services.

The agents are advisory by design. They report and suggest, and people decide. Secrets stay out of the repository through environment configuration and a validator that scans for leaks, and organisation-specific identifiers are replaced with placeholders. Skills load their detailed standards only when they are needed. The coaching approach is deliberately non-accusatory, in the same spirit as the gentle accountability I aim for with my own teams.

It is early, and I am developing it to be re-usable and to test out the same ideas that underpin the project with AI supported scripting.
