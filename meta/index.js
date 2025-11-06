import "../global.js";

// Once the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Create the main content wrapper
  const main = document.createElement("main");
  main.innerHTML = `
    <h1>Meta</h1>
    <p>This page includes stats about the code of this website.</p>
  `;
  document.body.appendChild(main);
});