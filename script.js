const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("[data-nav-links]");
const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll(".project-card");
const projectPanels = document.querySelectorAll("[data-project-panel]");
const ideaForm = document.querySelector("[data-idea-form]");
const ideaInput = document.querySelector("[data-idea-input]");
const ideaTrap = document.querySelector("[data-idea-trap]");
const ideaStatus = document.querySelector("[data-idea-status]");
const adminTokenForm = document.querySelector("[data-admin-token-form]");
const adminTokenInput = document.querySelector("[data-admin-token]");
const adminStatus = document.querySelector("[data-admin-status]");
const suggestionsList = document.querySelector("[data-suggestions-list]");
const recipeButton = document.querySelector("[data-random-recipe]");
const dialog = document.querySelector("[data-dialog]");
const dialogTitle = document.querySelector("[data-dialog-title]");
const closeDialog = document.querySelector("[data-close-dialog]");
const typewriter = document.querySelector("[data-typewriter]");
const artTrack = document.querySelector("[data-art-track]");
const artworkDialog = document.querySelector("[data-artwork-dialog]");
const artworkCarousel = document.querySelector("[data-artwork-carousel]");
const artworkImage = document.querySelector("[data-artwork-image]");
const artworkPrevImage = document.querySelector("[data-artwork-prev-image]");
const artworkNextImage = document.querySelector("[data-artwork-next-image]");
const artworkLabel = document.querySelector("[data-artwork-label]");
const artworkTitle = document.querySelector("[data-artwork-title]");
const artworkDimensions = document.querySelector("[data-artwork-dimensions]");
const artworkMedium = document.querySelector("[data-artwork-medium]");
const artworkDate = document.querySelector("[data-artwork-date]");
const artworkStory = document.querySelector("[data-artwork-story]");
const artworkClose = document.querySelector("[data-artwork-close]");
const artworkPrev = document.querySelector("[data-artwork-prev]");
const artworkNext = document.querySelector("[data-artwork-next]");
const artworkPreviewPrev = document.querySelector("[data-artwork-preview-prev]");
const artworkPreviewNext = document.querySelector("[data-artwork-preview-next]");
const artFilterButtons = document.querySelectorAll("[data-art-filter]");
const exploreGalleryGrid = document.querySelector(".explore-gallery-grid");
const galleryWorks = document.querySelectorAll("[data-gallery-work]");
const artworkCards = document.querySelectorAll("[data-artwork-card]");

let activeArtworkSet = [];
let activeArtworkIndex = 0;
let artworkTransitionTimer;
let artworkWheelAccumulator = 0;
let artworkWheelResetTimer;
const artworkWheelThreshold = 46;

const recipes = [
  "Chili crisp noodles with cucumber ribbons",
  "Mango chia pudding with cardamom",
  "Roasted veggie bowl with lemony yogurt",
  "Tomato soup and grilled cheese night",
  "Weekend pancakes with berries"
];

artworkCards.forEach((card) => {
  const title = card.dataset.title || card.querySelector("strong")?.textContent || "";
  const baseWidth = card.classList.contains("featured-work-card") ? 17 : 13.5;
  const width = Math.min(28, Math.max(baseWidth, 10 + title.length * 0.32));
  card.style.setProperty("--art-card-width", `${width}rem`);
});

if (exploreGalleryGrid) {
  Array.from(exploreGalleryGrid.querySelectorAll("[data-gallery-work]"))
    .sort((first, second) => (first.dataset.title || "").localeCompare(second.dataset.title || "", undefined, { sensitivity: "base" }))
    .forEach((card) => exploreGalleryGrid.append(card));
}

menuToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    navLinks.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    projectCards.forEach((card) => {
      const categories = card.dataset.category || "";
      const shouldShow = filter === "all" || categories.includes(filter);
      card.classList.toggle("hidden", !shouldShow);
    });
  });
});

projectPanels.forEach((panel) => {
  panel.addEventListener("toggle", () => {
    if (!panel.open) return;

    projectPanels.forEach((otherPanel) => {
      if (otherPanel !== panel) {
        otherPanel.open = false;
      }
    });
  });
});

const validateProjectIdea = (value) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  const blockedPattern = /<|>|&lt;|&gt;|javascript\s*:|data\s*:|on\w+\s*=/i;

  if (normalized.length < 20) {
    return { error: "Please add a little more detail before sending.", value: normalized };
  }

  if (normalized.length > 700) {
    return { error: "Please keep the idea under 700 characters.", value: normalized };
  }

  if (blockedPattern.test(normalized)) {
    return { error: "Please remove HTML, scripts, or event-handler syntax.", value: normalized };
  }

  return { error: "", value: normalized };
};

ideaForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!(ideaInput instanceof HTMLTextAreaElement) || !ideaStatus) return;

  if (ideaTrap instanceof HTMLInputElement && ideaTrap.value) {
    ideaStatus.textContent = "Submission blocked.";
    return;
  }

  const result = validateProjectIdea(ideaInput.value);

  if (result.error) {
    ideaStatus.textContent = result.error;
    ideaInput.setAttribute("aria-invalid", "true");
    return;
  }

  ideaInput.setAttribute("aria-invalid", "false");
  ideaStatus.textContent = "Sending your idea...";

  fetch("/api/suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idea: result.value,
      website: ideaTrap instanceof HTMLInputElement ? ideaTrap.value : ""
    })
  })
    .then(async (response) => {
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save suggestion.");
      }

      ideaInput.value = "";
      ideaStatus.textContent = "Thank you. Your idea was saved.";
    })
    .catch(() => {
      ideaStatus.textContent = "Backend is unavailable, so opening your email app instead.";
      const subject = encodeURIComponent("Project idea");
      const body = encodeURIComponent(`Project idea:\n\n${result.value}`);
      window.location.href = `mailto:isha060105@gmail.com?subject=${subject}&body=${body}`;
    });
});

const renderSuggestions = (suggestions) => {
  if (!suggestionsList) return;
  suggestionsList.textContent = "";

  if (!suggestions.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "form-status";
    emptyState.textContent = "No project suggestions yet.";
    suggestionsList.append(emptyState);
    return;
  }

  suggestions.forEach((suggestion) => {
    const item = document.createElement("article");
    item.className = "suggestion-item";

    const date = document.createElement("p");
    date.className = "timeline-date";
    date.textContent = new Date(suggestion.createdAt).toLocaleString();

    const idea = document.createElement("p");
    idea.textContent = suggestion.idea;

    const meta = document.createElement("small");
    meta.textContent = `ID: ${suggestion.id}`;

    item.append(date, idea, meta);
    suggestionsList.append(item);
  });
};

adminTokenForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!(adminTokenInput instanceof HTMLInputElement) || !adminStatus) return;

  const token = adminTokenInput.value.trim();
  if (!token) {
    adminStatus.textContent = "Enter your admin token.";
    return;
  }

  adminStatus.textContent = "Loading suggestions...";

  fetch("/api/suggestions", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(async (response) => {
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load suggestions.");
      }

      adminStatus.textContent = `${payload.suggestions.length} suggestion${payload.suggestions.length === 1 ? "" : "s"} loaded.`;
      renderSuggestions(payload.suggestions);
    })
    .catch((error) => {
      adminStatus.textContent = error.message;
    });
});

artFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.artFilter || "all";
    artFilterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    galleryWorks.forEach((work) => {
      const medium = work.dataset.mediumFilter || "";
      work.classList.toggle("hidden", filter !== "all" && medium !== filter);
    });
  });
});

recipeButton?.addEventListener("click", () => {
  const nextRecipe = recipes[Math.floor(Math.random() * recipes.length)];
  recipeButton.textContent = nextRecipe;
});

document.querySelectorAll("[data-gallery]").forEach((item) => {
  item.addEventListener("click", () => {
    if (!dialog || !dialogTitle) return;
    dialogTitle.textContent = item.dataset.gallery || "Gallery";
    dialog.showModal();
  });
});

closeDialog?.addEventListener("click", () => {
  dialog?.close();
});

document.querySelectorAll("[data-scroll-art]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!artTrack) return;
    const direction = button.dataset.scrollArt === "prev" ? -1 : 1;
    artTrack.scrollBy({ left: direction * artTrack.clientWidth * 0.78, behavior: "smooth" });
  });
});

const getArtworkDetails = (card) => ({
  title: card.dataset.title || "Featured artwork",
  image: card.dataset.image || "",
  dimensions: card.dataset.dimensions || "Dimensions to add",
  medium: card.dataset.medium || "Medium to add",
  date: card.dataset.date || "Completion date to add",
  story: card.dataset.story || "Inspiration and story to add."
});

const getVisibleGalleryWorks = () => Array.from(document.querySelectorAll(".explore-gallery-grid [data-gallery-work]")).filter((work) => !work.classList.contains("hidden"));

const setArtworkPreview = (image, card, fallbackAlt) => {
  if (!(image instanceof HTMLImageElement) || !card) return;
  const details = getArtworkDetails(card);
  image.src = details.image;
  image.alt = details.title || fallbackAlt;
};

const updateArtworkContent = () => {
  const card = activeArtworkSet[activeArtworkIndex];
  const details = getArtworkDetails(card);
  const prevCard = activeArtworkSet[(activeArtworkIndex - 1 + activeArtworkSet.length) % activeArtworkSet.length];
  const nextCard = activeArtworkSet[(activeArtworkIndex + 1) % activeArtworkSet.length];

  if (artworkImage instanceof HTMLImageElement) {
    artworkImage.src = details.image;
    artworkImage.alt = details.title;
  }

  setArtworkPreview(artworkPrevImage, prevCard, "Previous artwork");
  setArtworkPreview(artworkNextImage, nextCard, "Next artwork");

  if (artworkTitle) artworkTitle.textContent = details.title;
  if (artworkLabel) artworkLabel.textContent = card.matches("[data-gallery-work]") ? "Gallery" : "Featured work";
  if (artworkDimensions) artworkDimensions.textContent = details.dimensions;
  if (artworkMedium) artworkMedium.textContent = details.medium;
  if (artworkDate) artworkDate.textContent = details.date;
  if (artworkStory) artworkStory.textContent = details.story;
};

