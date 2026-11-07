# Accessibility report — HackTrent 2026

**Target:** WCAG 2.2 Level AA, with AAA where it was cheap.
**Stack:** one HTML page, one stylesheet, one script. No framework, no build step.
**Result:** axe-core 4.10 reports **0 violations** in light mode and dark mode across the WCAG 2.0 A/AA, 2.1 AA, 2.2 AA and best-practice rule sets. Every finding below was fixed and re-tested.

---

## 1. What was wrong with the original

The starting site failed almost every POUR principle:

| Problem | Why it mattered | WCAG |
|---|---|---|
| Navigation was `<div onclick>` | Not focusable, not a link, invisible to screen readers and voice control | 2.1.1, 4.1.2 |
| No `<!DOCTYPE>`, unclosed `<div>` and `<section>` | Quirks mode; footer and sidebar parsed inside main content | 1.3.1, 1.3.2 |
| Purple text on blueviolet (1.58:1), blue on purple (1.10:1), dark blue on black (1.37:1) | Unreadable for low vision and colour-blind users | 1.4.3 |
| Two photos with no `alt` | Screen readers read "happyHackers dot JPG" | 1.1.1 |
| Search input with no label and `type="url"` | Unnamed field, wrong mobile keyboard | 1.3.1, 3.3.2 |
| No landmarks, no `<h1>`, headings chosen by size | No way to navigate by region or heading | 1.3.1, 2.4.6 |
| Fixed 220px / 1fr / 220px grid, `width="500px"` image | Horizontal scrolling at 320 px (400% zoom) | 1.4.10 |
| 6.7 MB of images displayed at 500 px | Slow for everyone, worst on mobile data | — |

---

## 2. Perceivable

- **Text alternatives.** Hero photo has a descriptive `alt`; the news thumbnail is decorative (`alt=""`) because its link text already names the article. Every SVG icon is `aria-hidden` with visible or hidden text beside it.
- **Colour contrast.** All text pairs meet AA; body text exceeds AAA (ink on page 15.4:1 light, 14.6:1 dark; secondary text 8:1+). Checked against the *lightest* stop of the hero gradient (white 7.4:1, yellow 7.3:1). Non-text contrast: inputs have a 7:1 border, focus rings 3:1+ against every background.
- **Not colour alone.** Current nav tile has a yellow ribbon and offset shadow; errors have an icon and the word "Error"; links are underlined; required state is stated in text.
- **Typography.** Body is Atkinson Hyperlegible (Braille Institute, designed for low vision); display serif only at ≥1.6 rem. 18 px base, 1.65 line height, 42 em measure.
- **Themes.** Light and dark; follows `prefers-color-scheme` by default, overridable with a `role="switch"` that remembers the choice. Applied before first paint, so no flash.
- **Preferences honoured.** `prefers-reduced-motion` removes all transitions and smooth scroll; `prefers-contrast: more` strengthens secondary text and borders in both themes; `forced-colors` (Windows High Contrast) keeps every border, focus ring and the switch visible.
- **Reflow.** No horizontal scroll at 320 px; every grid collapses; the schedule table scrolls inside a labelled region. Nothing uses a fixed height.

## 3. Operable

- **Keyboard.** Every control is a native `<a>`, `<button>`, `<input>`, `<summary>`. Skip link is the first tab stop. Tab order matches visual order.
- **Focus visible.** 3 px yellow ring plus a 6 px dark halo on everything, so it is visible on yellow buttons, white cards and purple header alike. Rings are declared with enough specificity to survive component shadows.
- **Focus not obscured.** Header is sticky only above 1280 px, and `scroll-padding-top` keeps focused content clear of it; below that it is static.
- **Focus management.** In-page links move focus to the target *heading*, so Tab continues from the right place. Search results move focus to the results title; Escape or focus-out closes them and returns focus to the field. Form errors move focus to a summary that links to each field.
- **Target size.** Every control is ≥44 × 44 px; checkboxes and radios are 26 px.
- **No traps, no timeouts, no motion that can't be reduced.**

## 4. Understandable

- `lang="en"`, descriptive `<title>`, one `<h1>`, logical H2/H3 outline, numbered sections.
- Plain language: short sentences, consistent terms ("Apply" for the action, "application" for the form), abbreviations expanded on first use (ASL, WCAG), dates with timezone.
- **Forms.** Visible labels, hints tied with `aria-describedby`, `autocomplete` tokens for name and email, required state in text. On error: a focused summary ("There are 3 problems…") whose links use the *same wording* as the inline messages; `aria-invalid` on fields. On success: a status region announces it and focus returns to the form heading. `method="post"` so a no-JS submit never puts personal data in the URL.
- Consistent navigation and identification: the same five links in the same order; `aria-current="location"` tracks the section in view.

## 5. Robust

- Valid HTML (checked with a parser: no misnesting, no duplicate IDs, every `for`, `aria-*` and `use href` resolves).
- ARIA used only where HTML has no equivalent: `role="switch"`, `role="search"`, `role="status"`, `aria-current`, `aria-describedby`.
- Works with JavaScript disabled: all content, navigation, disclosures and native form validation still function.

## 6. How it was tested

1. **axe-core 4.10** injected into the running page in both themes, all WCAG tags + best practice: 0 violations.
2. **Structural script**: duplicate IDs, heading outline, landmarks, empty links, target sizes < 24 px, broken `aria` references.
3. **Keyboard walk** at 375 px, 768 px, 1280 px and 1400 px: skip link, nav, search open/close, text size at both limits, theme switch, form error and success paths, footer disclosures.
4. **Three independent code reviews** (ARIA/semantics, CSS contrast/reflow with computed ratios, live-page assets and reading order) producing 45 findings, all triaged and fixed.
5. Known limits: not yet tested with a real screen reader session (VoiceOver/NVDA) or with users with disabilities. Fonts load from Google Fonts; if blocked, the system fallback stack is still fully accessible.

## 7. Extras beyond AA

- Text-size controls (90–160%) that announce and remember, independent of browser zoom.
- Find-on-page with announced result count.
- Print stylesheet.
- Accessibility statement with a contact address and response time.
