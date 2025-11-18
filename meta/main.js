import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// start of lab 5
let xScale;
let yScale;

async function loadData() {
  // Load and convert numeric/date fields
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      const { author, date, time, timezone, datetime } = first;

      const ret = {
        id: commit,
        url: 'https://github.com/hasaam303/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      // Hide raw lines but keep them accessible for later use
      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: false,
        enumerable: false,
        configurable: false,
      });

      return ret;
    });
}

let data = await loadData();
let commits = processCommits(data);

// ---------- Slider + time scale ----------

let commitProgress = 100;

// maps datetime -> 0–100
const timeScale = d3
  .scaleTime()
  .domain(d3.extent(commits, (d) => d.datetime))
  .range([0, 100]);

// maps 0–100 -> datetime
let commitMaxTime = timeScale.invert(commitProgress);

// Will get updated as user changes slider
let filteredCommits = commits;

function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');
  const timeEl = document.getElementById('commit-time');

  commitProgress = +slider.value;
  commitMaxTime = timeScale.invert(commitProgress);

  timeEl.textContent = commitMaxTime.toLocaleString('en', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  // update filtered commits
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  // update scatter plot + files section
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
}

// ---------- Stats + tooltip helpers ----------

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // total lines of code
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // number of distinct files
  const numFiles = d3.groups(data, (d) => d.file).length;
  dl.append('dt').text('Number of files');
  dl.append('dd').text(numFiles);

  // average file length
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (d) => d.line),
    (d) => d.file,
  );
  const avgFileLength = d3.mean(fileLengths, (d) => d[1]);
  dl.append('dt').text('Average file length');
  dl.append('dd').text(avgFileLength.toFixed(1));

  // longest line (in characters)
  const longestLineRow = d3.greatest(data, (d) => d.length);
  dl.append('dt').text('Longest line');
  dl.append('dd').text(
    longestLineRow
      ? `${longestLineRow.length} chars in ${longestLineRow.file}:${longestLineRow.line}`
      : '—',
  );

  // day of week most work is done
  const workByDay = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { weekday: 'long' }),
  );
  const busiestDay = d3.greatest(workByDay, (d) => d[1])?.[0];
  dl.append('dt').text('Day with most work');
  dl.append('dd').text(busiestDay);
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time-tooltip');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;

  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });

  time.textContent = commit.datetime?.toLocaleTimeString('en', {
    timeStyle: 'short',
  });
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function createBrushSelector(svg) {
  svg.call(d3.brush()); // you can drag a rectangle now
}

function isCommitSelected(selection, commit) {
  if (!selection) return false; // nothing selected
  const [[x0, y0], [x1, y1]] = selection; // top-left & bottom-right in SVG coords
  const x = xScale(commit.datetime); // commit → SVG x
  const y = yScale(commit.hourFrac); // commit → SVG y
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function brushed(event) {
  const selection = event.selection; // null when cleared
  d3.selectAll('.dots circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;

  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

// ---------- Initial scatter plot ----------

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // Gridlines
  svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis') // mark x-axis group
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis')
    .call(yAxis);

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  const brush = d3
    .brush()
    .extent([
      [usableArea.left, usableArea.top],
      [usableArea.right, usableArea.bottom],
    ])
    .on('start brush end', brushed);

  svg.append('g').attr('class', 'brush').call(brush);

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  const dotsG = svg.append('g').attr('class', 'dots');

  dotsG
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

// ---------- UPDATE scatter plot when slider changes ----------

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  // update x domain based on filtered commits
  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  // clear + redraw x-axis
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

// ---------- Initial render + slider hook-up ----------

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

// hook the slider AFTER initial plot exists
const timeSlider = document.getElementById('commit-progress');
timeSlider.addEventListener('input', onTimeSliderChange);
onTimeSliderChange(); 

function updateFileDisplay(filteredCommits) {
  // Flatten all lines from the current set of commits
  const lines = filteredCommits.flatMap((d) => d.lines);

  // Group lines by file name
  const files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => ({ name, lines }));

  // Bind data to <div> children of #files, keyed by file name
  const filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join(
      (enter) =>
        enter.append('div').call((div) => {
          div.append('dt');
          div.append('dd');
        }),
    );

  // dt: show filename + total lines as a small label
  filesContainer
    .select('dt')
    .html((d) => `
      <code>${d.name}</code>
      <small>${d.lines.length} lines</small>
    `);

  // dd: one .loc div per line
  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc');
}
