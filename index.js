import { fetchJSON, renderProjects, fetchGithubData } from './global.js';

// 3) Fetch and filter to first 3 projects
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);

// 4) Select the container on the home page
const projectsContainer = document.querySelector('.projects');

// 5) Render the latest projects
renderProjects(latestProjects, projectsContainer, 'h2');