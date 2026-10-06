(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Smooth in-page navigation ----
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;

    link.addEventListener("click", (event) => {
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", hash);
    });
  });

  // ---- Back to Top Button ----
  const backToTopBtn = document.getElementById("backToTopBtn");
  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  // ---- Color wheel: pick a color and the site's accent becomes that color ----
  const INK = "#111111";
  const PAPER = "#fffef8";

  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  const inkFor = (hex) => (contrast(hex, INK) >= contrast(hex, PAPER) ? INK : PAPER);

  const setAccent = (hex) => {
    root.style.setProperty("--accent", hex);
    root.style.setProperty("--accent-ink", inkFor(hex));
  };

  const celebrate = (dot) => {
    if (reduceMotion || !dot.animate) return;

    dot.animate(
      [{ scale: "1" }, { scale: ".86", offset: 0.25 }, { scale: "1.08", offset: 0.6 }, { scale: "1" }],
      { duration: 480, easing: "ease-out" }
    );

    const ripple = document.createElement("span");
    ripple.className = "wheel__ripple";
    ripple.setAttribute("aria-hidden", "true");
    dot.appendChild(ripple);
    ripple
      .animate(
        [{ transform: "scale(1)", opacity: 0.8 }, { transform: "scale(1.9)", opacity: 0 }],
        { duration: 650, easing: "ease-out" }
      )
      .onfinish = () => ripple.remove();

    document.querySelectorAll(".btn:not(.btn--dark)").forEach((btn, i) => {
      btn.animate([{ scale: "1" }, { scale: "1.08" }, { scale: "1" }], {
        duration: 360,
        delay: i * 40,
        easing: "ease-out",
      });
    });
  };

  const dots = [...document.querySelectorAll(".wheel__dot")];
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      if (dot.getAttribute("aria-pressed") === "true") return;
      dots.forEach((d) => d.setAttribute("aria-pressed", String(d === dot)));
      setAccent(dot.dataset.color);
      celebrate(dot);
    });
  });

  // ---- Anatomy Hotspots Interactivity ----
  const hotspotData = {
    "1": {
      title: "Sturdy kiosk barrier",
      desc: "A barrier to the left of the kiosk establishes a clearer walkway for both passing-by customers as well as machinery. It also makes it easier to align multiple kiosks together for especially large or busy stores."
    },
    "2": {
      title: "Large adjustable touchscreen",
      desc: "The touchscreen is 24\" diagonally, and can rotate up and down within a 90 degree range, allowing shoppers of varied heights and physical capabilities to comfortably interact with it."
    },
    "3": {
      title: "Movable chair",
      desc: "A chair is available for shoppers to sit down, relax, and take their time putting together the pieces of their paint project. This chair can also be easily moved out of the way for wheelchair users."
    },
    "4": {
      title: "Receipt printer",
      desc: "Upon finishing an order, the contents of that order can be printed out on a paper receipt. Its close range to the shopper ensures that they won't forget to grab their receipt before standing up."
    }
  };

  const hotspots = document.querySelectorAll(".cs-hotspot");
  const hotspotTitle = document.getElementById("hotspotTitle");
  const hotspotDesc = document.getElementById("hotspotDesc");
  const hotspotCard = document.getElementById("hotspotCard");

  if (hotspots.length && hotspotTitle && hotspotDesc) {
    hotspots.forEach((spot) => {
      spot.addEventListener("click", () => {
        const id = spot.dataset.hotspot;
        const data = hotspotData[id];
        if (!data) return;

        hotspots.forEach((s) => s.classList.remove("is-active"));
        spot.classList.add("is-active");

        if (hotspotCard) {
          hotspotCard.style.opacity = "0";
          hotspotCard.style.transform = "translateY(6px)";
          setTimeout(() => {
            hotspotTitle.textContent = data.title;
            hotspotDesc.textContent = data.desc;
            hotspotCard.style.opacity = "1";
            hotspotCard.style.transform = "none";
          }, 140);
        } else {
          hotspotTitle.textContent = data.title;
          hotspotDesc.textContent = data.desc;
        }
      });
    });
  }

  // ---- Scroll reveal ----
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 2) * 120}ms`;
      observer.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // ---- External links ----
  const LINKS = {
    linkedin: "https://www.linkedin.com/",
    email: "mailto:kiera@example.com",
    resume: "assets/resume.pdf",
  };

  document.querySelectorAll("[data-link]").forEach((el) => {
    const href = LINKS[el.dataset.link];
    if (href) {
      el.setAttribute("href", href);
      if (/^https?:/.test(href)) {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
    } else {
      el.addEventListener("click", (event) => event.preventDefault());
    }
  });
})();