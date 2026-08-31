const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("[data-nav-links]");
const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll(".project-card");
const recipeButton = document.querySelector("[data-random-recipe]");
const dialog = document.querySelector("[data-dialog]");
const dialogTitle = document.querySelector("[data-dialog-title]");
const closeDialog = document.querySelector("[data-close-dialog]");
const typewriter = document.querySelector("[data-typewriter]");
const artTrack = document.querySelector("[data-art-track]");
const artworkDialog = document.querySelector("[data-artwork-dialog]");
const artworkImage = document.querySelector("[data-artwork-image]");
const artworkTitle = document.querySelector("[data-artwork-title]");
const artworkDimensions = document.querySelector("[data-artwork-dimensions]");
const artworkMedium = document.querySelector("[data-artwork-medium]");
const artworkDate = document.querySelector("[data-artwork-date]");
const artworkStory = document.querySelector("[data-artwork-story]");
const artworkClose = document.querySelector("[data-artwork-close]");
const artFilterButtons = document.querySelectorAll("[data-art-filter]");
const galleryWorks = document.querySelectorAll("[data-gallery-work]");

const recipes = [
  "Chili crisp noodles with cucumber ribbons",
  "Mango chia pudding with cardamom",
  "Roasted veggie bowl with lemony yogurt",
  "Tomato soup and grilled cheese night",
  "Weekend pancakes with berries"
];

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

document.querySelectorAll("[data-artwork-card]").forEach((card) => {
  card.addEventListener("click", () => {
    if (!(artworkDialog instanceof HTMLDialogElement)) return;
    const details = card.dataset;

    if (artworkImage instanceof HTMLImageElement) {
      artworkImage.src = details.image || "";
      artworkImage.alt = details.title || "Featured artwork";
    }

    if (artworkTitle) artworkTitle.textContent = details.title || "Featured artwork";
    if (artworkDimensions) artworkDimensions.textContent = details.dimensions || "Dimensions to add";
    if (artworkMedium) artworkMedium.textContent = details.medium || "Medium to add";
    if (artworkDate) artworkDate.textContent = details.date || "Completion date to add";
    if (artworkStory) artworkStory.textContent = details.story || "Inspiration and story to add.";

    artworkDialog.showModal();
  });
});

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
