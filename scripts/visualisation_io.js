// Copyright (c) 2013, Matthew Gregory Browne (reversed) moc.liamg@azgbdo

// Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
// Constants
var w = 600;
var h = 600;
var svgPadding = 60; // Used for scaling to ensure visibility of whole circles
var circleRaduis = 12; // Raduis of a large coloured circle
var raduisShrinkage = 4; // Amount the raduis shrink by when changing to a small grey circle
var labelOffset = 25; // The offset of the text label relative to the y-axis

// Global vars
var data; // the  datajoin object for d3
var tags; // Tag wieghts for sliders
var userDict; // user data (index corresponds to that of points.json)
var pointDict; // points (index corresponds to the users from user_data.json)
var showcased; // Stores boolean state of showcased for a key is the id, value is the boolean showcase

// For bug where text labels are only half their supposed x value
// See http://stackoverflow.com/questions/7000190/detect-all-firefox-versions-in-js
// for this solution.
var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

// Load each style sheet
var doc = document; // shortcut

// Pull in the main css file
var cssId = 'widgetCss';
if (!doc.getElementById(cssId)) {
	var head = doc.getElementsByTagName('head')[0];
	var link = doc.createElement('link');
	link.id = cssId;
	link.rel = 'stylesheet';
	link.type = 'text/css';
	// link.href = 'https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/styles/widget.css';
	link.href = 'styles/widget.css';
	link.media = 'all';
	head.appendChild(link);
}

// Grab the theme css file
var cssId = 'themeCss';
if (!doc.getElementById(cssId)) {
	var head = doc.getElementsByTagName('head')[0];
	var link = doc.createElement('link');
	link.id = cssId;
	link.rel = 'stylesheet';
	link.type = 'text/css';
	// link.href = 'https://raw.github.com/qubz/YourView-Political-Alignment-Visualisation/master/styles/absolution.css';
	link.href = 'styles/absolution.css';
	link.media = 'all';
	head.appendChild(link);
}

// Load jQuery.js using only JS
var jQueryUrl = '//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js';
var jQueryUiUrl = '//ajax.googleapis.com/ajax/libs/jqueryui/1.10.2/jquery-ui.min.js';
var d3Url = 'http://d3js.org/d3.v2.js';

function loadScript(url, callback) {
	// adding the script tag to the head as suggested before
	var head = document.getElementsByTagName('head')[0];
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url;

	// then bind the event to the callback function 
	// there are several events for cross browser compatibility
	script.onreadystatechange = callback;
	script.onload = callback;

	// fire the loading
	head.appendChild(script);
}

var jQueryLoadedCallback = function() {
	loadScript(jQueryUiUrl, jQueryUILoadedCallback);
};

var jQueryUILoadedCallback = function() {
	loadScript(d3Url, d3LoadedCallback);
};

