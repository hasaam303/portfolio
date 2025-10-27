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
const arcGenerator   = d3.arc().innerRadius(0).outerRadius(50);
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