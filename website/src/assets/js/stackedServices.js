export function initStackedServices() {
  const section = document.querySelector(".stacked-services");

  if (!section) return;

  const cards = [...section.querySelectorAll(".service-card")];

  if (cards.length === 0) return;


  cards.forEach((card) => {

    card.addEventListener("click", () => {

      // Already open → do nothing
      if (card.classList.contains("is-active")) {
        return;
      }


      // Close every other card
      cards.forEach((otherCard) => {
        otherCard.classList.remove("is-active");
      });


      // Open clicked card
      card.classList.add("is-active");
    });

  });
}