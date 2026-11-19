---
title: "Service transition with a readiness gate"
attribution: "Led"
role_line: "Led the process maturity, with teams owning technical validation against a readiness checklist"
lenses: [operating-model]
capabilities: [service-transition, service-design, service-delivery]
roles: ["2022-05-head-of-technical-delivery"]
sector: "Managed services and banking"
status: "Complete"
lesson: "A checklist only works if it asks for evidence, not assurance."
weight: 2
highlight: true
publish: true
---

Projects often arrived in live support with missing documentation, untested failover or open defects that became the support team's problem on day one. I helped define and mature the service transition process so handover became a structured quality gate rather than a single meeting.

The process started before the bid was signed, with operations joining go/no-go reviews to check scope and supportability. Once a project kicked off, teams reviewed the design, attended a service overview handover and ran technical validation against a readiness checklist tracked through tickets. Defects went back to the project team before closure, and the service then ran under an Early Life Support OLA through testing and customer acceptance before moving into full live support. The templates I co-wrote for this were later adopted across other areas including patching and event management.

For a banking client, the readiness checklist flagged that there was no documented disaster recovery test outcome because the test had slipped behind other priorities. The project agreed to hold closure and run the test. It exposed a design flaw that would have split Active Directory on failover, which was resolved by adding a standby domain controller in DR before the service went live.

In another transition, we took over a customer's services from an incumbent supplier against a hard exit deadline that fell during the Christmas change freeze, with scope not fully defined during the sale. Running the readiness checks early surfaced onboarding gaps in time to agree a hypercare arrangement with named support engineers, protecting the customer through the handover.
