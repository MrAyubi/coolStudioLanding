// const light = document.querySelector('.cursor-light');
// const black_box_area = document.querySelector('.black-box');
// let targetX = 0;
// let targetY = 0;

// document.addEventListener('mousemove', (e) => {
//   targetX = (e.clientX) - 150;
//   targetY = (e.clientY) - 150;
// });

// function animate() {
//   light.style.transform = `translate(${targetX}px, ${targetY}px)`;
//   requestAnimationFrame(animate);
// }

// animate();

// const box = document.querySelector('.black-box');
// const cursor = box.querySelector('.cursor-light');

// const size = 300;

// box.addEventListener('mousemove', (e) => {
//   const rect = box.getBoundingClientRect();

//   const x = e.clientX - rect.left - size / 2;
//   const y = e.clientY - rect.top - size / 2;

//   cursor.style.transform = `translate(${x}px, ${y}px)`;
//   cursor.style.opacity = '1';
// });

// box.addEventListener('mouseleave', () => {
//   cursor.style.opacity = '0';
// });
