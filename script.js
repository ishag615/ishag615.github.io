const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("[data-nav-links]");
const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll(".project-card");
const recipeButton = document.querySelector("[data-random-recipe]");
const dialog = document.querySelector("[data-dialog]");
const dialogTitle = document.querySelector("[data-dialog-title]");
const closeDialog = document.querySelector("[data-close-dialog]");

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

document.addEventListener("pointerdown", (event) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const spark = document.createElement("span");
  spark.className = "spark";
  spark.style.left = `${event.clientX}px`;
  spark.style.top = `${event.clientY}px`;
  document.body.append(spark);
  spark.addEventListener("animationend", () => spark.remove());
});
