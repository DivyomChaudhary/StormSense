fetch("/weather")
  .then((response) => response.json())
  .then((data) => {

    const margin = { top: 70, right: 30, bottom: 40, left: 80 };
    const width = 807 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const svg = d3
      .select(".chart-container")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const dataset = data.map((d) => ({
      date: new Date(d.date),
      value: d.value,
      humidity : d.humidity,
    }));

    x.domain(d3.extent(dataset, (d) => d.date));
    y.domain([0, d3.max(dataset, (d) => d.value)]);

    const line = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.value))
      .curve(d3.curveBasis);
    svg
      .append("path")
      .datum(dataset)
      .attr("fill", "none")
      .attr("stroke", "#eb6e4b")
      .attr("stroke-width", 1)
      .attr("d", line);

      const xAxisGroup = svg
      .append("g")
      .attr("transform", `translate(0, ${height})`);

      xAxisGroup
      .call(
        d3.axisBottom(x)
          .ticks(d3.timeHour.every(1))
          .tickFormat(d3.timeFormat("%I %p")) 
      )
      .selectAll("text")
      .style("text-anchor", "middle");

    svg
    .append("g")
    .call(d3.axisLeft(y)
    .tickFormat((d) => {
        if (d % 10 === 0 && d !== 0) {
            return `${d}°C`;
        } 
          
        else {
            return ""; 
          }
    }));

    const markerData1 = dataset[4];
      const markerData2 = dataset[5]; 

      // Calculate midpoint coordinates
      const midX = (x(markerData1.date) + x(markerData2.date)) / 2;
      const midY = (y(markerData1.value) + y(markerData2.value)) / 2;
    const markerData = dataset[4];
    
    if (dataset.length >= 5 && markerData.value < 30) {
        svg
          .append("circle")
          .attr("cx", midX)
          .attr("cy", midY)
          .attr("r", 6)
          .attr("fill", "#4c93fd");
      }
    else if (dataset.length >= 5 && markerData.value >= 30 && markerData.value < 40) {
        svg
          .append("circle")
          .attr("cx", x(markerData.date))
          .attr("cy", y(markerData.value))
          .attr("r", 6)
          .attr("fill", "yellow");
      }
    else if (dataset.length >= 5 && markerData.value > 40) {
        svg
          .append("circle")
          .attr("cx", x(markerData.date))
          .attr("cy", y(markerData.value))
          .attr("r", 6)
          .attr("fill", "red");
      }
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
