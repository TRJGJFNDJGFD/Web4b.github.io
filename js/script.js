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

  /* ---------- Plan recommender quiz ---------- */
  safe("plan recommender quiz", function () {
    var toggleBtn = document.getElementById("quiz-toggle");
    var quizBox = document.getElementById("plan-quiz");
    if (toggleBtn && quizBox) {
      toggleBtn.addEventListener("click", function () {
        var willShow = quizBox.hidden;
        quizBox.hidden = !willShow;
        toggleBtn.setAttribute("aria-expanded", String(willShow));
      });
    }

    var submitBtn = document.getElementById("quiz-submit");
    var resultBox = document.getElementById("quiz-result");
    var pagesSelect = document.getElementById("quiz-pages");
    var domainSelect = document.getElementById("quiz-domain");
    var designSelect = document.getElementById("quiz-design");
    var storeSelect = document.getElementById("quiz-store");
    var bookingSelect = document.getElementById("quiz-booking");
    var updatesSelect = document.getElementById("quiz-updates");
    if (
      !submitBtn ||
      !resultBox ||
      !pagesSelect ||
      !domainSelect ||
      !designSelect ||
      !storeSelect ||
      !bookingSelect ||
      !updatesSelect
    ) {
      return;
    }

    submitBtn.addEventListener("click", function () {
      var pages = pagesSelect.value;
      var domain = domainSelect.value;
      var design = designSelect.value;
      var store = storeSelect.value;
      var booking = bookingSelect.value;
      var updates = updatesSelect.value;

      var plan;
      if (store === "yes") {
        plan = "Elite";
      } else if (booking === "yes") {
        plan = "Prime";
      } else if (updates === "yes") {
        plan = "Prime";
      } else if (design === "full" || pages === "10") {
        plan = "Premium";
      } else if (domain === "yes" || pages === "7") {
        plan = "Pro";
      } else if (pages === "4") {
        plan = "Business";
      } else {
        plan = "Starter";
      }

      trackEvent("plan_quiz_result", { recommended_plan: plan });

      resultBox.hidden = false;
      resultBox.innerHTML = "ההמלצה שלנו: <strong>" + plan + "</strong>";

      document.querySelectorAll(".price-card.is-recommended").forEach(function (card) {
        card.classList.remove("is-recommended");
      });

      var chosenBtn = document.querySelector('[data-plan="' + plan + '"]');
      var card = chosenBtn && chosenBtn.closest(".price-card");
      if (card) {
        card.classList.add("is-recommended");
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
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
