import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const projects = await fetchJSON('../lib/projects.json');
let currentList = projects; // base list that the pie chart works with

const projectsContainer = document.querySelector('.projects');
let selectedIndex = -1; // -1 means “no selection”
renderProjects(projects, projectsContainer, 'h2');
const titleElement = document.querySelector('.projects-title');
if (titleElement) {
    titleElement.textContent = `${projects.length} Projects`;
  }
function renderPieChart(projectsGiven) {
  const svg    = d3.select('#projects-plot');
  const legend = d3.select('.legend');

  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  const rolled = d3.rollups(
    projectsGiven,
    v => v.length,
    d => String(d.year ?? 'Unknown'),
  );
  const data = rolled.map(([year, count]) => ({ label: year, value: count }));
  if (data.length === 0) return;

  const pie   = d3.pie().value(d => d.value);
  const arcs  = pie(data);
  const arc   = d3.arc().innerRadius(0).outerRadius(35);
  const color = d3.scaleOrdinal(d3.schemeTableau10);

  // --- WEDGES ---
  svg.selectAll('path')
    .data(arcs)
    .join('path')
      .attr('d', arc)
      .attr('fill', (d, i) => color(i))
      .attr('class', (d, i) => (i === selectedIndex ? 'selected' : null))
      .on('click', (_, dObj) => {
        const i = arcs.indexOf(dObj);
        selectedIndex = (selectedIndex === i) ? -1 : i;

        // update styling
        svg.selectAll('path')
          .attr('class', (d2, idx) => (idx === selectedIndex ? 'selected' : null));
        legend.selectAll('li')
          .attr('class', (d2, idx) => `legend-item${idx === selectedIndex ? ' selected' : ''}`);

        // FILTER LIST (wedge click)
        const visible = (selectedIndex === -1)
          ? projectsGiven
          : projectsGiven.filter(p => String(p.year ?? 'Unknown') === data[selectedIndex].label);
        renderProjects(visible, projectsContainer, 'h2');
        const titleEl = document.querySelector('.projects-title');
        if (titleEl) titleEl.textContent = `${visible.length} Projects`;
      });

  // --- LEGEND ---
  legend.selectAll('li')
    .data(data)
    .join('li')
      .attr('class', (d, i) => `legend-item${i === selectedIndex ? ' selected' : ''}`)
      .attr('style', (d, i) => `--color:${color(i)}`)
      .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', (_, dObj) => {
        const i = data.indexOf(dObj);
        selectedIndex = (selectedIndex === i) ? -1 : i;

        // sync styling
        legend.selectAll('li')
          .attr('class', (d2, idx) => `legend-item${idx === selectedIndex ? ' selected' : ''}`);
        svg.selectAll('path')
          .attr('class', (d2, idx) => (idx === selectedIndex ? 'selected' : null));

        // FILTER LIST (legend click)
        const visible = (selectedIndex === -1)
          ? projectsGiven
          : projectsGiven.filter(p => String(p.year ?? 'Unknown') === data[selectedIndex].label);
        renderProjects(visible, projectsContainer, 'h2');
        const titleEl = document.querySelector('.projects-title');
        if (titleEl) titleEl.textContent = `${visible.length} Projects`;
      });
}

// 2) Initial render on page load
renderPieChart(currentList);


// 3) Search: filter visible projects and re-render both list + pie
let query = '';
const searchInput = document.querySelector('.searchBar');

function setQuery(q) {
  query = String(q ?? '').toLowerCase();
  return projects.filter(p =>
    Object.values(p).join('\n').toLowerCase().includes(query)
  );
}

// Use 'change' per the instructions; switch to 'input' if you want live typing
searchInput?.addEventListener('change', (event) => {
  const filtered = setQuery(event.target.value);
  currentList = filtered;      // update base list
  selectedIndex = -1;          // clear any pie selection
  renderProjects(filtered, projectsContainer, 'h2');
  renderPieChart(currentList); // redraw pie and legend
});
