// WHITE HAT — Small Multiples
function drawWhiteHat({ YEARS, REGIONS, F, M }) {
  const PW = 268,
    PH = 214;
  const mg = { top: 28, right: 14, bottom: 56, left: 40 };
  const iW = PW - mg.left - mg.right;
  const iH = PH - mg.top - mg.bottom;

  const xSc = d3.scaleLinear().domain([1990, 2017]).range([0, iW]);
  const ySc = d3.scaleLinear().domain([0, 90]).range([iH, 0]);

  const tip = d3.select("#tooltip");
  const bisect = d3.bisector((d) => d).left;

  // Shared state: crosshair lines + click-to-focus
  const crosshairLines = new Map();
  const cardEls = new Map();
  let activePanelReg = null;
  let panelIdx = 0;

  REGIONS.forEach((reg) => {
    const card = d3
      .select("#wh-grid")
      .append("div")
      .attr("class", "panel-card");
    cardEls.set(reg, card);

    const svg = card
      .append("svg")
      .attr("viewBox", `0 0 ${PW} ${PH}`)
      .attr("width", "100%")
      .attr("height", "auto")
      .style("display", "block");

    const g = svg
      .append("g")
      .attr("transform", `translate(${mg.left},${mg.top})`);

    g.append("g")
      .attr("class", "gridlines")
      .call(d3.axisLeft(ySc).ticks(4).tickSize(-iW).tickFormat(""));

    g.append("path")
      .datum(YEARS)
      .attr("fill", "#EA580C")
      .attr("opacity", 0.18)
      .attr(
        "d",
        d3
          .area()
          .x((yr) => xSc(yr))
          .y0((yr, i) => ySc(F[reg][i]))
          .y1((yr, i) => ySc(M[reg][i])),
      );

    g.append("path")
      .datum(YEARS)
      .attr("fill", "none")
      .attr("stroke", "#2563EB")
      .attr("stroke-width", 2)
      .attr(
        "d",
        d3
          .line()
          .x((yr) => xSc(yr))
          .y((yr, i) => ySc(M[reg][i])),
      );

    g.append("path")
      .datum(YEARS)
      .attr("fill", "none")
      .attr("stroke", "#EA580C")
      .attr("stroke-width", 2)
      .attr(
        "d",
        d3
          .line()
          .x((yr) => xSc(yr))
          .y((yr, i) => ySc(F[reg][i])),
      );

    g.selectAll(".dm")
      .data(YEARS)
      .join("circle")
      .attr("class", "dm")
      .attr("cx", (yr) => xSc(yr))
      .attr("cy", (yr, i) => ySc(M[reg][i]))
      .attr("r", 3)
      .attr("fill", "#2563EB")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.2);

    g.selectAll(".df")
      .data(YEARS)
      .join("circle")
      .attr("class", "df")
      .attr("cx", (yr) => xSc(yr))
      .attr("cy", (yr, i) => ySc(F[reg][i]))
      .attr("r", 3)
      .attr("fill", "#EA580C")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.2);

    const cLine = g
      .append("line")
      .attr("class", "crosshair")
      .attr("y1", 0)
      .attr("y2", iH)
      .style("display", "none");
    crosshairLines.set(reg, cLine);

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${iH})`)
      .call(
        d3
          .axisBottom(xSc)
          .tickValues([1990, 2000, 2010, 2017])
          .tickFormat(d3.format("d")),
      );

    g.append("g")
      .attr("class", "axis no-domain")
      .call(
        d3
          .axisLeft(ySc)
          .ticks(4)
          .tickFormat((d) => d + "%"),
      );

    if (panelIdx === 0) {
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -iH / 2)
        .attr("y", -33)
        .attr("text-anchor", "middle")
        .attr("font-size", "8px")
        .attr("fill", "#9CA3AF")
        .text("LFPR (%)");
    }

    g.append("text")
      .attr("x", iW / 2)
      .attr("y", -12)
      .attr("text-anchor", "middle")
      .attr("font-size", "11.5px")
      .attr("font-weight", "600")
      .attr("fill", "#374151")
      .text(reg);

    const li = YEARS.length - 1;
    const gap17 = (M[reg][li] - F[reg][li]).toFixed(1);
    const midY = ySc((M[reg][li] + F[reg][li]) / 2);
    g.append("text")
      .attr("x", xSc(2010))
      .attr("y", midY + 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("fill", "#C4B5A0")
      .attr("font-weight", "600")
      .text(`${gap17} pp gap`);

    card.on("click", function () {
      if (activePanelReg === reg) {
        activePanelReg = null;
        cardEls.forEach((c) => {
          c.transition().duration(200).style("opacity", 1);
          c.classed("focused", false);
        });
      } else {
        activePanelReg = reg;
        cardEls.forEach((c, r) => {
          if (r === reg) {
            c.transition().duration(200).style("opacity", 1);
            c.classed("focused", true);
          } else {
            c.transition().duration(200).style("opacity", 0.2);
            c.classed("focused", false);
          }
        });
      }
    });

    svg
      .append("rect")
      .attr("x", mg.left)
      .attr("y", mg.top)
      .attr("width", iW)
      .attr("height", iH)
      .attr("fill", "transparent")
      .on("mousemove", function (evt) {
        const [mx] = d3.pointer(evt, this);
        const xVal = xSc.invert(mx);
        const raw = bisect(YEARS, xVal, 1);
        const i = Math.min(
          Math.max(
            Math.abs(YEARS[raw - 1] - xVal) <=
              Math.abs((YEARS[raw] || Infinity) - xVal)
              ? raw - 1
              : raw,
            0,
          ),
          YEARS.length - 1,
        );

        tip
          .style("display", "block")
          .style("left", evt.clientX + 18 + "px")
          .style("top", evt.clientY - 12 + "px");

        document.getElementById("tt-hd").textContent = reg;
        document.getElementById("tt-yr").textContent = YEARS[i];
        document.getElementById("tt-m").textContent =
          M[reg][i].toFixed(1) + "%";
        document.getElementById("tt-f").textContent =
          F[reg][i].toFixed(1) + "%";
        document.getElementById("tt-g").textContent =
          (M[reg][i] - F[reg][i]).toFixed(1) + " pp";

        // Sync crosshair across ALL panels
        const crossX = xSc(YEARS[i]);
        crosshairLines.forEach((line) => {
          line.attr("x1", crossX).attr("x2", crossX).style("display", null);
        });
      })
      .on("mouseleave", () => {
        tip.style("display", "none");
        crosshairLines.forEach((line) => line.style("display", "none"));
      });

    panelIdx++;
  });

  const bar = d3.select("#wh-stats");
  REGIONS.forEach((r) => {
    const li = YEARS.length - 1;
    const gap = (M[r][li] - F[r][li]).toFixed(1);
    bar
      .append("span")
      .attr("class", "stat-chip")
      .attr("title", `Click to focus the ${r} panel`)
      .text(`${r}: ${gap} pp gap (2017)`)
      .on("click", function () {
        const idx = REGIONS.indexOf(r);
        const cards = document.querySelectorAll(".panel-card");
        if (cards[idx]) cards[idx].click();
      });
  });
}

// WHITE HAT — Gap Ranking Bar Chart
function drawGapRanking({ YEARS, REGIONS, F, M }) {
  const li = YEARS.length - 1;
  const spanYrs = YEARS[li] - YEARS[0]; // 27 years

  // Derived transformations:
  //   (1) gender gap in 2017 = M - F
  //   (2) gap trend = annualized change in the gap (pp per decade, 1990→2017)
  //       negative = gap narrowing (good), positive = widening (bad)
  const gaps = REGIONS.map((r) => {
    const gap2017 = M[r][li] - F[r][li];
    const gap1990 = M[r][0] - F[r][0];
    const trendPerDecade = ((gap2017 - gap1990) / spanYrs) * 10;
    return { region: r, gap: gap2017, trendPerDecade };
  }).sort((a, b) => a.gap - b.gap); // smallest → largest

  const W = 720,
    H = 158;
  const mg = { top: 8, right: 145, bottom: 32, left: 175 };
  const iW = W - mg.left - mg.right;
  const iH = H - mg.top - mg.bottom;

  const xSc = d3.scaleLinear().domain([0, 55]).range([0, iW]);
  const ySc = d3
    .scaleBand()
    .domain(gaps.map((d) => d.region))
    .range([0, iH])
    .padding(0.28);

  const colorSc = d3.scaleSequential(d3.interpolateOranges).domain([0, 58]);

  const container = d3.select("#gap-rank");
  container
    .append("div")
    .attr("class", "gap-rank-title")
    .text("2017 Gender Gap Ranking — All Regions (sorted smallest → largest)");

  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .attr("height", "auto")
    .style("display", "block");

  const g = svg
    .append("g")
    .attr("transform", `translate(${mg.left},${mg.top})`);

  g.selectAll(".gap-bar")
    .data(gaps)
    .join("rect")
    .attr("class", "gap-bar")
    .attr("y", (d) => ySc(d.region))
    .attr("x", 0)
    .attr("width", (d) => xSc(d.gap))
    .attr("height", ySc.bandwidth())
    .attr("fill", (d) => colorSc(d.gap))
    .attr("rx", 2);

  g.selectAll(".gap-val")
    .data(gaps)
    .join("text")
    .attr("class", "gap-val")
    .attr("x", (d) => xSc(d.gap) + 5)
    .attr("y", (d) => ySc(d.region) + ySc.bandwidth() / 2 + 4)
    .attr("font-size", "9.5px")
    .attr("fill", "#374151")
    .text((d) => `${d.gap.toFixed(1)} pp`);

  g.selectAll(".gap-trend")
    .data(gaps)
    .join("text")
    .attr("class", "gap-trend")
    .attr("x", (d) => xSc(d.gap) + 44)
    .attr("y", (d) => ySc(d.region) + ySc.bandwidth() / 2 + 4)
    .attr("font-size", "8.5px")
    .attr("fill", (d) => (d.trendPerDecade <= 0 ? "#059669" : "#DC2626"))
    .text((d) => {
      const sign = d.trendPerDecade <= 0 ? "" : "+";
      return `(${sign}${d.trendPerDecade.toFixed(1)} pp/decade)`;
    });

  g.append("text")
    .attr("x", iW + 44)
    .attr("y", -2)
    .attr("font-size", "8px")
    .attr("fill", "#9CA3AF")
    .text("Gap trend 1990→2017");

  g.append("g")
    .attr("class", "axis no-domain")
    .call(d3.axisLeft(ySc).tickSize(0))
    .selectAll("text")
    .attr("font-size", "10px")
    .attr("dx", "-5px");

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${iH})`)
    .call(
      d3
        .axisBottom(xSc)
        .ticks(6)
        .tickFormat((d) => d + " pp"),
    );

  svg
    .append("text")
    .attr("x", mg.left + iW / 2)
    .attr("y", H - 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "9.5px")
    .attr("fill", "#6B7280")
    .text(
      "Gender gap in percentage points (2017)  ·  Color intensity = gap magnitude  ·  Trend = pp change per decade (green = narrowing)",
    );
}

