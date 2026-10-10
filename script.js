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

  // ---- Color wheel calculation & accent color switching ----
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

  // Map color names to their corresponding hex values (for contrast calculations)
  const colorHexMap = {
    red: "#d33333",
    orange: "#ff9137",
    yellow: "#ffd900",
    green: "#6dd03b",
    blue: "#4183e7",
    purple: "#902dd2"
  };

  const setAccent = (colorKey) => {
    if (colorHexMap[colorKey]) {
      // Assign CSS custom variable reference (e.g., var(--red))
      root.style.setProperty("--accent", `var(--${colorKey})`);
      root.style.setProperty("--accent-ink", inkFor(colorHexMap[colorKey]));
    } else {
      // Fallback if a raw hex code or unknown key is passed
      root.style.setProperty("--accent", colorKey);
      root.style.setProperty("--accent-ink", inkFor(colorKey));
    }
  };

  // ---- Center Image Switcher & Mapping ----
  const centerImg = document.getElementById("wheelCenterImg");

  const sectorImageMap = {
    red: "siteAssets/patches.png",
    orange: "siteAssets/trevor.png",
    yellow: "siteAssets/marshmallow.png",
    green: "siteAssets/goobus.png",
    blue: "siteAssets/steven.png",
    purple: "siteAssets/serotonincat.png",
  };

  const updateCenterImage = (imageSrc, altText) => {
    if (!centerImg || !imageSrc) return;

    centerImg.style.opacity = "0";
    centerImg.style.transform = "scale(0.88)";

    setTimeout(() => {
      centerImg.src = imageSrc;
      centerImg.alt = altText ? `${altText} preview visual` : "Selected accent preview";
      centerImg.style.opacity = "1";
      centerImg.style.transform = "scale(1)";
    }, 180);
  };

  // ---- Wheel Rotation Controls ----
  const wheelSvg = document.querySelector(".wheel__svg");
  const wheelRing = document.querySelector(".wheel__ring");

  if (wheelSvg && wheelRing) {
    // Pause rotation when entering any sector path
    wheelSvg.addEventListener("mouseover", (e) => {
      if (e.target.classList.contains("wheel__sector")) {
        wheelRing.style.animationPlayState = "paused";
      }
    });

    // Resume rotation when leaving all sector paths (moving into donut hole or outside wheel)
    wheelSvg.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget || !e.relatedTarget.classList.contains("wheel__sector")) {
        wheelRing.style.animationPlayState = "running";
      }
    });
  }

  // ---- Frame 51 Donut Wheel Sector Interactivity ----
  const celebrate = (sector) => {
    if (reduceMotion || !sector || !sector.animate) return;

    sector.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.12)" },
        { transform: "scale(1)" }
      ],
      { duration: 320, easing: "cubic-bezier(0.9, 0.3, 0.9, 1)" }
    );

    document.querySelectorAll(".btn:not(.btn--dark)").forEach((btn, i) => {
      btn.animate([{ scale: "1" }, { scale: "1.08" }, { scale: "1" }], {
        duration: 360,
        delay: i * 40,
        easing: "ease-out",
      });
    });
  };

