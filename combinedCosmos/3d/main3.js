import * as THREE from 'three';
import * as THRE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r126/three.module.min.js'

// Load a font
let font = null;
const loader = new THRE.FontLoader();
loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', loadedFont => {
  font = loadedFont;
});

function createTextTexture(text, color = 'rgba(255, 255, 255, 1)') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 520;
    canvas.height = 180
    context.font = '40px Ubuntu';
    context.fillStyle = color;
    context.textAlign = 'center';  // Make sure text is centered
    context.textBaseline = 'middle';  // Make sure text is centered
    context.fillText(text, canvas.width / 2, canvas.height / 2);
  
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
  
    return texture;
  }

let graphData = null;

d3.csv('3d/corr.csv').then(function(data) {
    
  const nodes = Array.from(new Set(data.flatMap(d => [d.fig1, d.fig2])), id => ({ id }));
  const links = data.map(d => ({ source: d.fig1, target: d.fig2, value: +d.corr }));


  // Compute the number of links per node
  const linkCount = {};
  links.forEach(link => {
    linkCount[link.source] = (linkCount[link.source] || 0) + 1;
    linkCount[link.target] = (linkCount[link.target] || 0) + 1;
  });

  // Compute the min and max link count
  const linkCounts = Object.values(linkCount);
  const minLinkCount = Math.min(...linkCounts);
  const maxLinkCount = Math.max(...linkCounts);

  // Create a color scale
  const colorNode = d3.scaleLinear()
    .domain([minLinkCount, maxLinkCount])
    .range(['white', '#4682B4']); // white to blue

    graphData = { nodes, links, colorNode, linkCount };  
  drawGraph(graphData);
});

function drawGraph(graphData) {
  function handleNodeClick(node) {
    // Extract your onNodeClick logic into this function
    selectedNode = node;
    const linkedNodes = graphData.links.filter(link => link.source.id === node.id || link.target.id === node.id);
        
    Graph.graphData({
      nodes: graphData.nodes.filter(d => d.id === node.id || linkedNodes.find(link => link.source.id === d.id || link.target.id === d.id)),
      links: linkedNodes
    });
  
    infoHeader.textContent = node.id;
    infoEdges.innerHTML = linkedNodes
    .sort((a, b) => b.value - a.value) // link.value를 내림차순으로 정렬
    .map(link => {
      const id = (link.source.id !== node.id) ? link.source.id : link.target.id;
      const spacing = '&nbsp'.repeat(58 - id.length); // Adjust the spacing value as needed
    
      return `<span class="monospace">&nbsp${id}${spacing}corr:${link.value.toFixed(2)}</span>`;
    })
    .join('<br>');
    
    
    Graph.cameraPosition(
      { x: node.x * 1.4, y: node.y * 1.4, z: node.z * 1.4 },
      node,
      3000
    );
  }
  let linksNumber = 0;
  const elem = document.getElementById('3d-graph');
  const infoHeader = document.getElementById('info-header');
  const infoEdges = document.getElementById('info-edges');
  const light = new THREE.DirectionalLight(0xffffff, 1);

  light.position.set(0, 10, 10);

  infoEdges.innerHTML = graphData.links
  .sort((a, b) => b.value - a.value) // link.value를 내림차순으로 정렬
  .map(link => {
    const id = `${link.source} - ${link.target}`;
    const spacing = '&nbsp'.repeat(58 - id.length); 
    linksNumber++;
    return `<span class="monospace">&nbsp${id}${spacing}corr:${link.value.toFixed(2)}</span>`
  }).join('<br>');
  infoHeader.innerHTML = `All corr value ${linksNumber}`;
  linksNumber = 0;
  
  const colorLink = d3.scaleLinear().domain([-1, 0, 1]).range(['rgb(0,255,255)', 'white', '#4682B4']); // Updated this line
  let selectedNode = null;
  
  const Graph = ForceGraph3D()(elem)
    .width(800)
    .height(800)
    .graphData(graphData)
    .nodeRelSize(2)
    .nodeId('id')
    .nodeColor(node => node.id !== undefined ? graphData.colorNode(graphData.linkCount[node.id]) : 'rgba(255, 255, 0, 0.5)')
    .nodeThreeObject(node => {
      const group = new THREE.Group();

      const sphereGeometry = new THREE.SphereGeometry(2);
      // Handle case where node.id is undefined
      const color = node.id !== undefined ? graphData.colorNode(graphData.linkCount[node.id]) : 'rgba(255, 255, 0, 0.5)';
      const sphereMaterial = new THREE.MeshStandardMaterial({ color, opacity: 0.7, transparent: true });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      group.add(sphere);


        const texture = createTextTexture(node.id);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, alphaTest: 0.5 });
        const label = new THREE.Sprite(spriteMaterial);
        if (label) {
            label.position.y = 5.5; // Adjust this value to position the label
            label.scale.set(20, 10, 2); // Adjust this value to change the size of the label
            group.add(label);
        }

        return group;
    })
    .nodeLabel(node => `${node.id}`)
    .linkTarget('target')
    .linkWidth(link => 0.1 + Math.abs(link.value) * 0.8)
    .linkColor(() => 'white')
    .linkDirectionalParticles(2)
    .onNodeClick(node => {
      selectedNode = node;
      const linkedNodes = graphData.links.filter(link => link.source.id === node.id || link.target.id === node.id);
      
      Graph.graphData({
        nodes: graphData.nodes.filter(d => d.id === node.id || linkedNodes.find(link => link.source.id === d.id || link.target.id === d.id)),
        links: linkedNodes
      });

      infoHeader.textContent = node.id;
      infoEdges.innerHTML = linkedNodes
      .sort((a, b) => b.value - a.value) // link.value를 내림차순으로 정렬
      .map(link => {
        const id = (link.source.id !== node.id) ? link.source.id : link.target.id;
        const spacing = '&nbsp'.repeat(58 - id.length); // Adjust the spacing value as needed
      
        return `<span class="monospace">&nbsp${id}${spacing}corr:${link.value.toFixed(2)}</span>`;
      })
      .join('<br>');
      
      
      Graph.cameraPosition(
        { x: node.x * 1.4, y: node.y * 1.4, z: node.z * 1.4 },
        node,
        3000
      );
    })
    .onBackgroundClick(() => {
      selectedNode = null;
      Graph.graphData(graphData);


      infoEdges.innerHTML = graphData.links
      .sort((a, b) => b.value - a.value) // link.value를 내림차순으로 정렬
      .map(link => {
        const id = `${link.source.id} - ${link.target.id}`;
        const spacing = '&nbsp'.repeat(58 - id.length); 
        linksNumber++;
        return `<span class="monospace">&nbsp${id}${spacing}corr:${link.value.toFixed(2)}</span>`
      }).join('<br>');
      infoHeader.innerHTML = `All corr value ${linksNumber}`;
      linksNumber = 0;
    })

    const nodeIds = graphData.nodes.map(node => node.id);

    $("#search-input").autocomplete({
      source: nodeIds,
      select: function(event, ui) {
          const selectedNode = graphData.nodes.find(node => node.id === ui.item.value);
          // Call the function directly
          if (selectedNode) {
              handleNodeClick(selectedNode);
          }
      }
    });
} 