// WHITE HAT — Narrative Callout Annotations
function positionAnnotations({ YEARS, REGIONS, F, M }) {
  const li = YEARS.length - 1;
  const lacImprove = (
    F["Latin America & Carib."][li] - F["Latin America & Carib."][0]
  ).toFixed(1);
  const worldGap1990 = (M["World"][0] - F["World"][0]).toFixed(1);
  const worldGap2017 = (M["World"][li] - F["World"][li]).toFixed(1);

  const annotations = [
    {
      region: "Mid. East & N. Africa",
      text: "↓ Only region with declining female LFPR",
      cls: "cb-red",
    },
    {
      region: "Latin America & Carib.",
      text: `↑ Fastest improving: +${lacImprove} pp since 1990`,
      cls: "cb-green",
    },
    {
      region: "World",
      text: `Global gap barely moved: ${worldGap1990} → ${worldGap2017} pp`,
      cls: "cb-gray",
    },
  ];

  const cards = document.querySelectorAll("#wh-grid .panel-card");
  const regionCards = {};
  REGIONS.forEach((r, i) => {
    regionCards[r] = cards[i];
  });

  annotations.forEach((ann) => {
    const card = regionCards[ann.region];
    if (!card) return;
    const badge = document.createElement("div");
    badge.className = `callout-badge ${ann.cls}`;
    badge.textContent = ann.text;
    card.appendChild(badge);
  });
}

