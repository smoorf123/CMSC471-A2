function loadData() {
  return d3
    .csv("data/lfpr.csv", (d) => ({
      region: d.region,
      year: +d.year,
      female_lfpr: +d.female_lfpr,
      male_lfpr: +d.male_lfpr,
    }))
    .then((rows) => {
      const YEARS = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
      const REGIONS = [...new Set(rows.map((r) => r.region))];

      const ORDER = [
        "World",
        "East Asia & Pacific",
        "Sub-Saharan Africa",
        "Latin America & Carib.",
        "Mid. East & N. Africa",
        "North America",
        "Europe & Central Asia",
      ];
      REGIONS.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));

      const F = {},
        M = {};
      REGIONS.forEach((reg) => {
        const regionRows = rows.filter((r) => r.region === reg);
        regionRows.sort((a, b) => a.year - b.year);
        F[reg] = regionRows.map((r) => r.female_lfpr);
        M[reg] = regionRows.map((r) => r.male_lfpr);
      });

      return { YEARS, REGIONS, F, M };
    });
}
