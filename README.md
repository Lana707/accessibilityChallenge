# HackTrent 2026 — Accessibility Challenge entry

A one-page hackathon site rebuilt from the deliberately broken starter so that it works for everyone. That includes keyboard-only users, screen-reader users, people with low vision or colour-blindness, people who need large text, reduced motion or high contrast, and people on slow connections.

**Live check:** open `index.html` in any browser, or serve the folder:

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

- **axe-core 4.10:** 0 violations in light and dark mode (WCAG 2.0 A/AA, 2.1 AA, 2.2 AA, best practice).
- **Contrast:** every text pair meets AA; body text exceeds AAA (7:1). Error red is 7.6:1.
- **Targets:** every control is at least 44 × 44 px.
- **HTML:** valid structure, one `<h1>`, logical outline, 7 landmarks, no duplicate IDs.
- **Weight:** images cut from 6.7 MB to 0.45 MB.

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
