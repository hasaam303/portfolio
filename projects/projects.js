import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');
const titleElement = document.querySelector('.projects-title');
if (titleElement) {
    titleElement.textContent = `${projects.length} Projects`;
  }
const rolledData = d3.rollups(
  projects,
  v => v.length,       // count per bucket
  d => d.year ?? 'Unknown'
);
// Convert to the shape the pie expects
const data = rolledData.map(([year, count]) => ({ value: count, label: String(year) }));

// 3) Generators and scales
const sliceGenerator = d3.pie().value(d => d.value);
const arcGenerator   = d3.arc().innerRadius(0).outerRadius(35);
const colors         = d3.scaleOrdinal(d3.schemeTableau10);

// 4) Draw pie
const svg = d3.select('#projects-plot');
svg.selectAll('*').remove(); // clear previous drawings on reload

svg
  .selectAll('path')
  .data(sliceGenerator(data))
  .join('path')
  .attr('d', arcGenerator)
  .attr('fill', (d, i) => colors(i));

// ====== LEGEND ======
const legend = d3.select('.legend');
legend.selectAll('*').remove();

legend
  .selectAll('li')
  .data(data)
  .join('li')
  .attr('class', 'legend-item')
  .attr('style', (d, i) => `--color:${colors(i)}`)
  .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);

let query = '';
const searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  // Update query value
  query = event.target.value.toLowerCase();

  // Filter across all project fields (title, description, year, etc.)
  const filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query);
  });

  // Render filtered projects
  renderProjects(filteredProjects, projectsContainer, 'h2');

  // ====== Update Pie Chart ======
  const rolledData = d3.rollups(filteredProjects, (v) => v.length, (d) => d.year);
  const data = rolledData.map(([year, count]) => ({ value: count, label: year }));

  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);

  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(35);

  // Clear old chart
  d3.select('#projects-plot').selectAll('*').remove();

  // Draw updated slices
  d3.select('#projects-plot')
    .selectAll('path')
    .data(arcData)
    .join('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => colors(i));

  // Update legend
  const legend = d3.select('.legend');
  legend.selectAll('*').remove();

  legend
    .selectAll('li')
    .data(data)
    .join('li')
    .attr('class', 'legend-item')
    .attr('style', (d, i) => `--color:${colors(i)}`)
    .html((d) => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});