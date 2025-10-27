import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');
const titleElement = document.querySelector('.projects-title');
if (titleElement) {
    titleElement.textContent = `${projects.length} Projects`;
  }
function renderPieChart(projectsGiven) {
  const svg    = d3.select('#projects-plot');
  const legend = d3.select('.legend');

  // a) clear previous drawing to avoid duplicates
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  // b) roll up counts by year -> [{label, value}]
  const rolled = d3.rollups(projectsGiven, v => v.length, d => String(d.year ?? 'Unknown'));
  const data   = rolled.map(([year, count]) => ({ label: year, value: count }));

  // If nothing to show, stop here
  if (data.length === 0) return;

  // c) generators/scales
  const pie   = d3.pie().value(d => d.value);
  const arcs  = pie(data);
  const arc   = d3.arc().innerRadius(0).outerRadius(35); // adjust radius to taste
  const color = d3.scaleOrdinal(d3.schemeTableau10);

  // d) draw slices
  svg.selectAll('path')
    .data(arcs)
    .join('path')
    .attr('d', arc)
    .attr('fill', (d, i) => color(i));

  // e) draw legend
  legend.selectAll('li')
    .data(data)
    .join('li')
    .attr('class', 'legend-item')
    .attr('style', (d, i) => `--color:${color(i)}`)
    .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
}

// 2) Initial render on page load
renderPieChart(projects);

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
  renderProjects(filtered, projectsContainer, 'h2');
  renderPieChart(filtered);
});