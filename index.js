import { fetchJSON, renderProjects, fetchGitHubData} from './global.js';

// 3) Fetch and filter to first 3 projects
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);

// 4) Select the container on the home page
const projectsContainer = document.querySelector('.projects');

// 5) Render the latest projects
renderProjects(latestProjects, projectsContainer, 'h2');

const githubData = await fetchGitHubData('hasaam303');
console.log(githubData);
const profileStats = document.querySelector('#profile-stats');

// If it exists and the data loaded, fill it with your GitHub info
if (profileStats && githubData) {
  profileStats.innerHTML = `
    <dl class="gh-stats">
      <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
      <dt>Following:</dt><dd>${githubData.following}</dd>
    </dl>
  `;
}