var d3LoadedCallback = function() {
	// Everything is loaded, ready to run the rest of the code
	$(document).ready(function() {
		// jQuery stuff to build DOM from this script
		var widget = document.getElementById("yourview-visualization");
		var map = $("<div id='map'></div>");
		var controls = $("<div id='controls'></div>");

		map.appendTo(widget);
		controls.appendTo(widget);

		// Initiealise the controls; the tabs.

		function initControls() {
			var tabs = $("<div id='tabs' class='container'></div>");
			tabs.appendTo(controls);

			var ul = $("<ul></ul>");
			ul.appendTo(tabs);

			var li = $("<li></li>");
			li.appendTo(ul);

			var tab1Title = $("<a href='#tabs-1'>Areas</a>");
			tab1Title.appendTo(li);

			var li = $("<li></li>");
			li.appendTo(ul);

			var tab2Title = $("<a href='#tabs-2'>Entities</a>");
			tab2Title.appendTo(li);

			var tab1 = $("<div id='tabs-1' class='panel'></div>");
			tab1.appendTo(tabs);

			// Decribe the function of the tag weights to the user
			var sliderHeaderTitle = $("<p id='slider-header-title' ><-- Less -- IMPORTANT -- More --></p>");
			sliderHeaderTitle.appendTo(tab1);

			// Tag weight sliders
			// Iterate through tags adding the name and weight to each slider
			var sliders = [];
			for (var i = 0; i < tags.length; i++) {
				sliders.push($("<p>" + tags[i].name + "</p><div id='" + tags[i].id + "'></div>"));
				sliders[i].appendTo(tab1);

				$("#" + tags[i].id).slider({
					value: tags[i].weight,
					min: 0,
					max: 1,
					step: 0.25
				}).on("slidestop", function(event, ui) {
					update();
				});
			}

			var tab2 = $("<div id='tabs-2' class='panel'></div>");
			tab2.appendTo(tabs);

			var table = $("<table></table>");
			table.appendTo(tab2);

			// Iterate through every user an add a button for notable users
			for (var key in userDict) {
				if (userDict.hasOwnProperty(key)) {
					// Only create buttons for notable users
					if (userDict[key].notable) {
						var tr = $("<tr></tr>");
						tr.appendTo(table);

						var td = $("<td></td>");
						td.appendTo(tr);

						var button = $("<button id='" + key + "' class='button'>" + userDict[key].username + "</button>");
						console.log(key + " " + userDict[key].username);

						if (!userDict[key].showcase)
							button.addClass("button_clicked");

						button.appendTo(td);

						// CLick listener
						button.click(function() {
							// Grab the id which was set as the key
							var id = $(this).attr('id');
							console.log(id + "");
							// toggle the boolean in showcased
							showcased[id].showcase = !showcased[id].showcase;
							// If the circle is large and coloured, remove the clicked state overlay
							if (showcased[id].showcase) $(this).removeClass("button_clicked");
							// else it is grey and small, so show its has been toggled
							else $(this).addClass("button_clicked");
							// call the toggle function
							toggleEntity();
						});


					}
				}
			}

			$(function() {
				$("#tabs").tabs();
			});
		}

		// ~~~~~~~~~~~~~~~~~~~~~~~~~~d3 stuff~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

		var svg = d3.select("#map")
			.append("svg")
			.attr("width", w)
			.attr("height", h);

		// Retrieve user data from user_data.json
		// d3.json("http://staging.yourview.org.au/visualization/user_data.json?forum=1", function(json) {
		d3.json("json/user_data.json", function(json) {
			userDict = json.users;
			tags = json.tags;
			initShowcased();
			initControls();
			initMap();
		});

		function initMap() {
			// d3.json("http://staging.yourview.org.au/visualization/points.json?forum=1", function(json) {
			d3.json("json/points.json", function(json) {
				pointDict = scale(json);
				data = createData();
				enter();
			});
		}

		// Map the input domain given in the x and y coordunates 
		// to the output range defined by the width - padding
		// This could also be done in enter/update when setting x and y attributes.

		function scale(json) {
			var xs = [];
			var ys = [];

			for (var key in json) {
				if (json.hasOwnProperty(key)) {
					xs.push(json[key][0]);
					ys.push(json[key][1]);
				}
			}

			var xMin = d3.min(xs);
			var xMax = d3.max(xs);
			var yMin = d3.min(ys);
			var yMax = d3.max(ys);

			if (xMin < yMin) var min = xMin;
			else var min = yMin;

			if (xMax > yMax) var max = xMax;
			else var max = yMax;

			var linearScale = d3.scale.linear()
				.domain([min, max])
				.range([0 + svgPadding, w - svgPadding]);

			var i = 0;
			for (var key in json) {
				if (json.hasOwnProperty(key)) {
					json[key][0] = linearScale(xs[i]);
					json[key][1] = linearScale(ys[i]);
					i++;
				}
			}

			return json;
		}


		// Set the boolean showcase state array for all points

		function initShowcased() {
			showcased = {};
			for (var key in userDict) {
				if (userDict.hasOwnProperty(key)) {
					showcased[key] = {
						showcase: userDict[key].showcase
					};
				}
			}
		}

		// Boolean function returns true if the dot is set to showcase

		function isShowcased(d) {
			return showcased[d.id].showcase ? true : false;
		}

		// Combines user data and point data into the d3 data object.

		function createData() {
			var dataset = [];
			for (var key in userDict) {
				if (userDict.hasOwnProperty(key)) {
					dataset.push({
						x: pointDict[key][0],
						y: pointDict[key][1],
						colour: userDict[key].colour,
						cred: userDict[key].cred,
						id: key,
						index: userDict[key].index,
						link: userDict[key].link,
						notable: userDict[key].notable,
						showcase: userDict[key].showcase,
						username: userDict[key].username
					});
				}
			}

			return dataset;
		}

		// Key function
		// see - http://bost.ocks.org/mike/selection/#key

		function id(d) {
			return d.id;
		}

		// Called by sort() to order grey dots ontop of coloured dots

		function showcaseZOrderOnTop(a, b) {
			return d3.ascending(isShowcased(a), isShowcased(b));
		}

		var previousIndex;

		function chooseRandDummyFile() {
			var array = [];

			path1 = "json/dummy_points1.json";
			path2 = "json/dummy_points2.json";
			path3 = "json/dummy_points3.json";
			path4 = "json/dummy_points4.json";
			path5 = "json/dummy_points5.json";

			array.push(path1);
			array.push(path2);
			array.push(path3);
			array.push(path4);
			array.push(path5);

			// Make sure we choose an index different to the last one.
			while (true) {
				index = Math.floor((Math.random() * 5) + 1);
				if (previousIndex != index) break;
			}

			previousIndex = index;
			console.log(array[index - 1]);
			return array[index - 1];
		}

		// The d3 enter event wrapper.
		// This is called only once, after the page is first loaded
		// Not a remove event is not used in this script.

		function enter() {
			var g = svg.selectAll("g")
				.data(data, id)
				.enter()
				.append("g")
				.on("mouseover", function(d) {
				var sel = d3.select(this);
				sel.moveToFront();
				console.log(d.username);
			});

			// Sort all group elements so that coloured dots always appear at the bottom
			g.sort(showcaseZOrderOnTop);

			g.append("circle")
				.attr("cx", function(d) {
				return d.x;
			})
				.attr("cy", function(d) {
				return d.y;
			})
				.style("opacity", function(d) {
				return 0.7;
			})
				.style("stroke", function(d) {
				if (isShowcased(d)) return "dark" + d.colour;
				else return "dimgrey";
			})
				.style("stroke-width", 1)
				.style("fill", function(d) {
				if (isShowcased(d)) return d.colour;
				return "grey";
			})
				.transition()
				.duration(700)
				.attr("r", function(d, i) {
				if (isShowcased(d)) return circleRaduis;
				else return circleRaduis - raduisShrinkage;
			});

			g.append("text")
				.attr("dx", function(d) {
				if (is_firefox) return d.x * 2;
				return d.x;
			})
				.attr("dy", function(d) {
				return d.y + labelOffset;
			})
				.attr("font-family", "sans-serif")
				.attr("font-size", "13px")
				.style("opacity", function(d) {
				if (isShowcased(d)) return 1.0;
				else return 0.0;
			})
				.style("text-anchor", "middle")
				.text(function(d) {
				return d.username;
			});

			g.append("svg:title")
				.text(function(d) {
				return d.username;
			});

		}

		function update() {
			d3.json(chooseRandDummyFile(), function(json) {
				pointDict = scale(json);
				// update datapoints
				data = createData();

				svg.selectAll("g")
					.data(data, id)
					.on("mouseover", function(d) {
					var sel = d3.select(this);
					sel.moveToFront();
					console.log(d.username);
				});

				// enter() and append() are omitted for a transision
				svg.selectAll("circle")
					.data(data, id)
					.transition()
					.duration(1100)
					.attr("cx", function(d) {
					return d.x;
				})
					.attr("cy", function(d) {
					return d.y;
				})
					.attr("r", function(d) {
					if (isShowcased(d)) return circleRaduis;
					else return circleRaduis - raduisShrinkage;
				})
					.style("stroke", function(d) {
					if (isShowcased(d)) return "dark" + d.colour;
					else return "dimgrey";
				})
					.style("stroke-width", 1)
					.style("fill", function(d) {
					if (isShowcased(d)) return d.colour;
					return "grey";
				});

				svg.selectAll("text")
					.data(data, id)
					.transition()
					.duration(1100)
					.attr("dx", function(d) {
					if (is_firefox) return d.x * 2;
					return d.x;
				})
					.attr("dy", function(d) {
					return d.y + labelOffset;
				})
					.attr("font-family", "sans-serif")
					.attr("font-size", "13px")
					.style("text-anchor", "middle")
					.text(function(d) {
					return d.username;
				});

			});
		}

		function toggleEntity() {
			// Sort all group elements so that coloured dots always appear at the bottom
			svg.selectAll('g')
				.sort(showcaseZOrderOnTop);

			// Set the dot to grey and smaller when not showcased
			svg.selectAll('circle')
				.transition()
				.duration(500)
				.attr("r", function(d) {
				if (isShowcased(d)) return circleRaduis;
				else return circleRaduis - raduisShrinkage;
			})
				.style("stroke", function(d) {
				if ((isShowcased(d)) && d.colour == "grey") return "dimgrey";
				else if (isShowcased(d)) {
					return "dark" + d.colour;
				} else {
					return "dimgrey";
				}
			})
				.style("stroke-width", 1)
				.style("fill", function(d) {
				if (isShowcased(d)) return d.colour;
				else return "grey";
			});

			// Hide the text if it dot is not a showcase
			svg.selectAll('text')
				.transition()
				.duration(500)
				.style("opacity", function(d) {
				if (isShowcased(d)) return 1.0;
				else return 0.0;
			});

		}

		d3.selection.prototype.moveToFront = function() {
			return this.each(function() {
				this.parentNode.appendChild(this);
			});
		};

	});
};

loadScript(jQueryUrl, jQueryLoadedCallback);