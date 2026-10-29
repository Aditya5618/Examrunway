# ExamRunway

**Track:** 03, Micro-service Design (DevOps Web Design Challenge)
**Candidate:** Aditya Pathak
**Live site:** https://Aditya5618.github.io/examrunway/
**Repository:** https://github.com/Aditya5618/examrunway

## Problem statement
Students usually know their exam date but not what to study each day, so they over-study easy topics and run short on hard ones.

## Target user
A school or college student with 1-4 weeks before an exam, studying alone, mostly on a phone.

## What makes it useful
- Topics are weighted: `difficulty x (4 - confidence)`, so hard, low-confidence topics get more time.
- The last 1-2 days are reserved for revision.
- The plan is a tickable daily checklist with a progress bar.

## Core flow
1. **Landing:** press "Plan my exam".
2. **Setup:** enter exam name, date, study hours per day, and rest days.
3. **Topics:** add topics with difficulty and confidence.
4. **Plan:** press "Create my plan" to get day cards; tick tasks and watch progress.
5. Copy the plan, print it, or start over.

**States covered:** empty topic list, blank or duplicate topic, past date, invalid hours, rest days removing every study day, too few days for the topics, plan-ready message, and all-done message.

## Stack
Plain HTML, CSS and JavaScript. Data is saved in the browser's localStorage. No backend, no API keys, no build step. Fonts: Space Grotesk and Inter (Google Fonts, with system fallbacks).

## Run locally
1. Download or clone this repo.
2. Open the folder in VS Code and run **Live Server** on `index.html` (or just double-click `index.html`).

## Deploy
GitHub repo -> Settings -> Pages -> Deploy from branch `main`, folder `/ (root)`.

## Accessibility
Labelled fields, inline error summaries, keyboard-friendly controls, visible focus rings, 44px touch targets, skip link, `prefers-reduced-motion` support, and a print stylesheet.

## Known limitations
- Data lives only in one browser on one device; clearing site data deletes the plan.
- Editing setup or topics and creating a new plan resets ticked progress.
- The plan is not recalculated automatically if you miss days.
- Hours are rounded to quarter-hours; the weighting is a simple heuristic, not a learning-science model.
- Fonts need an internet connection; system fonts are used offline.

## Credits
Fonts: Space Grotesk and Inter via Google Fonts (SIL Open Font License). No other third-party assets or libraries. AI tools helped draft code and copy; all output was reviewed and tested.

## Design rationale (about 150 words)
ExamRunway helps students who know their exam date but not what to do today. The goal is a plan someone can create in two minutes on a phone. The core decisions: a short, linear flow (setup, topics, plan) with a visible step indicator so nobody hits a dead end; a weighting rule that gives hard, low-confidence topics more time; and reserved revision days so the final stretch is not wasted. Visually, a navy and amber "runway" theme makes the countdown idea memorable, while the rest of the interface stays quiet, with large touch targets and strong contrast. Errors explain what to fix, and empty states tell the user what to add. Scope was kept small on purpose, with no accounts or backend, so every button works. One future improvement: re-plan automatically when a student misses a day, redistributing unfinished tasks across the remaining days.
