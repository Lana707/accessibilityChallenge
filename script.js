/* HackTrent — accessibility behaviours
   1. Text size:   smaller / reset / larger, announced and remembered
   2. Theme:       light/dark switch (role=switch), follows system by default
   3. Navigation:  in-page links move keyboard focus; aria-current tracks section
   4. Search:      real results panel, focus moves to it, announced
   5. Form:        GOV.UK-style error summary + inline errors + success status
*/
(function () {
    "use strict";

    var root = document.documentElement;
    var announcer = document.getElementById("announcer");

    function announce(message) {
        if (!announcer) return;
        // Clear first so repeating the same message is still read out
        announcer.textContent = "";
        window.setTimeout(function () { announcer.textContent = message; }, 50);
    }

    function store(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* storage blocked */ }
    }

    function read(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    /* ---------- 1. Text size ---------- */
    var MIN = 80, MAX = 160, STEP = 10;
    var size = parseInt(read("hacktrent-text-size"), 10);
    if (isNaN(size) || size < MIN || size > MAX) size = 100;

    function applySize(say) {
        root.style.fontSize = size + "%";
        store("hacktrent-text-size", String(size));
        var smaller = document.getElementById("text-smaller");
        var larger = document.getElementById("text-larger");
        if (smaller) smaller.disabled = size <= MIN;
        if (larger) larger.disabled = size >= MAX;
        if (say) announce("Text size " + size + " percent");
    }

    function bind(id, handler) {
        var el = document.getElementById(id);
        if (el) el.addEventListener("click", handler);
    }

    bind("text-larger", function () { size = Math.min(size + STEP, MAX); applySize(true); });
    bind("text-smaller", function () { size = Math.max(size - STEP, MIN); applySize(true); });
    bind("text-reset", function () { size = 100; applySize(true); });
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
        if (themeBtn) themeBtn.setAttribute("aria-checked", String(isDark()));
    }

    if (themeBtn) {
        renderSwitch();
        themeBtn.addEventListener("click", function () {
            var next = isDark() ? "light" : "dark";
            root.setAttribute("data-theme", next);
            store("hacktrent-theme", next);
            renderSwitch();
            announce(next === "dark" ? "Dark mode on" : "Dark mode off");
        });
        // If the user never chose, keep following the system setting
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", renderSwitch);
    }

    /* ---------- 3. Navigation ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", function () {
            var id = link.getAttribute("href").slice(1);
            var target = id ? document.getElementById(id) : null;
            if (!target) return;
            requestAnimationFrame(function () {
                target.focus({ preventScroll: true });
            });
        });
    });

    // Mark the section in view in the main nav (aria-current="location")
    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-nav a[href^='#']"));
    var watched = navLinks.map(function (a) {
        return document.getElementById(a.getAttribute("href").slice(1));
    }).filter(Boolean);

    if ("IntersectionObserver" in window && watched.length) {
        var visible = {};
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
            var current = watched.filter(function (s) { return visible[s.id]; })[0];
            if (!current) return;
            navLinks.forEach(function (a) {
                if (a.getAttribute("href") === "#" + current.id) {
                    a.setAttribute("aria-current", "location");
                } else {
                    a.removeAttribute("aria-current");
                }
            });
        }, { rootMargin: "-40% 0px -50% 0px" });
        watched.forEach(function (s) { observer.observe(s); });
    }

    /* ---------- 4. Search ---------- */
    var searchForm = document.getElementById("search-form");
    var panel = document.getElementById("search-results");

    if (searchForm && panel) {
        var heading = document.getElementById("search-results-heading");
        var summaryEl = document.getElementById("search-results-summary");
        var list = document.getElementById("search-results-list");
        var input = document.getElementById("site-search");

        var pages = Array.prototype.slice.call(document.querySelectorAll("main section[id]"))
            .map(function (s) {
                var h = s.querySelector("h1, h2");
                return { id: s.id, title: h ? h.textContent.trim() : s.id, text: s.textContent.toLowerCase() };
            });

        function closePanel(returnFocus) {
            panel.hidden = true;
            if (returnFocus && input) input.focus();
        }

        searchForm.addEventListener("submit", function (event) {
            event.preventDefault();
            var q = input.value.trim();
            if (!q) {
                announce("Enter a search term first.");
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
                    requestAnimationFrame(function () {
                        var t = document.getElementById(p.id);
                        if (t) t.focus({ preventScroll: true });
                    });
                });
                li.appendChild(a);
                list.appendChild(li);
            });
            summaryEl.textContent = hits.length
                ? hits.length + (hits.length === 1 ? " section matches " : " sections match ") + "“" + q + "”."
                : "Nothing on this page matches “" + q + "”. Try “schedule” or “apply”.";
            panel.hidden = false;
            heading.focus();
        });

        document.getElementById("search-close").addEventListener("click", function () { closePanel(true); });
        panel.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closePanel(true);
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
            var nameError = document.getElementById("name-error");
            var emailError = document.getElementById("email-error");
            var agreeError = document.getElementById("agree-error");
            var errors = [];

            setError(name, nameError, "");
            setError(email, emailError, "");
            setError(agree, agreeError, "");
            success.textContent = "";

            if (!name.value.trim()) {
                setError(name, nameError, "Enter your full name.");
                errors.push({ input: name, text: "Enter your full name" });
            }
            var emailValue = email.value.trim();
            if (!emailValue) {
                setError(email, emailError, "Enter your email address.");
                errors.push({ input: email, text: "Enter your email address" });
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
                setError(email, emailError, "Enter an email address in the format name@example.com.");
                errors.push({ input: email, text: "Enter a valid email address" });
            }
            if (!agree.checked) {
                setError(agree, agreeError, "Tick the box to agree to the code of conduct.");
                errors.push({ input: agree, text: "Agree to the code of conduct" });
            }

            if (errors.length) {
                summary.innerHTML = "";
                var h = document.createElement("h4");
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
                summary.focus();
            } else {
                summary.hidden = true;
                summary.innerHTML = "";
                form.reset();
                success.innerHTML = '<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-check"/></svg>';
                success.appendChild(document.createTextNode(
                    "Application submitted. Thank you! We'll email you a confirmation."));
                success.focus();
            }
        });
    }
})();
