console.log("here")

const WIDTH = 1000
const HEIGHT = 400
const LABELHEIGHT = 30
const margin = {left: 20, right: 200, top: 20, bottom: 20}

var categories = ['knowledge', 'goals', 'objectives', 'tasks']
var categoryLabels = ['knowledge-contexts', 'goals', 'objectives', 'tasks']
var knowledge = ['ML-Formal', 'ML-Instrumental', 'ML-Personal', 'Domain-Formal',
			       'Domain-Instrumental', 'Domain-Personal', 'Milieu-Formal',
			       'Milieu-Instrumental', 'Milieu-Personal', 'Stakeholders-Not-Specified']
var goals = ['G1', 'G2', 'Goal-Not-Specified']
var objectives = [ 'O1', 'O2', 'O3',
       			   'O4', 'O5', 'O6', 'O7', 'Obj-Not-Specified']
var tasks = ['T1', 'T2', 'T3', 'T4', 'T5']

var labels = {
	'Stakeholders-Not-Specified': 'not explicitly specified',
	'G1': 'G1: understanding', 
	'G2': 'G2: trust',
	'Goal-Not-Specified': 'not explicitly specified',
	'O1': 'O1: justify actions based on output',
	'O2': 'O2: understand how to incorporate output', 
	'O3': 'O3: debug or improve',
	'O4': 'O4: contest decision',
	'O5': 'O5: compliance w/ regulations',
	'O6': 'O6: understand data usage',
	'Obj-Not-Specified': 'not explicitly specified',
	'O7': 'O7: learn about domain',
	'T1': 'T1: assess prediction reliability', 
	'T2': 'T2: detect discrimination/mistake',
	'T3': 'T3: understand model strengths/limitations',
	'T4': 'T4: understand features used',
	'T5': 'T5: understand influence of features'
}

var colors = [
	'lightgreen', 
	'lightblue',
	'lightpink'
]

var labelSvg = d3.select(".wrapper")
    .append("svg")
    .attr("width", WIDTH + "px")
    .attr("height", LABELHEIGHT + "px");


var svg = d3.select(".wrapper")
    .append("svg")
    .attr("width", WIDTH + "px")
    .attr("height", HEIGHT + "px");

var papersDiv = d3.select(".wrapper")
				  .append("div")
				  .attr("class", "papersList")
				  .attr("width", WIDTH + "px")

// Define the div for the tooltip
var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

var lineOrigOpacity = 0.1
var circleOrigOpacity = 0.6
var textOrigOpacity = 0.8


var circleHeight = 4
var categoryScale = d3.scalePoint(categories, [margin.left, WIDTH - margin.right])
var knowledgeScale = d3.scalePoint(knowledge, [margin.top, HEIGHT - margin.bottom])
var goalsScale = d3.scalePoint(goals, [margin.top, HEIGHT - margin.bottom])
var objectivesScale = d3.scalePoint(objectives, [margin.top, HEIGHT - margin.bottom])
var tasksScale = d3.scalePoint(tasks, [margin.top, HEIGHT - margin.bottom])
var scaleDict = {
	'knowledge': knowledgeScale,
	'goals': goalsScale,
	'objectives': objectivesScale,
	'tasks': tasksScale
}

labelSvg.selectAll("text")
        .data(categoryLabels)
        .join("text")
        .attr("x", d => categoryScale(d))
        .attr("y", 20)
        .text(d => d)
        .style("font-family", "Open Sans")

function aggregateLinks(linkData) {
	var helper = {};
	var aggLinks = linkData.reduce(function(r, o) {
  	  var key = o.source + '-' + o.target;
  
	  if(!helper[key]) {
	    helper[key] = Object.assign({}, o); // create a copy of o
	    helper[key]['count'] = 1
	    helper[key]['paper'] = [o.paper]
	    r.push(helper[key]);
	  } else {
	    helper[key].count += 1;
	    helper[key].level = o.level;
	    helper[key].paper.push(o.paper)
	  }

  	  return r;

	}, []);

	return aggLinks;
}

