(function () {
  "use strict";

  var pageLoadTime = Date.now();

  function safe(label, fn) {
    try {
      fn();
    } catch (err) {
      if (window.console && window.console.error) {
        console.error("[web4b] " + label + " failed:", err);
      }
    }
  }

  /* GA4 event tracking — no-ops safely if gtag isn't loaded (blocked, offline, etc.) */
  function trackEvent(name, params) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", name, params || {});
      }
    } catch (e) {
      /* never let analytics break the actual feature */
    }
  }

  /* ---------- Sticky navbar ---------- */
  safe("sticky navbar", function () {
    var navbar = document.getElementById("navbar");
    if (!navbar) return;
    function onScroll() {
      if (window.scrollY > 12) {
        navbar.classList.add("is-scrolled");
      } else {
        navbar.classList.remove("is-scrolled");
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  });

  /* ---------- Mobile menu ---------- */
  safe("mobile menu", function () {
    var hamburger = document.getElementById("hamburger");
    var mobileMenu = document.getElementById("mobile-menu");
    if (!hamburger || !mobileMenu) return;

    function closeMenu() {
      hamburger.classList.remove("is-open");
      mobileMenu.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
    }

    hamburger.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.toggle("is-open");
      hamburger.classList.toggle("is-open", isOpen);
      hamburger.setAttribute("aria-expanded", String(isOpen));
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  });

  /* ---------- Scroll reveal ---------- */
  /* Content is visible by default in CSS (html:not(.js) .reveal). This
     only adds the fade-in effect on top; if it fails or never fires,
     nothing is hidden because of it. A timeout below is a second safety
     net in case the observer stalls (e.g. a very short/odd layout). */
  safe("scroll reveal", function () {
    var revealEls = document.querySelectorAll(".reveal");
    if (!revealEls.length) return;

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }

    setTimeout(function () {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }, 4000);
  });

  /* ---------- FAQ accordion ---------- */
  safe("FAQ accordion", function () {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var question = item.querySelector(".faq-question");
      var answer = item.querySelector(".faq-answer");
      if (!question || !answer) return;

      question.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");

        document.querySelectorAll(".faq-item.is-open").forEach(function (openItem) {
          if (openItem !== item) {
            openItem.classList.remove("is-open");
            openItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
            openItem.querySelector(".faq-answer").style.maxHeight = null;
          }
        });

        if (isOpen) {
          item.classList.remove("is-open");
          question.setAttribute("aria-expanded", "false");
          answer.style.maxHeight = null;
        } else {
          item.classList.add("is-open");
          question.setAttribute("aria-expanded", "true");
          answer.style.maxHeight = answer.scrollHeight + "px";
        }
      });
    });
  });

  /* ---------- Pricing CTA -> pre-fill contact form ---------- */
  safe("pricing CTA prefill", function () {
    document.querySelectorAll("[data-plan]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var plan = btn.getAttribute("data-plan");
        trackEvent("select_plan", { plan_name: plan });
        var select = document.getElementById("site-type");
        if (!select) return;
        var map = { Starter: "starter", Business: "business", Pro: "pro", Premium: "premium", Prime: "prime", Elite: "elite" };
        var value = map[plan];
        if (value) {
          setTimeout(function () {
            select.value = value;
          }, 400);
        }
      });
    });
  });

  /* ---------- Pricing comparison table toggle ---------- */
  safe("comparison table toggle", function () {
    var toggleBtn = document.getElementById("compare-toggle");
    var tableWrap = document.getElementById("compare-table-wrap");
    if (!toggleBtn || !tableWrap) return;

    toggleBtn.addEventListener("click", function () {
      var willShow = tableWrap.hidden;
      tableWrap.hidden = !willShow;
      toggleBtn.setAttribute("aria-expanded", String(willShow));
      if (willShow) {
        trackEvent("view_plan_comparison", {});
      }
    });
  });


  /* ---------- Custom package builder ---------- */
  safe("package builder", function () {
    var toggleBtn = document.getElementById("builder-toggle");
    var builderBox = document.getElementById("package-builder");
    if (toggleBtn && builderBox) {
      toggleBtn.addEventListener("click", function () {
        var willShow = builderBox.hidden;
        builderBox.hidden = !willShow;
        toggleBtn.setAttribute("aria-expanded", String(willShow));
      });
    }
    if (!builderBox) return;

    var BASE_PRICE = 19;
    var totalBox = document.getElementById("builder-total");
    var addonChecks = builderBox.querySelectorAll("input[data-addon]");
    var pagesSelect = document.getElementById("builder-pages");
    var submitBtn = document.getElementById("builder-submit");
    if (!totalBox || !submitBtn) return;

    function currentSelection() {
      var addonTotal = 0;
      var addonLabels = [];
      addonChecks.forEach(function (c) {
        if (c.checked) {
          addonTotal += parseFloat(c.getAttribute("data-price")) || 0;
          var label = c.closest(".builder-option");
          var text = label ? label.textContent.trim().replace(/\+\d+.*$/, "").trim() : "";
          if (text) addonLabels.push(text);
        }
      });

      var pagesPrice = 0;
      if (pagesSelect && pagesSelect.selectedOptions.length) {
        var pagesOption = pagesSelect.selectedOptions[0];
        pagesPrice = parseFloat(pagesOption.getAttribute("data-price")) || 0;
        if (pagesPrice > 0) addonLabels.push(pagesOption.textContent.trim());
      }

      return { total: BASE_PRICE + addonTotal + pagesPrice, addonLabels: addonLabels };
    }

    function render() {
      var sel = currentSelection();
      totalBox.innerHTML = 'סה"כ חודשי משוער: <strong>' + sel.total + " ₪</strong>";
    }

    addonChecks.forEach(function (c) {
      c.addEventListener("change", render);
    });
    if (pagesSelect) pagesSelect.addEventListener("change", render);
    render();

    submitBtn.addEventListener("click", function () {
      var sel = currentSelection();
      trackEvent("package_builder_submit", {
        addons: sel.addonLabels.join(","),
        total: sel.total,
      });

      var siteType = document.getElementById("site-type");
      var budget = document.getElementById("budget");
      var message = document.getElementById("message");

      if (siteType) siteType.value = "not-sure";

      if (budget) {
        budget.value =
          sel.total <= 50 ? "up-to-50" : sel.total <= 100 ? "50-100" : sel.total <= 150 ? "100-150" : "150-plus";
      }

      if (message) {
        var summary =
          "מעוניין/ת בחבילה מותאמת אישית: בסיס (עיצוב, אחסון, SSL, מובייל)" +
          (sel.addonLabels.length ? " + " + sel.addonLabels.join(" + ") : "") +
          ". הערכת מחיר חודשית: " +
          sel.total +
          " ₪.";
        message.value = message.value ? message.value + "\n\n" + summary : summary;
      }

      var contactSection = document.getElementById("contact");
      if (contactSection) contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
      var nameField = document.getElementById("name");
      if (nameField) setTimeout(function () { nameField.focus(); }, 500);
    });
  });

  /* ---------- Discord username copy-to-clipboard ---------- */
  safe("Discord copy buttons", function () {
    function copyToClipboard(text, onDone) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onDone).catch(onDone);
      } else {
        onDone();
      }
    }

    var discordBtn = document.getElementById("discord-contact");
    var discordLabel = document.getElementById("discord-username");
    if (discordBtn && discordLabel) {
      var username = discordBtn.getAttribute("data-copy");
      var originalText = username + " · לחצו להעתקה";
      discordBtn.addEventListener("click", function () {
        trackEvent("discord_copy", { location: "contact_section" });
        copyToClipboard(username, function () {
          discordBtn.classList.add("is-copied");
          discordLabel.textContent = username + " · הועתק! ✅";
          setTimeout(function () {
            discordBtn.classList.remove("is-copied");
            discordLabel.textContent = originalText;
          }, 2000);
        });
      });
    }

    var footerDiscordBtn = document.querySelector(".footer-discord-btn");
    if (footerDiscordBtn) {
      footerDiscordBtn.addEventListener("click", function () {
        trackEvent("discord_copy", { location: "footer" });
        var uname = footerDiscordBtn.getAttribute("data-copy");
        copyToClipboard(uname, function () {
          footerDiscordBtn.classList.add("is-copied");
          footerDiscordBtn.textContent = "✅";
          setTimeout(function () {
            footerDiscordBtn.classList.remove("is-copied");
            footerDiscordBtn.textContent = "🎮";
          }, 2000);
        });
      });
    }
  });

  /* ---------- WhatsApp link click tracking ---------- */
  safe("WhatsApp click tracking", function () {
    document.querySelectorAll('a[href*="wa.me"]').forEach(function (link) {
      link.addEventListener("click", function () {
        trackEvent("whatsapp_click", { location: "footer" });
      });
    });
  });

  /* ---------- Contact form submission ---------- */
  safe("contact form", function () {
    var form = document.getElementById("contact-form");
    var successBox = document.getElementById("form-success");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Anti-spam: honeypot field filled in, or submitted implausibly fast
      // (real visitors take at least a couple of seconds to fill this in) —
      // both are strong bot signals. Pretend success and drop it silently.
      var honeypot = form.querySelector('[name="_honey"]');
      var submittedTooFast = Date.now() - pageLoadTime < 2500;
      if ((honeypot && honeypot.value) || submittedTooFast) {
        if (successBox) successBox.classList.add("is-visible");
        form.reset();
        return;
      }

      var data = new FormData(form);
      var submitBtn = form.querySelector("button[type=submit]");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "שולח...";
      }

      fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      })
        .then(function (res) {
          return res.json().then(function (json) {
            return { ok: res.ok, json: json };
          });
        })
        .then(function (result) {
          if (!result.ok || !result.json || result.json.success === false) {
            throw new Error((result.json && result.json.message) || "submit failed");
          }
          trackEvent("generate_lead", { method: "contact_form" });
          if (successBox) {
            successBox.classList.add("is-visible");
            successBox.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          form.reset();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "שליחת פרטים";
          }
        })
        .catch(function (err) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "שליחת פרטים";
          }
          alert("שגיאה בשליחה: " + err.message + "\nאפשר לפנות אלינו גם ב-WhatsApp.");
        });
    });
  });

  /* ---------- Cookie consent banner ---------- */
  safe("cookie banner", function () {
    var banner = document.getElementById("cookie-banner");
    var acceptBtn = document.getElementById("cookie-accept");
    if (!banner || !acceptBtn) return;

    var STORAGE_KEY = "web4b-cookie-consent";
    var alreadyAccepted = false;
    try {
      alreadyAccepted = localStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      alreadyAccepted = false;
    }

    if (!alreadyAccepted) {
      banner.classList.add("is-visible");
    }

    acceptBtn.addEventListener("click", function () {
      banner.classList.remove("is-visible");
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch (e) {
        /* ignore storage failures (private mode, etc.) */
      }
    });
  });
})();