// BLACK HAT — Reveal Deceptions Toggle
function setupRevealButton() {
  const btn = document.getElementById("bh-reveal");
  const overlay = document.getElementById("bh-overlay");
  if (!btn || !overlay) return;

  const badges = [
    {
      text: "① Truncated axis: starts at 50, not 0 — inflates visual change",
      style: { left: "1%", top: "35%" },
    },
    {
      text: "② Cherry-picked: 4 of 7 regions hidden (MENA index ≈ 28 omitted)",
      style: { right: "0%", top: "4%" },
    },
    {
      text: '③ Goalpost shifted: "Near Parity" set at 80, not 100',
      style: { left: "28%", top: "6%" },
    },
    {
      text: "④ Decorative confidence band — not statistically computed",
      style: { left: "55%", bottom: "16%" },
    },
  ];

  badges.forEach((b) => {
    const div = document.createElement("div");
    div.className = "bh-badge";
    div.textContent = b.text;
    Object.entries(b.style).forEach(([k, v]) => {
      div.style[k] = v;
    });
    overlay.appendChild(div);
  });

  btn.addEventListener("click", () => {
    const visible = overlay.classList.toggle("visible");
    btn.textContent = visible
      ? "Hide Annotations"
      : "Reveal Deception Techniques";
  });
}

