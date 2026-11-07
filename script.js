/* HackTrent — accessibility helpers
   - Theme toggle (light/dark) with aria-pressed, persistence, system default
   - Text-size controls with screen-reader announcements + persistence
   - Accessible form validation (GOV.UK-style error summary + inline errors)
   - In-page link focus management
   - Search feedback via live region
*/
(function () {
    "use strict";

    var status = document.getElementById("text-size-status");

    /* ---------- Theme toggle ---------- */
    var themeBtn = document.getElementById("theme-toggle");
    var root = document.documentElement;

    function systemPrefersDark() {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    function currentIsDark() {
        var set = root.getAttribute("data-theme");
        if (set === "dark") return true;
        if (set === "light") return false;
        return systemPrefersDark();
    }

    function renderThemeButton() {
        var dark = currentIsDark();
        themeBtn.setAttribute("aria-pressed", String(dark));
        themeBtn.setAttribute("aria-label",
            dark ? "Switch to light mode" : "Switch to dark mode");
        themeBtn.querySelector(".theme-icon").textContent = dark ? "☀️" : "🌙";
    }

    try {
        var savedTheme = localStorage.getItem("hacktrent-theme");
        if (savedTheme === "dark" || savedTheme === "light") {
            root.setAttribute("data-theme", savedTheme);
        }
    } catch (e) { /* storage unavailable */ }

    if (themeBtn) {
        renderThemeButton();
        themeBtn.addEventListener("click", function () {
            var next = currentIsDark() ? "light" : "dark";
            root.setAttribute("data-theme", next);
            try { localStorage.setItem("hacktrent-theme", next); } catch (e) {}
            renderThemeButton();
            if (status) {
                status.textContent = next === "dark"
                    ? "Dark mode on" : "Light mode on";
            }
        });
    }

    /* ---------- Text size ---------- */
    var size = 100;
    try {
        var saved = parseInt(localStorage.getItem("hacktrent-text-size"), 10);
        if (saved >= 80 && saved <= 150) size = saved;
    } catch (e) { /* storage unavailable */ }

    function applySize() {
        root.style.fontSize = size + "%";
        if (status) status.textContent = "Text size " + size + " percent";
        try { localStorage.setItem("hacktrent-text-size", String(size)); } catch (e) {}
    }
    if (size !== 100) applySize();

    document.getElementById("text-larger").addEventListener("click", function () {
        size = Math.min(size + 10, 150);
        applySize();
    });
    document.getElementById("text-smaller").addEventListener("click", function () {
        size = Math.max(size - 10, 80);
        applySize();
    });

    /* ---------- In-page link focus management ----------
       When a same-page link is followed, move real keyboard focus to the
       target section (it has tabindex="-1"), so Tab continues from there. */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", function () {
            var target = document.getElementById(link.getAttribute("href").slice(1));
            if (target) {
                requestAnimationFrame(function () {
                    target.focus({ preventScroll: true });
                });
            }
        });
    });

    /* ---------- Application form validation ---------- */
    var form = document.getElementById("apply-form");
    if (form) {
        var summary = document.getElementById("error-summary");
        var success = document.getElementById("form-success");

        function setFieldError(input, errorEl, message) {
            errorEl.textContent = message;
            input.setAttribute("aria-invalid", message ? "true" : "false");
            input.classList.toggle("has-error", Boolean(message));
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            var name = document.getElementById("applicant-name");
            var email = document.getElementById("applicant-email");
            var nameError = document.getElementById("name-error");
            var emailError = document.getElementById("email-error");
            var errors = [];

            setFieldError(name, nameError, "");
            setFieldError(email, emailError, "");
            success.textContent = "";

            if (!name.value.trim()) {
                setFieldError(name, nameError, "Error: enter your full name.");
                errors.push({ input: name, text: "Full name is missing." });
            }
            if (!email.value.trim()) {
                setFieldError(email, emailError, "Error: enter your email address.");
                errors.push({ input: email, text: "Email address is missing." });
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
                setFieldError(email, emailError,
                    "Error: enter an email address in the form name@example.com.");
                errors.push({ input: email, text: "Email address is not valid." });
            }

            if (errors.length) {
                summary.hidden = false;
                summary.innerHTML = "";
                var heading = document.createElement("p");
                heading.textContent = "There " + (errors.length === 1
                    ? "is 1 problem" : "are " + errors.length + " problems") +
                    " with your application:";
                summary.appendChild(heading);
                var list = document.createElement("ul");
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
                    list.appendChild(li);
                });
                summary.appendChild(list);
                summary.focus();
            } else {
                summary.hidden = true;
                summary.innerHTML = "";
                form.reset();
                success.textContent =
                    "Application submitted — thank you! We'll email you a confirmation.";
            }
        });
    }

    /* ---------- Search feedback ---------- */
    var searchForm = document.getElementById("search-form");
    if (searchForm) {
        searchForm.addEventListener("submit", function (event) {
            event.preventDefault();
            var q = document.getElementById("site-search").value.trim();
            if (status) {
                status.textContent = q
                    ? 'Search is a demo on this page. You searched for "' + q + '".'
                    : "Enter a search term first.";
            }
        });
    }
})();
