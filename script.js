/* HackTrent — accessibility behaviours
   1. Text size:   smaller / reset / larger, announced and remembered
   2. Theme:       light/dark switch (role=switch), follows system by default
   3. Navigation:  in-page links move keyboard focus to the target heading;
                   aria-current tracks the section in view
   4. Find:        in-page results panel, focus moves to it, closes on Escape
                   or when focus leaves it
   5. Form:        error summary that links to each field, inline errors,
                   success announced by a status region
   6. Table:       scroll wrapper is a tab stop only when it actually overflows
*/
(function () {
    "use strict";

    var root = document.documentElement;
    var announcer = document.getElementById("announcer");

    function announce(message) {
        if (!announcer) return;
        announcer.textContent = "";
        window.setTimeout(function () { announcer.textContent = message; }, 50);
    }

    function store(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* storage blocked */ }
    }

    function read(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    /* Move focus to the most useful element inside a target: its heading if it
       has one, otherwise the target itself. Headings get tabindex=-1 on demand. */
    function focusTarget(target) {
        if (!target) return;
        var el = target.matches("h1, h2, h3, main, input, textarea, button") ? target
               : target.querySelector("h1, h2, h3") || target;
        if (el.tabIndex < 0) el.setAttribute("tabindex", "-1");   // never demote native focusables
        // The browser's own hash navigation can blur whatever we focus, so focus
        // after it has run (next frame) and once more shortly after as a guard.
        requestAnimationFrame(function () { el.focus({ preventScroll: true }); });
        window.setTimeout(function () {
            if (document.activeElement !== el) el.focus({ preventScroll: true });
        }, 120);
    }

    /* ---------- 1. Text size ---------- */
    var MIN = 90, MAX = 160, STEP = 10;
    var size = parseInt(read("hacktrent-text-size"), 10);
    if (isNaN(size) || size < MIN || size > MAX) size = 100;

    var smaller = document.getElementById("text-smaller");
    var larger = document.getElementById("text-larger");

    function applySize(say) {
        root.style.fontSize = size + "%";
        // aria-disabled keeps the button focusable, so focus is never dropped
        if (smaller) smaller.setAttribute("aria-disabled", String(size <= MIN));
        if (larger) larger.setAttribute("aria-disabled", String(size >= MAX));
        if (say) {
            store("hacktrent-text-size", String(size));
            announce("Text size " + size + " percent");
        }
    }

    function bindSize(el, delta) {
        if (!el) return;
        el.addEventListener("click", function () {
            if (el.getAttribute("aria-disabled") === "true") return;
            size = delta === 0 ? 100 : Math.min(MAX, Math.max(MIN, size + delta));
            applySize(true);
        });
    }

    bindSize(larger, STEP);
    bindSize(smaller, -STEP);
    bindSize(document.getElementById("text-reset"), 0);
    applySize(false);

    /* ---------- 2. Theme switch ---------- */
    var themeBtn = document.getElementById("theme-toggle");

    function isDark() {
        var set = root.getAttribute("data-theme");
        if (set === "dark") return true;
        if (set === "light") return false;
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    function renderSwitch() {
        var dark = isDark();
        root.setAttribute("data-dark", String(dark));
        if (themeBtn) themeBtn.setAttribute("aria-checked", String(dark));
    }

    if (themeBtn) {
        renderSwitch();
        themeBtn.addEventListener("click", function () {
            var next = isDark() ? "light" : "dark";
            root.setAttribute("data-theme", next);
            store("hacktrent-theme", next);
            renderSwitch();   // the switch's own state change is what screen readers announce
        });
        var mq = window.matchMedia("(prefers-color-scheme: dark)");
        if (mq.addEventListener) mq.addEventListener("change", renderSwitch); else if (mq.addListener) mq.addListener(renderSwitch);
    }

    /* ---------- 3. Navigation ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", function () {
            var id = link.getAttribute("href").slice(1);
            var target = id ? document.getElementById(id) : null;
            if (!target) return;
            // Open a closed disclosure if the link points at one
            if (target.tagName === "DETAILS") {
                target.open = true;
                focusTarget(target.querySelector("summary"));
                return;
            }
            focusTarget(target);
        });
    });

    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-nav a[href^='#']"));
    var watched = navLinks.map(function (a) {
        return document.getElementById(a.getAttribute("href").slice(1));
    }).filter(Boolean);

    if ("IntersectionObserver" in window && watched.length) {
        var visible = {};
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
            var current = watched.filter(function (s) { return visible[s.id]; })[0];
            navLinks.forEach(function (a) {
                if (current && a.getAttribute("href") === "#" + current.id) {
                    a.setAttribute("aria-current", "location");
                } else {
                    a.removeAttribute("aria-current");
                }
            });
        }, { rootMargin: "-30% 0px -55% 0px" });
        watched.forEach(function (s) { observer.observe(s); });
    }

    /* ---------- 4. Find on this page ---------- */
    var searchForm = document.getElementById("search-form");
    var panel = document.getElementById("search-results");

    var searchClose = document.getElementById("search-close");
    if (searchForm && panel && searchClose) {
        var title = document.getElementById("search-results-heading");
        var summaryEl = document.getElementById("search-results-summary");
        var list = document.getElementById("search-results-list");
        var input = document.getElementById("site-search");

        var pages = Array.prototype.slice.call(document.querySelectorAll("main section[id]"))
            .map(function (s) {
                var h = s.querySelector("h1, h2, h3");
                var nav = navLinks.filter(function (a) { return a.getAttribute("href") === "#" + s.id; })[0];
                return {
                    id: s.id,
                    title: nav ? nav.textContent.trim() : (h ? h.textContent.trim() : s.id),
                    text: s.textContent.toLowerCase()
                };
            });

        function closePanel(returnFocus) {
            if (panel.hidden) return;
            panel.hidden = true;
            announce("Results closed.");
            if (returnFocus && input) input.focus();
        }

        searchForm.addEventListener("submit", function (event) {
            event.preventDefault();
            var q = input.value.trim();
            if (!q) {
                announce("Enter a word to find first.");
                input.focus();
                return;
            }
            var hits = pages.filter(function (p) { return p.text.indexOf(q.toLowerCase()) !== -1; });
            list.innerHTML = "";
            hits.forEach(function (p) {
                var li = document.createElement("li");
                var a = document.createElement("a");
                a.href = "#" + p.id;
                a.textContent = p.title;
                a.addEventListener("click", function () {
                    closePanel(false);
                    focusTarget(document.getElementById(p.id));
                });
                li.appendChild(a);
                list.appendChild(li);
            });
            summaryEl.textContent = hits.length
                ? hits.length + (hits.length === 1 ? " section mentions " : " sections mention ") + "“" + q + "”."
                : "Nothing on this page mentions “" + q + "”. Try “schedule” or “apply”.";
            panel.hidden = false;
            title.focus();
        });

        searchClose.addEventListener("click", function () { closePanel(true); });

        function onEscape(e) { if (e.key === "Escape") closePanel(true); }
        panel.addEventListener("keydown", onEscape);
        searchForm.addEventListener("keydown", onEscape);

        // Close quietly when keyboard focus leaves the panel and the field
        panel.addEventListener("focusout", function (e) {
            var next = e.relatedTarget;
            if (!next) return;   // window blur or click on empty page: keep results open
            if (panel.contains(next) || searchForm.contains(next)) return;
            closePanel(false);
        });
    }

    /* ---------- 5. Application form ---------- */
    var form = document.getElementById("apply-form");
    if (form) {
        var summary = document.getElementById("error-summary");
        var success = document.getElementById("form-success");

        function setError(input, errorEl, message) {
            if (message) {
                errorEl.innerHTML = '<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-alert"/></svg>' +
                    '<span><span class="visually-hidden">Error: </span></span>';
                errorEl.lastChild.appendChild(document.createTextNode(message));
                input.setAttribute("aria-invalid", "true");
            } else {
                errorEl.textContent = "";
                input.removeAttribute("aria-invalid");
            }
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            var name = document.getElementById("applicant-name");
            var email = document.getElementById("applicant-email");
            var agree = document.getElementById("agree");
            var fields = [
                { input: name, error: document.getElementById("name-error") },
                { input: email, error: document.getElementById("email-error") },
                { input: agree, error: document.getElementById("agree-error") }
            ];
            var errors = [];

            fields.forEach(function (f) { setError(f.input, f.error, ""); });
            success.textContent = "";

            function fail(f, message) {
                setError(f.input, f.error, message);
                errors.push({ input: f.input, text: message });   // same wording in both places
            }

            if (!name.value.trim()) fail(fields[0], "Enter your full name.");
            var emailValue = email.value.trim();
            if (!emailValue) fail(fields[1], "Enter your email address.");
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) fail(fields[1], "Enter an email address in the format name@example.com.");
            if (!agree.checked) fail(fields[2], "Tick the box to agree to the code of conduct.");

            if (errors.length) {
                summary.innerHTML = "";
                var h = document.createElement("h4");
                h.id = "error-summary-heading";
                h.setAttribute("tabindex", "-1");
                summary.setAttribute("role", "group");
                summary.setAttribute("aria-labelledby", "error-summary-heading");
                h.innerHTML = '<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-alert"/></svg>';
                h.appendChild(document.createTextNode(
                    "There " + (errors.length === 1 ? "is 1 problem" : "are " + errors.length + " problems") + " with your application"));
                summary.appendChild(h);
                var ul = document.createElement("ul");
                errors.forEach(function (err) {
                    var li = document.createElement("li");
                    var a = document.createElement("a");
                    a.href = "#" + err.input.id;
                    a.textContent = err.text;
                    a.addEventListener("click", function (e) {
                        e.preventDefault();
                        err.input.focus();
                    });
                    li.appendChild(a);
                    ul.appendChild(li);
                });
                summary.appendChild(ul);
                summary.hidden = false;
                h.focus();   // the heading announces the count; Tab moves through the links
            } else {
                summary.hidden = true;
                summary.innerHTML = "";
                form.reset();
                success.innerHTML = '<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-check"/></svg>';
                success.appendChild(document.createTextNode(
                    "Application submitted. Thank you! We'll email you a confirmation."));
                success.focus();   // focus reads the message; role=status is a backup
            }
        });
    }

    /* ---------- 6. Table scroll wrapper ---------- */
    var wrap = document.getElementById("schedule-table");
    if (wrap) {
        function updateWrap() {
            if (wrap.scrollWidth > wrap.clientWidth + 1) {
                wrap.setAttribute("tabindex", "0");
            } else {
                wrap.removeAttribute("tabindex");
            }
        }
        updateWrap();
        if ("ResizeObserver" in window) new ResizeObserver(updateWrap).observe(wrap);
        else window.addEventListener("resize", updateWrap);
    }
})();
