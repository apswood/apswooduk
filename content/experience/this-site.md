---
title: "This site: a CV that checks its own claims"
attribution: "Led"
role_line: "A personal project built out of curiosity, designed and maintained by me with AI-assisted coding"
lenses: [hands-on]
capabilities: [automation, ai-with-oversight, engineering]
sector: "Personal project"
status: "Live"
lesson: "The useful part of AI-assisted building is the guardrails you write around it, not the speed."
weight: 4
publish: true
---

This is a personal project, built out of curiosity to see whether a CV could be easier to explore than a PDF and still be honest about what I did. It is a static Hugo site served by Cloudflare. It uses no third-party scripts and no cookies, and it works without JavaScript. The career line, role cards and themes are enhancements layered on top of plain links and lists.

The part I care about most is how simple it is underneath. All of the content lives in a few YAML data files and Markdown pages. Hugo templates turn that single source into the web pages, the experience cards and the printable CV, so changing a claim updates all three at once. The styling is plain CSS and the interactions are a handful of small JavaScript files, with no framework and no Node build step. The fonts are hosted on the site itself. Every push is built and checked automatically, and Cloudflare serves the result as static files with its own security headers.

I built it with AI-assisted coding, working in short iterations and reviewing every change. The AI drafts and refactors, and the checks catch what either of us gets wrong. The content stays mine. Every claim comes from my CV, and the site says plainly where something was a pilot rather than a rollout.

The other detail that matters to me is a publish gate. Every outcome and case study carries an attribution of Led, Co-led, Contributed or Supported, and nothing appears until I have approved it. The build fails if an attribution is missing or invalid, if a draft is marked as published, or if placeholder text would reach a visitor. A pre-publish script then checks the built site for things I never want live, such as stray placeholders, third-party requests and cookies. It is the same discipline I would expect in a live service. The checks are code that runs every time, rather than a promise to be careful.

The career line is drawn as a route map, and selecting a station takes you to that role and opens its card. There are also a few things hidden for the curious. If they get in the way, the Easter Egg Hunt Mode toggle in the footer switches them off.