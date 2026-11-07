# HackTrent 2026 — Accessibility Challenge entry

A one-page hackathon site rebuilt from the deliberately broken starter so that it works for everyone. That includes keyboard-only users, screen-reader users, people with low vision or colour-blindness, people who need large text, reduced motion or high contrast, and people on slow connections.

**Live site:** https://mangokrish.github.io/accessibilityChallenge/

**Run locally:** open `index.html` in any browser, or serve the folder:

```
python3 -m http.server 8000
```

then visit http://localhost:8000.

## What to try

- Press **Tab** once: a "Skip to main content" link appears.
- Keep tabbing: every control shows a yellow focus ring with a dark halo, on every background.
- Use the **A− / A / A+** buttons: text scales from 90% to 160% and the change is announced.
- Flip the **Dark mode** switch: it follows your system by default and remembers your choice.
- Submit the application form empty: a focused error summary links to each field; fix them and the success message takes focus.
- Type "ASL" in **Find**: results appear, focus moves to them, **Escape** closes them.
- Shrink the window to 320 px or zoom to 400%: nothing scrolls sideways except the schedule table, which is its own labelled scroll region.
- Turn on Windows High Contrast or `prefers-reduced-motion`: borders, focus and the switch stay visible; all motion stops.

## Results

| Check | Result |
| --- | --- |
| axe-core 4.10, WCAG 2.0 A/AA + 2.1 AA + 2.2 AA + best practice, **light mode** | 0 violations |
| axe-core 4.10, same rules, **dark mode** | 0 violations |
| Browser console on load | 0 errors, 0 missing resources |
| Text contrast | Every pair AA; body text 14.6–15.4:1 (AAA); error text 7.6:1 |
| Target size | Every control ≥ 44 × 44 px; checkboxes and radios 26 px |
| Structure | Valid nesting, one `<h1>`, logical outline, no duplicate IDs, every `for` / `aria-*` / anchor resolves |
| Reflow at 320 px, and at 320 px with 160% text | No horizontal scroll |
| Keyboard walk (skip link, nav, find, text size, theme, form error and success, footer disclosures) | All reachable and operable; focus always visible and never lost |
| Screen-reader transcript review | No duplicate announcements; headings, landmarks and controls all named |
| Independent code reviews | 6 passes (ARIA, CSS contrast and reflow, live assets, design, screen reader, plain language): 70+ findings, all fixed |
| Image weight | 6.7 MB → 0.45 MB |
| Works without JavaScript | Yes: content, navigation, disclosures and native validation |

Full report, including what was wrong with the original and how each POUR principle is met: **[ACCESSIBILITY.md](ACCESSIBILITY.md)**.

## Files

| File | Purpose |
|---|---|
| `index.html` | Semantic page: header, nav, main with six sections, footer |
| `styles.css` | Design tokens for both themes, layout, focus, print, forced-colors |
| `script.js` | Text size, theme switch, focus management, find, form validation |
| `ACCESSIBILITY.md` | Audit and conformance report |

## Design

Purple, yellow and cream. Body text is **Atkinson Hyperlegible**, a typeface the Braille Institute designed for low-vision readers; headings are **Fraunces**. Cards use framed "plates" with hard offset shadows; the current nav tile carries a ribbon so position is never shown by colour alone.
