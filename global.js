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
  { url: "meta/", title: "Meta" },
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

const themeSelect = document.querySelector("#theme-switch");

// Define a helper function to avoid repeating code
function setColorScheme(scheme) {
  document.documentElement.style.colorScheme = scheme; // actually apply it
  localStorage.colorScheme = scheme; // save user preference
  themeSelect.value = scheme; // sync dropdown UI
}

// When the user changes the dropdown
themeSelect?.addEventListener("change", (e) => {
  setColorScheme(e.target.value);
});

// When the page loads, check if a saved preference exists
if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
} else {
  setColorScheme("light dark"); // default (automatic)
}

export async function fetchJSON(url) {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    return []; // fail-safe so the page still renders an empty state
  }
}

const esc = (s) => String(s ?? '')
.replaceAll('&','&amp;')
.replaceAll('<','&lt;')
.replaceAll('>','&gt;')
.replaceAll('"','&quot;')
.replaceAll("'",'&#39;');

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Guards
  if (!(containerElement instanceof Element)) {
    console.error('renderProjects: invalid containerElement');
    return;
  }
  if (!Array.isArray(projects)) projects = [];

  const validHeadings = new Set(['h1','h2','h3','h4','h5','h6']);
  if (!validHeadings.has(headingLevel)) headingLevel = 'h2';

  // 2) Clear existing content to avoid duplicates
  containerElement.innerHTML = '';

  // Empty state
  if (projects.length === 0) {
    containerElement.innerHTML = '<p class="muted">No projects available at the moment.</p>';
    return;
  }
  // 3–5) Create each <article>, set content, append
  for (const p of projects) {
    const article = document.createElement('article');
    const title = esc(p?.title || 'Untitled project');
    const img   = p?.image || '';
    const desc  = esc(p?.description || '');

  article.innerHTML = `
    <${headingLevel}>${title}</${headingLevel}>
    ${img ? `<img src="${img}" alt="${title}">` : ''}
    <div>
      ${desc ? `<p>${desc}</p>` : ''}
      ${p.year ? `<p class="project-year">c. ${p.year}</p>` : ''}
    </div>
  `;
    containerElement.appendChild(article);
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}