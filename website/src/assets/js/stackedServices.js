export function initStackedServices() {
  const section = document.querySelector(".stacked-services");

  if (!section) return;

  const cards = [...section.querySelectorAll(".service-card")];

  if (cards.length === 0) return;


  const setOpen = (card, open) => {
    card.classList.toggle("is-active", open);
    card.querySelector(".service-card__toggle")?.setAttribute("aria-expanded", String(open));
  };


  cards.forEach((card) => {

    const toggle = card.querySelector(".service-card__toggle");

    // Title row: opens a closed card, closes an open one.
    toggle?.addEventListener("click", (event) => {
      event.stopPropagation();

      const wasOpen = card.classList.contains("is-active");

      cards.forEach((otherCard) => setOpen(otherCard, false));

      if (!wasOpen) setOpen(card, true);
    });


    // Anywhere else on a closed card also opens it.
    // Clicks inside an open card's text do nothing, so reading never closes it.
    card.addEventListener("click", () => {
      if (card.classList.contains("is-active")) return;

      cards.forEach((otherCard) => setOpen(otherCard, false));
      setOpen(card, true);
    });

  });
}
