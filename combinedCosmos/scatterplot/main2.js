const colors = [ "orange", "yellow", "green", "blue", "indigo", "violet","red"];
var selectedClusters = [];
var circles2 = null;
var color2 = null;
function isColorInUse(color) {
    return selectedClusters.some(cluster => cluster.color === color);
  }
  
  function getRandomColor() {
    let color;
    do {
      color = colors[Math.floor(Math.random() * colors.length)];
    } while (isColorInUse(color));
    return color;
  }

var path = null; 
// set the dimensions and margins of the graph
var margin = { top: 10, right: 30, bottom: 60, left: 60 },
  width = 600 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;


// append the svg object to the body of the page
var svg = d3
  .select("#my_dataviz")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Add the grey background that makes ggplot2 famous
svg
  .append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("height", height)
  .attr("width", width)
  .style("fill", "rgb(135, 186, 228)");

 
// Read the data

Promise.all([d3.csv("scatterplot/unbonded.csv"), d3.csv("scatterplot/bonded.csv")]).then(function (data) {
  const unbondedData = data[0];
  const bondedData = data[1];

  // Merge unbondedData and bondedData based on timestamp
  const combinedData = unbondedData.map((unbondedItem, i) => {
    const bondedItem = bondedData[i];
    return {
      timestamp: new Date(unbondedItem.timestamp),
      unbondedValue: +unbondedItem.value,
      bondedValue: +bondedItem.value,
    };
  });

  var brush = d3.brush()
  .extent([[0, 0], [width, height]])
  .on("end", (event) => updateChart(event));
    
  svg
  .append("g")
  .attr("class", "brush")
  .call(brush);
  


  function updateChart(event) {
    extent = event.selection;
  
    // Update 4: Check if no points are selected
    if (!extent) return;
  
    const selected = combinedData.filter((d) =>
      extent[0][0] <= x(d.unbondedValue) && x(d.unbondedValue) <= extent[1][0]
      && extent[0][1] <= y(d.bondedValue) && y(d.bondedValue) <= extent[1][1]
    );
  
    // Update 4: If no points are selected, show an alert and return
    if (selected.length === 0) {
      alert("No points are selected. Please try again.");
      return;
    }
  
    // Update 2: Select color from available colors or random from the 7 colors
    let clusterColor;
    if (selectedClusters.length < 7) {
      clusterColor = getRandomColor();
    } else {
      clusterColor = colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Update 5: Save the selected cluster's data and color information
    selectedClusters.push({ data: selected, color: clusterColor });
  
    selected.forEach(function (d) {
      d.selected = true;
    });
  
    circles.style("fill", function (d) {
      let fillColor = "white";
      selectedClusters.forEach(function (cluster) {
        if (cluster.data.includes(d)) {
          fillColor = cluster.color;
        }
      });
      return fillColor;
    });
  
    // Update 5: Update the line chart's color according to the selected clusters
    circles2.style("fill", function (d) {
        let fillColor = color2(d.timestamp);
        selectedClusters.forEach(function (cluster) {
          cluster.data.forEach(function (item) {
            if (item.timestamp.getTime() === d.timestamp.getTime()) {
              fillColor = cluster.color;
            }
          });
        });
        return fillColor;
      });
  
    svg.select(".brush").call(brush.move, null);
  }

  
  // Define the tooltip
  var tooltip = d3
    .select("#my_dataviz")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");

 // Add X axis
var x = d3
.scaleLinear()
.domain([d3.min(combinedData, (d) => d.unbondedValue)-500000000000, d3.max(combinedData, (d) => d.unbondedValue)+500000000000])
.range([0, width]);
svg
.append("g")
.attr("transform", "translate(0," + height + ")")
.call(d3.axisBottom(x).tickFormat(d3.format(".2s")))
.select(".domain")
.remove();

// Add Y axis
var y = d3
.scaleLinear()
.domain([d3.min(combinedData, (d) => d.bondedValue)-1000000000000, d3.max(combinedData, (d) => d.bondedValue)+1000000000000])
.range([height, 0]);
svg
.append("g")
.call(d3.axisLeft(y).tickFormat(d3.format(".2s")))
.select(".domain")
.remove();

// Remove grid lines
svg.selectAll(".tick line").remove();

// Add X axis label
svg
.append("text")
.attr("text-anchor", "end")
.attr("x", width / 2 + margin.left)
.attr("y", height + margin.top + 30)
.text("Unbonded Value")
.style("fill", "black");

// Y axis label
svg
.append("text")
.attr("text-anchor", "end")
.attr("transform", "rotate(-90)")
.attr("y", -margin.left + 10)
.attr("x", -margin.top - height / 2 + 50)
.text("Bonded Value")
.style("fill", "black");

// Add border
svg
.append("rect")
.attr("x", 0)
.attr("y", 0)
.attr("height", height)
.attr("width", width)
.style("fill", "none")
.style("stroke", "black")
.style("stroke-width", "1.5px");

  // Color scale
  var color = d3
    .scaleSequential()
    .domain(d3.extent(combinedData, d => new Date(d.timestamp)))
    .interpolator(d3.interpolateReds);

const mouseover = function(event, d) {
  tooltip
  .transition()
  .duration(200)
  tooltip
  .html(
  "<strong>timestamp : </strong>" +
  `${d3.timeFormat("%m/%d %H:%M")(new Date(d.timestamp))}` +
  "<br>" +
  "<strong>unbonded : </strong>" +
  `${d.unbondedValue}`+
  "<br>" +
  "<strong>bonded : </strong>" +
  `${d.bondedValue}`+
  "<br>" +
  "<strong>ratio : </strong>" +
  `${d.bondedValue/d.unbondedValue}`)
  .style("left", (event.x)/2 + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
  .style("top", (event.y)/2 + "px")
  .style("opacity", 1)
}
const mouseleave = function(event,d) {
  tooltip
    .transition()
    .duration(200)
    .style("opacity", 0)
}

  // Add dots
  var circles = svg
    .append("g")
    .selectAll("dot")
    .data(combinedData)
    .enter()
    .append("circle")
    .attr("cx", function (d) {
      return x(d.unbondedValue);
    }) 
    .attr("cy", function (d) {
    return y(d.bondedValue);
    })
    .attr("r", 3)
    .style("fill", function (d) {
    return color(new Date(d.timestamp));
    })
    // Add tooltip
  });
  function formatValue(value) {
    return d3.format(".2s")(value).replace("G", "B");
  }
  
// set the dimensions and margins of the graph
var margin2 = { top: 10, right: 30, bottom: 40, left: 50 },
  width2 = 1000 - margin2.left - margin2.right,
  height2 =500 - margin2.top - margin2.bottom;

// append the svg object to the body of the page
var svg2 = d3
  .select("#my_dataviz2")
  .append("svg")
  .attr("width", width2 + margin2.left + margin2.right)
  .attr("height", height2 + margin2.top + margin2.bottom)
  .append("g")
  .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

// Add the grey background that makes ggplot2 famous
svg2
  .append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("height", height2)
  .attr("width", width2)
  .style("fill", "rgb(135, 186, 228)");

// Read the data
// Scatter plot
d3.csv("scatterplot/cosmos.csv").then(function (data) {

    function getColorForTimestamp(timestamp) {
        let fillColor = color2(timestamp);
        selectedClusters.forEach(function (cluster) {
          cluster.data.forEach(function (item) {
            if (item.timestamp.getTime() === timestamp.getTime()) {
              fillColor = cluster.color;
            }
          });
        });
        return fillColor;
      }  
  // Format the data
  const parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");
  data.forEach(function (d) {
    d.timestamp = parseTime(d.timestamp);
    d.value = +d.value;
  });

  // Add X axis
  var x2 = d3
    .scaleTime()
    .domain(d3.extent(data, function (d) {
      return d.timestamp;
    }))
    .range([0, width2]);
  svg2
    .append("g")
    .attr("transform", "translate(0," + height2 + ")")
    .call(d3.axisBottom(x2).tickFormat(d3.timeFormat("%m/%d")))
    .select(".domain")
    .remove();

  // Add Y axis
  var y2 = d3
    .scaleLinear()
    .domain([
      d3.min(data, function (d) {
        return d.value;
      }),
      d3.max(data, function (d) {
        return d.value;
      }),
    ])
    .range([height2, 0]);
  svg2.append("g").call(d3.axisLeft(y2));

  // Color scale
    color2 = d3
    .scaleSequential()
    .domain(d3.extent(data, d => d.timestamp))
    .interpolator(d3.interpolateReds);

// Add dots
circles2 = svg2
  .append("g")
  .selectAll("dot")
  .data(data)
  .enter()
  .append("circle")
  .attr("cx", function (d) {
    return x2(d.timestamp);
  })
  .attr("cy", function (d) {
    return y2(d.value);
  })
  .attr("r", 2)
  .style("fill", function (d) {
    return getColorForTimestamp(d.timestamp);
  });

});