// ---- Tagline Verb Mapping ----
  const taglineVerbMap = {
    yellow: "listen to",
    green: "meet",
    blue: "celebrate",
    purple: "understand",
    red: "respect",
    orange: "appreciate"
  };

  const heroUnderline = document.querySelector(".hero u");
  const sectors = document.querySelectorAll(".wheel__sector");
  const bgPatternContainer = document.querySelector(".bg-pattern");

  // Automatically generate strip elements if missing from HTML
  if (bgPatternContainer && bgPatternContainer.children.length === 0) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 10; i++) {
      const strip = document.createElement("div");
      strip.className = "bg-pattern__strip";
      strip.style.setProperty("--i", i);
      fragment.appendChild(strip);
    }
    bgPatternContainer.appendChild(fragment);
  }

  sectors.forEach((sector) => {
    const handleSelect = () => {
      if (sector.getAttribute("aria-pressed") === "true") return;

      sectors.forEach((s) => s.setAttribute("aria-pressed", "false"));
      sector.setAttribute("aria-pressed", "true");

      // Bring selected sector to top of SVG layer stack
      if (sector.parentNode) {
        sector.parentNode.appendChild(sector);
      }

      const color = sector.dataset.color;
      const imageSrc = sector.dataset.image || sectorImageMap[color];
      const label = sector.getAttribute("aria-label");

      // Update hero tagline verb based on selected sector
      if (color && taglineVerbMap[color] && heroUnderline) {
        heroUnderline.textContent = taglineVerbMap[color];
      }

      // Update background pattern with staggered exit and entrance
      if (color) {
        setAccent(color);

        if (bgPatternContainer && !reduceMotion) {
          // 1. Clear existing pattern (top to bottom)
          bgPatternContainer.classList.remove("is-entering");
          bgPatternContainer.classList.add("is-exiting");

          const exitDuration = 10 * 32 + 250; // 570ms total exit
          const pauseDelay = 80;               // Brief pause before entrance

          setTimeout(() => {
            // 2. Switch dataset pattern while clear
            document.body.dataset.pattern = color;
            bgPatternContainer.classList.remove("is-exiting");

            // Force reflow for animation reset
            void bgPatternContainer.offsetWidth;

            // 3. Reveal new pattern (top to bottom)
            bgPatternContainer.classList.add("is-entering");

            const enterDuration = 10 * 32 + 280;
            setTimeout(() => {
              bgPatternContainer.classList.remove("is-entering");
            }, enterDuration);
          }, exitDuration + pauseDelay);
        } else {
          document.body.dataset.pattern = color;
        }
      }

      if (imageSrc) updateCenterImage(imageSrc, label);
      celebrate(sector);
      triggerRipple(sector);

      if (wheelRing) {
        wheelRing.style.animationPlayState = "running";
      }
    };

    sector.addEventListener("click", handleSelect);
    sector.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSelect();
      }
    });
  });

  // ---- Slowed Sector-Specific Ripple Burst ----
  // Helper to extract ONLY the outer arc portion from a sector's 'd' path attribute
  const getArcOnlyPath = (sector) => {
    const d = sector.getAttribute("d");
    if (!d) return null;

    // Matches the start coordinate right before the Arc command (A) and the Arc command itself
    const match = d.match(/(?:[ML]\s*([\d.-]+)[,\s]+([\d.-]+))\s*(A[\d\.\-\s,]+?)(?=[ZzLmM]|$)/i);
    if (match) {
      return `M ${match[1]} ${match[2]} ${match[3]}`;
    }

    return d; // Fallback to full path if pattern isn't recognized
  };

  // ---- Slowed Arc-Only Ripple Burst ----
  const triggerRipple = (sector) => {
    if (reduceMotion || !sector) return;

    const svg = sector.closest("svg");
    if (!svg) return;

    const arcD = getArcOnlyPath(sector);
    if (!arcD) return;

    const color = sector.getAttribute("fill") || sector.dataset.color || "var(--accent)";

    // Group container for ripple elements
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("pointer-events", "none");

    // Selected color arc
    const colorRipple = document.createElementNS("http://www.w3.org/2000/svg", "path");
    colorRipple.setAttribute("d", arcD);
    colorRipple.setAttribute("fill", "none");
    colorRipple.setAttribute("stroke", color);
    colorRipple.setAttribute("stroke-linecap", "round");
    colorRipple.setAttribute("class", "wheel__ripple-sector");

    group.appendChild(colorRipple);
    svg.appendChild(group);

    // Slowed-down animation parameters (1.4 seconds)
    const duration = 1400;
    const easing = "cubic-bezier(0.12, 0.8, 0.25, 1)";

    if (colorRipple.animate) {

      colorRipple.animate(
        [
          //{ transform: "scale(1)", strokeWidth: "10px", opacity: "1" },
          { transform: "scale(1.3)", strokeWidth: "2px", opacity: "0" }
        ],
        { duration, easing, fill: "forwards" }
      );
    }

    // Clean up DOM element after animation ends
    setTimeout(() => group.remove(), duration + 100);
  };

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