var links;
var nodes;
var clicked; 
d3.json("node_link_data.json").then(function(data) {
	console.log(data)

	nodes = data['nodes']
	links = data['links']
	var aggLinks = aggregateLinks(links)

    svg.append("g")
    .attr("class", "lines")
    .selectAll("line")
    .data(aggLinks)
    .join("line")
    .style("stroke", 'grey')
    .style("stroke-width", d => d.count)
    .style("opacity", lineOrigOpacity)
    .attr("source", d => d.source)
    .attr("target", d => d.target)
    .attr("x1", d => categoryScale(categories[d.level]))
    .attr("x2", d => categoryScale(categories[d.level + 1]))
    .attr("y1", function(d) {
    	var scale = scaleDict[categories[d.level]]
    	return scale(d.source)
    })
    .attr("y2", function(d) {
    	var scale = scaleDict[categories[d.level + 1]]
    	return scale(d.target)
    })
    .attr("paper-id", d => d.paper_list);

	svg.append("g")
		.attr("class", "selectedLines")

	svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
      .attr("cx", d => categoryScale(d.category))
      .attr("cy", d => scaleDict[d.category](d.name))
      .attr("r", circleHeight)
      .attr("class", d => d.name)
      .attr("fill", "grey")
      .style("opacity", circleOrigOpacity)
      .style("z-index", 1001)
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("click", handleClick)

    svg.selectAll("text")
      .data(nodes)
      .join("text")
      .attr("class", d => `label ${d.name}`)
      .attr("x", d => categoryScale(d.category))
      .attr("y", d => scaleDict[d.category](d.name))
      .attr("dx", "0.75em")
      .attr("dy", "0.33em")
      .style("font-size", 11)
      .style("opacity", textOrigOpacity)
      .style("z-index", 1000)
      .text(function(d) {
      	if (d.name in labels) {
      		return labels[d.name]
      	} else {
      		return d.name
      	}
      }) 

    clicked = false;

    function handleClick(event, d) {
    	handleMouseOver(event, d)
    	clicked = true;
    }

	function handleMouseOver(event, d) {  // Add interactivity
	    // Use D3 to select element, change color and size
	    if (clicked) {
	    	clicked = false
	    	handleMouseOut(event, d)
	    }

	    $(".bibItem").remove()
	    $(`.${d.name}`).css('opacity', 1)
	    $(`circle.${d.name}`).css('stroke', 'black')

	    var filteredData = links.filter(function(itm){
		  return d.paper_list.indexOf(itm.paper) > -1;
		});
	    var aggFilteredData = aggregateLinks(filteredData)
	    d3.select(".selectedLines")
		   .selectAll("line")
		   .data(aggFilteredData)
		   .join("line")
		   .style("stroke", d => colors[d.level])
		   .style("stroke-width", d => d.count)
		   .style("opacity", 1)
		   .attr("source", d => d.source)
		   .attr("target", d => d.target)
		   .attr("x1", d => categoryScale(categories[d.level]))
		   .attr("x2", d => categoryScale(categories[d.level + 1]))
		   .attr("y1", function(d) {
		    	var scale = scaleDict[categories[d.level]]
		    	return scale(d.source)
		   })
		   .attr("y2", function(d) {
		    	var scale = scaleDict[categories[d.level + 1]]
		    	return scale(d.target)
		   })

		    div.transition()		
                .duration(20)		
                .style("opacity", .9);

            var selectedPapers = bib.filter(function(item) {
            	return d.paper_list.indexOf(item.index) > -1 
            })

			for (var b = 0; b < selectedPapers.length; b++) {
				var item = selectedPapers[b]
				var snippet = ""
				if (item['index'] in d['snippets']) {
					snippet = d['snippets'][item['index']]
				}

				$(".papersListInner").append(
					`<div class='bibItem'>
						<div class='citation'>
						[${item['index']}] ${item['author']} (${item['year']}). ${item['title']}.
						</div>
						<div class='snippet'>
						${snippet}
						</div>
					</div>`
				)
			}

	}

	function handleMouseOut(event, d) {
		if (clicked) {return;}
		$("circle").css("opacity", circleOrigOpacity).css('stroke', 'none')
		$(".label").css("opacity", textOrigOpacity)
		$(".bibItem").remove()
		d3.select(".selectedLines").selectAll("line").remove()
		div.html("")
		div.transition()		
           .duration(50)		
           .style("opacity", 0);
	}

})

$(".papersList").append(
	"<div style='font-family: Open Sans;'>papers & snippets</div>")
$(".papersList").append("<div class='papersListInner'></div>")

for (var b = 0; b < bib.length; b++) {
	var item = bib[b]
	$(".papersListInner").append(
		`<div class='bibItem'>
			<div class='citation'>
			[${b}] ${item['author']} (${item['year']}). ${item['title']}.
			</div>
			<div class='snippet'></div>
		</div>`
	)
}

$(".citation").css("opacity", 0.5)

