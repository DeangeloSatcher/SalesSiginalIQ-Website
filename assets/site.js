/* ==========================================================================
   SalesSignalIQ — shared interactions
   nav scroll-condense · mobile menu · accordion · count-up · scroll-reveal
   · magnetic CTAs · multi-step quote form
   All motion respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------  Nav: condense + background on scroll  ---------- */
  const nav = document.querySelector(".site-nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ----------  Mobile menu  ---------- */
  const burger = document.querySelector(".hamburger");
  const menu = document.querySelector(".mobile-menu");
  if (burger && menu) {
    const setMenu = (open) => {
      burger.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  }

  /* ----------  Accordion (FAQ)  ---------- */
  document.querySelectorAll(".accordion-trigger").forEach((trigger) => {
    const panel = document.getElementById(trigger.getAttribute("aria-controls"));
    trigger.addEventListener("click", () => {
      const open = trigger.getAttribute("aria-expanded") === "true";
      // close siblings within the same accordion
      const root = trigger.closest("[data-accordion]");
      if (root && !open) {
        root.querySelectorAll(".accordion-trigger").forEach((t) => {
          t.setAttribute("aria-expanded", "false");
          const p = document.getElementById(t.getAttribute("aria-controls"));
          if (p) { p.style.maxHeight = "0px"; p.style.opacity = "0"; }
        });
      }
      trigger.setAttribute("aria-expanded", String(!open));
      if (panel) {
        if (!open) { panel.style.maxHeight = panel.scrollHeight + "px"; panel.style.opacity = "1"; }
        else { panel.style.maxHeight = "0px"; panel.style.opacity = "0"; }
      }
    });
  });

  /* ----------  Scroll-reveal (staggered)  ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ----------  Count-up stats  ---------- */
  const countEls = document.querySelectorAll("[data-count]");
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.decimals && parseInt(el.dataset.decimals, 10)) || 0;
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const fmt = (n) => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    if (reduceMotion) { el.textContent = prefix + fmt(target) + suffix; return; }
    const dur = 1600;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (countEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      countEls.forEach(runCount);
    } else {
      const cio = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
      }, { threshold: 0.5 });
      countEls.forEach((el) => cio.observe(el));
    }
  }

  /* ----------  Magnetic CTAs  ---------- */
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 0.28;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ----------  Multi-step quote form  ---------- */
  const form = document.getElementById("quote-form");
  if (form) {
    const steps = Array.from(form.querySelectorAll(".form-step"));
    const progressFill = form.querySelector(".progress-fill");
    const stepLabel = form.querySelector("[data-step-label]");
    const successPanel = document.getElementById("quote-success");
    let current = 0;

    const showStep = (i) => {
      steps.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
      const pct = ((i + 1) / steps.length) * 100;
      if (progressFill) progressFill.style.width = pct + "%";
      if (stepLabel) stepLabel.textContent = `Step ${i + 1} of ${steps.length}`;
      const firstField = steps[i].querySelector("input, textarea, select");
      if (firstField && !reduceMotion) setTimeout(() => firstField.focus({ preventScroll: true }), 60);
    };

    const validateStep = (i) => {
      let ok = true;
      steps[i].querySelectorAll("[required]").forEach((field) => {
        let valid = field.value.trim() !== "";
        if (valid && field.type === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
        // radio groups
        if (field.type === "radio") {
          valid = !!form.querySelector(`input[name="${field.name}"]:checked`);
        }
        field.setAttribute("aria-invalid", String(!valid));
        if (!valid) ok = false;
      });
      return ok;
    };

    form.querySelectorAll("[data-next]").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (!validateStep(current)) return;
        current = Math.min(current + 1, steps.length - 1);
        showStep(current);
      })
    );
    form.querySelectorAll("[data-prev]").forEach((btn) =>
      btn.addEventListener("click", () => { current = Math.max(current - 1, 0); showStep(current); })
    );

    /* ============================================================
       Web3Forms access key — submissions are emailed to the address
       tied to this key (set up at https://web3forms.com).
       >>> PASTE YOUR ACCESS KEY BETWEEN THE QUOTES BELOW <<<
       It's a public, submit-only token, so it's safe in client code.
       ============================================================ */
    const WEB3FORMS_ACCESS_KEY = "3bc25ec3-8ed1-4422-96a8-12cdc22eb663";

    const errorEl = document.getElementById("quote-error");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateStep(current)) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalLabel = submitBtn ? submitBtn.innerHTML : "";
      if (errorEl) errorEl.hidden = true;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }

      const data = Object.fromEntries(new FormData(form).entries());
      // Send as FormData (multipart) — a CORS "simple" request, so it skips the
      // preflight that JSON would trigger. This is Web3Forms' recommended method.
      const fd = new FormData(form);
      fd.append("access_key", WEB3FORMS_ACCESS_KEY);
      fd.append("subject", `New quote request — ${data.company || data.name || "SalesSignalIQ website"}`);
      fd.append("from_name", "SalesSignalIQ Website");
      // `email` is already a field, which Web3Forms uses as the reply-to address.

      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: fd,
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.message || "Submission failed");

        if (successPanel) {
          form.hidden = true; // form itself carries the .form-body class
          successPanel.hidden = false;
          successPanel.focus({ preventScroll: true });
        }
      } catch (err) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalLabel; }
        if (errorEl) errorEl.hidden = false;
      }
    });

    showStep(0);
  }

  /* ----------  Footer year  ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