// BLACK HAT — Misleading line chart
function drawBlackHat({ YEARS, REGIONS, F, M }) {
  // Cherry-picked regions (highest parity index — omits MENA ~28, ECA ~71)
  const BH_REGIONS = [
    "Latin America & Carib.",
    "Sub-Saharan Africa",
    "North America",
  ];
  const BH_COLORS = ["#10B981", "#3B82F6", "#F59E0B"];

  // Historical years (indices into YEARS array corresponding to 2000–2017)
  // YEARS = [1990,1995,2000,2005,2010,2015,2017] → indices 2–6
  const histIdx = [2, 3, 4, 5, 6];
  const histYrs = [2000, 2005, 2010, 2015, 2017];

  // Compute parity index = (F / M) * 100 for history
  const hist = BH_REGIONS.map((r, ri) => ({
    region: r,
    color: BH_COLORS[ri],
    pts: histIdx.map((idx, j) => ({
      year: histYrs[j],
      parity: (F[r][idx] / M[r][idx]) * 100,
    })),
  }));

  // Linear projection: slope from 2000–2017, extended to 2020 & 2025
  const proj = hist.map((d) => {
    const n = d.pts.length;
    const p0 = d.pts[0].parity;
    const p1 = d.pts[n - 1].parity;
    const slope = (p1 - p0) / (histYrs[n - 1] - histYrs[0]);
    return {
      region: d.region,
      color: d.color,
      pts: [
        { year: 2017, parity: p1 },
        { year: 2020, parity: p1 + slope * 3 },
        { year: 2025, parity: p1 + slope * 8 },
      ],
      slope,
    };
  });

  const TW = 780,
    TH = 420;
  const mg = { top: 48, right: 170, bottom: 52, left: 62 };
  const iW = TW - mg.left - mg.right;
  const iH = TH - mg.top - mg.bottom;

  // TRUNCATED Y-AXIS: 50–83 (hides the fact 100 = true equality)
  const xSc = d3.scaleLinear().domain([2000, 2025]).range([0, iW]);
  const ySc = d3.scaleLinear().domain([50, 83]).range([iH, 0]);

  const svg = d3
    .select("#bh-viz")
    .append("svg")
    .attr("viewBox", `0 0 ${TW} ${TH}`)
    .attr("width", "100%")
    .attr("height", "auto")
    .style("display", "block");

  const g = svg
    .append("g")
    .attr("transform", `translate(${mg.left},${mg.top})`);

  g.append("g")
    .attr("class", "gridlines")
    .call(d3.axisLeft(ySc).ticks(6).tickSize(-iW).tickFormat(""));

  // "Near Parity" reference line at 80 (NOT at 100 — goalposts shifted)
  const nearParityY = ySc(80);
  g.append("line")
    .attr("x1", 0)
    .attr("x2", iW)
    .attr("y1", nearParityY)
    .attr("y2", nearParityY)
    .attr("stroke", "#6EE7B7")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "7,4")
    .attr("opacity", 0.9);

  g.append("text")
    .attr("x", 6)
    .attr("y", nearParityY - 5)
    .attr("font-size", "9px")
    .attr("fill", "#059669")
    .attr("font-weight", "600")
    .text("Near Parity (80)");

  const x2017 = xSc(2017);
  g.append("line")
    .attr("x1", x2017)
    .attr("x2", x2017)
    .attr("y1", 0)
    .attr("y2", iH)
    .attr("stroke", "#9CA3AF")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,3");

  g.append("text")
    .attr("x", x2017 - 5)
    .attr("y", -8)
    .attr("text-anchor", "end")
    .attr("font-size", "9.5px")
    .attr("fill", "#9CA3AF")
    .text("Historical");
  g.append("text")
    .attr("x", x2017 + 5)
    .attr("y", -8)
    .attr("font-size", "9.5px")
    .attr("fill", "#9CA3AF")
    .text("Projected ▶");

  proj.forEach((d) => {
    g.append("path")
      .datum(d.pts)
      .attr("fill", d.color)
      .attr("opacity", 0.13)
      .attr(
        "d",
        d3
          .area()
          .x((v) => xSc(v.year))
          .y0((v, i) => ySc(v.parity - i * 1.4))
          .y1((v, i) => ySc(v.parity + i * 1.4)),
      );
  });

  proj.forEach((d) => {
    g.append("path")
      .datum(d.pts)
      .attr("fill", "none")
      .attr("stroke", d.color)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6,4")
      .attr("opacity", 0.85)
      .attr(
        "d",
        d3
          .line()
          .x((v) => xSc(v.year))
          .y((v) => ySc(v.parity)),
      );
  });

  hist.forEach((d) => {
    g.append("path")
      .datum(d.pts)
      .attr("fill", "none")
      .attr("stroke", d.color)
      .attr("stroke-width", 2.5)
      .attr(
        "d",
        d3
          .line()
          .x((v) => xSc(v.year))
          .y((v) => ySc(v.parity)),
      );

    g.selectAll(null)
      .data(d.pts)
      .join("circle")
      .attr("cx", (v) => xSc(v.year))
      .attr("cy", (v) => ySc(v.parity))
      .attr("r", 4.5)
      .attr("fill", d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);
  });

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(xSc).ticks(6).tickFormat(d3.format("d")));

  g.append("g").attr("class", "axis no-domain").call(d3.axisLeft(ySc).ticks(6));

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -iH / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("font-size", "10.5px")
    .attr("fill", "#6B7280")
    .text("Gender Workforce Parity Index");

  g.append("text")
    .attr("x", iW / 2)
    .attr("y", iH + 40)
    .attr("text-anchor", "middle")
    .attr("font-size", "10.5px")
    .attr("fill", "#6B7280")
    .text("Year");

  const leg = g.append("g").attr("transform", `translate(${iW + 16}, 30)`);
  hist.forEach((d, i) => {
    const ly = i * 28;
    leg
      .append("line")
      .attr("x1", 0)
      .attr("x2", 18)
      .attr("y1", ly)
      .attr("y2", ly)
      .attr("stroke", d.color)
      .attr("stroke-width", 2.5);
    leg
      .append("circle")
      .attr("cx", 9)
      .attr("cy", ly)
      .attr("r", 3.5)
      .attr("fill", d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.2);
    leg
      .append("text")
      .attr("x", 24)
      .attr("y", ly + 4)
      .attr("font-size", "10.5px")
      .attr("fill", "#374151")
      .text(d.region);
  });

  g.append("text")
    .attr("x", xSc(2021))
    .attr("y", ySc(77))
    .attr("text-anchor", "middle")
    .attr("font-size", "9.5px")
    .attr("fill", "#065F46")
    .attr("font-weight", "700")
    .text("Near-parity on track");
  g.append("text")
    .attr("x", xSc(2021))
    .attr("y", ySc(77) + 13)
    .attr("text-anchor", "middle")
    .attr("font-size", "9px")
    .attr("fill", "#065F46")
    .text("by mid-2020s →");

  g.append("text")
    .attr("x", xSc(2006))
    .attr("y", ySc(58))
    .attr("font-size", "9px")
    .attr("fill", "#10B981")
    .attr("opacity", 0.85)
    .attr("font-style", "italic")
    .text("↑ Fastest-improving region");
}