const showArtwork = (index, direction = 0) => {
  if (!activeArtworkSet.length) return;
  const nextIndex = (index + activeArtworkSet.length) % activeArtworkSet.length;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.clearTimeout(artworkTransitionTimer);

  if (!direction || !artworkCarousel || prefersReducedMotion) {
    activeArtworkIndex = nextIndex;
    updateArtworkContent();
    return;
  }

  artworkCarousel.dataset.artworkDirection = direction > 0 ? "next" : "prev";
  artworkCarousel.classList.add("is-switching");

  artworkTransitionTimer = window.setTimeout(() => {
    activeArtworkIndex = nextIndex;
    updateArtworkContent();
    window.requestAnimationFrame(() => {
      artworkCarousel.classList.remove("is-switching");
    });
  }, 140);
};

const moveArtwork = (direction) => {
  showArtwork(activeArtworkIndex + direction, direction);
};

artworkCards.forEach((card) => {
  card.addEventListener("click", () => {
    if (!(artworkDialog instanceof HTMLDialogElement)) return;
    activeArtworkSet = card.matches("[data-gallery-work]") ? getVisibleGalleryWorks() : Array.from(document.querySelectorAll("[data-art-track] [data-artwork-card]"));
    activeArtworkIndex = activeArtworkSet.indexOf(card);

    if (activeArtworkIndex < 0) {
      activeArtworkSet = Array.from(artworkCards);
      activeArtworkIndex = activeArtworkSet.indexOf(card);
    }

    showArtwork(activeArtworkIndex);
    artworkDialog.showModal();
    artworkCarousel?.focus({ preventScroll: true });
  });
});

artworkPrev?.addEventListener("click", () => moveArtwork(-1));
artworkNext?.addEventListener("click", () => moveArtwork(1));
artworkPreviewPrev?.addEventListener("click", () => moveArtwork(-1));
artworkPreviewNext?.addEventListener("click", () => moveArtwork(1));

artworkClose?.addEventListener("click", () => {
  if (artworkDialog instanceof HTMLDialogElement) {
    artworkDialog.close();
  }
});

artworkDialog?.addEventListener("click", (event) => {
  if (event.target === artworkDialog && artworkDialog instanceof HTMLDialogElement) {
    artworkDialog.close();
  }
});

artworkDialog?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveArtwork(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveArtwork(1);
  }
});

artworkDialog?.addEventListener("wheel", (event) => {
  if (!artworkDialog?.open || Math.abs(event.deltaX) + Math.abs(event.deltaY) < 18) return;
  event.preventDefault();

  const delta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  const normalizedDelta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? delta * 16 : delta;
  artworkWheelAccumulator += normalizedDelta;

  window.clearTimeout(artworkWheelResetTimer);
  artworkWheelResetTimer = window.setTimeout(() => {
    artworkWheelAccumulator = 0;
  }, 220);

  if (!artworkCarousel || Math.abs(artworkWheelAccumulator) < artworkWheelThreshold || artworkCarousel.classList.contains("is-switching")) return;

  moveArtwork(artworkWheelAccumulator > 0 ? 1 : -1);
  artworkWheelAccumulator = 0;
}, { passive: false });

if (typewriter instanceof HTMLElement) {
  const text = typewriter.dataset.typewriter || "";
  const highlightWords = new Set((typewriter.dataset.highlightWords || "").split(",").map((word) => word.trim()).filter(Boolean));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reducedMotion && text) {
    const tokens = text.match(/\w+|\s+|[^\w\s]+/g) || [];
    const typedNodes = [];
    typewriter.textContent = "";
    typewriter.classList.add("is-typing");

    tokens.forEach((token) => {
      const node = highlightWords.has(token) ? document.createElement("span") : document.createTextNode("");
      if (node instanceof HTMLElement) {
        node.className = "watermark-word";
      }
      typedNodes.push({ node, token, index: 0 });
      typewriter.append(node);
    });

    let tokenIndex = 0;

    const typeNextCharacter = () => {
      const current = typedNodes[tokenIndex];
      if (!current) {
        typewriter.classList.remove("is-typing");
        return;
      }

      current.node.textContent += current.token[current.index];
      current.index += 1;

      if (current.index >= current.token.length) {
        tokenIndex += 1;
      }

      window.setTimeout(typeNextCharacter, current.token.trim() ? 68 : 22);
    };

    window.setTimeout(typeNextCharacter, 280);
  }
}

document.addEventListener("pointerdown", (event) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const spark = document.createElement("span");
  spark.className = "spark";
  spark.style.left = `${event.clientX}px`;
  spark.style.top = `${event.clientY}px`;
  document.body.append(spark);
  spark.addEventListener("animationend", () => spark.remove());
});
