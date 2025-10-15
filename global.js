console.log('IT’S ALIVE!');
/*
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
console.log("IT'S ALIVE!");

// Select all <a> tags inside <nav>
const navLinks = $$("nav a");

console.log(navLinks); 

if (currentLink) {
  currentLink.classList.add("current");
}

currentLink?.classList.add("current");
*/

// Define the pages for your navigation
document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select id="theme-switch">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "Resume/", title: "Resume" },
  { url: "https://github.com/hasaam303", title: "GitHub" }
];

// Detect if running locally or on GitHub Pages
const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/" // local testing
    : "/portfolio/"; // your GitHub repo name

// Create a <nav> element and insert it at the top of <body>
let nav = document.createElement("nav");
document.body.prepend(nav);

// Add links dynamically
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Prefix BASE_PATH if it's an internal (non-http) link
  if (!url.startsWith("http")) {
    url = BASE_PATH + url;
  }

  // Add the link to the nav
  // nav.insertAdjacentHTML("beforeend", `<a href="${url}">${title}</a>`);
  const a = document.createElement("a");
  a.href = url;
  a.textContent = title;

  // Highlight the current page link
  // (same check you used before)

  // Open external links in a new tab
  if (a.host !== location.host) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    // OR: a.toggleAttribute("target", true); a.setAttribute("rel","noopener noreferrer");
  }

  // Add to the nav
  nav.append(a);

}

// Highlight the current page link automatically
const navLinks = Array.from(document.querySelectorAll("nav a"));
let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);
currentLink?.classList.add("current");