// COMPUTED HERO STATS (data-driven — no hardcoded values)
function initHeroStats({ YEARS, REGIONS, F, M }) {
  const li = YEARS.length - 1;

  let maxGap = 0;
  REGIONS.forEach((r) => {
    const g = M[r][li] - F[r][li];
    if (g > maxGap) maxGap = g;
  });
  const elLargest = document.getElementById("hs-largest");
  if (elLargest) elLargest.textContent = maxGap.toFixed(1) + " pp";

  let maxImprove = -Infinity;
  REGIONS.forEach((r) => {
    const imp = F[r][li] - F[r][0];
    if (imp > maxImprove) maxImprove = imp;
  });
  const elImproved = document.getElementById("hs-improved");
  if (elImproved) elImproved.textContent = "+" + maxImprove.toFixed(1) + " pp";

  const worldGap = M["World"][li] - F["World"][li];
  const elGlobal = document.getElementById("hs-global");
  if (elGlobal) elGlobal.textContent = worldGap.toFixed(1) + " pp";
}

loadData()
  .then((data) => {
    initHeroStats(data);
    drawWhiteHat(data);
    drawGapRanking(data);
    positionAnnotations(data);
    drawBlackHat(data);
    setupRevealButton();
  })
  .catch((err) => {
    console.error("Failed to load data:", err);
  });
