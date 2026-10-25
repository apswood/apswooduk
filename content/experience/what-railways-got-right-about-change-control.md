---
title: "What railways got right about change control"
kind: "thought"
summary: "A checkbox in a change ticket only proves that someone intended to be careful. An interlock is what stops the outage."
lenses: [hands-on, operating-model]
capabilities: [engineering, automation, service-governance]
weight: 15
publish: true
---

Victorian railway signalling had a remarkably good answer to human error. Following a series of catastrophic collisions in the 19th century, most notably the Armagh rail disaster in 1889 which finally forced Parliament to mandate safety systems across Britain, the railways rolled out mechanical interlocking. Once interlocked, a signaller physically couldn't pull the levers to set two conflicting routes at the same time. The cast-iron frame in the signal box simply locked the wrong lever in place.

A lot of enterprise IT change control still works as if it's pre-1889. We rely on a rulebook and a checkbox in an ITSM tool where an engineer promises they have checked for dependencies, tested the rollback plan and read the runbook. And that works right up until someone is tired at 11pm, rushed during an outage, or convinced they've run the same script a hundred times before.

The railways learned the hard way that relying on human memory under pressure is a design flaw. The wrong action should be mechanically impossible rather than something a professional has to remember not to do. In modern infrastructure, that means deployment pipelines that refuse to merge without passing automated tests, policy-as-code guardrails that block misconfigured storage from going live, and privileged access that automatically expires the minute the change window closes.

A checkbox in a change ticket only proves that someone intended to be careful. An interlock is what stops the outage.
