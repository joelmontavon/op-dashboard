var services = angular.module('chartServices', []);
services.factory("horBarChart", ["d3", "tip", "_", 
	function(d3, tip, _) {
	  return function (data, id, options) {
      var yColumn = options.yColumn || "contract";
      var xColumn = options.xColumn || "score";
      //var len = _.uniq(_.pluck(data, yColumn)).length;
      var len = data.length;
      var domain = options.domain || [1, 0.5];
      var xAxis = options.xAxis || d3.format("%");
    
      var barHeight = 20;
      var barPadding = 0.2;
      var margin = {
        left: 90,
        top: 30,
        right: 30,
        bottom: 30
      };
      var outerWidth = 500;
      var innerWidth = outerWidth - margin.left - margin.right;
      var innerHeight = (len || data.length) * barHeight;
      var outerHeight = innerHeight + margin.top + margin.bottom;

      var svg = d3.select(id)
        .attr("height", outerHeight)
        .attr("width", outerWidth);
    
      var g = svg.select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
      g.selectAll('g.axis').remove();
      var xAxisG = g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + innerHeight + ")");
      var yAxisG = g.append("g")
        .attr("class", "y axis");
    
      var yScale = d3.scale.ordinal()
        .rangeBands([0, innerHeight], barPadding)
        .domain(data.map(function(d) {
          return d[yColumn];
        }));
      var xScale = d3.scale.linear()
        .range([innerWidth, 0])
        .domain(domain);
    
      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(5)
        .tickFormat(xAxis)
        .outerTickSize(0);
      var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .outerTickSize(0);
    
      yAxisG.call(yAxis);
      xAxisG.call(xAxis);
      g.call(tip);

      var bars = g.selectAll("rect")
        .data(data);
      bars.enter()
        .append('rect')
        .attr("height", yScale.rangeBand())
        .attr("y", function(d) {
          return yScale(d[yColumn]);
        })
        .on("mouseover", function(d) {
          if (options.mouseover) {
            tip.html(options.mouseover(d));
            tip.show(d);
          }
      })
      .on("mouseout", tip.hide);
      bars
        .style('fill', options.color);
      bars.transition()
        .duration(750)
        .attr('class', options.class)
        .attr("width", function(d) {
          return xScale(d[xColumn]);
        });
      bars.exit().remove();
    
      var lineFn = d3.svg.line()
        .x(function(d) {
          return xScale(d.x);
        })
        .y(function(d) {
          return d.y;
        })
        .interpolate('linear');
      
      if(options.threshold) {  
        var lines = g.selectAll('g.threshold')
          .data(data);  
        lines.enter()
          .append('g')
          .attr('class', 'threshold');
        lines.transition()
          .duration(750)
          .each(function (d, i) {
            var lineData = [{
              x: d[options.threshold],
              y: (i * barHeight)
            }, {
              x: d[options.threshold],
              y: ((i + 1) * barHeight)
            }];
              
            var line = d3.select(this).selectAll('path.line')
              .data(function (d) {
                return [d];
              });
            line.enter()
              .append('path')
              .attr('class', 'line')
              .style("stroke", "#2196f3")
              .style("stroke-width", "5px");
            line.transition()
              .duration(750)
              .attr('d', lineFn(lineData));
            line.exit().remove();
          });
        lines.exit().remove();
      } else {
        if (lines) lines.remove();
      }
    };
	}
]);
services.factory("donutChart", ["d3",
	function(d3) {
	  return function (data, id, options) {

      var width = 250;
      var height = 250;
      var radius = Math.min(width, height) / 2;
    
      switch(data.length) {
		case 1:
			var color = d3.scale.ordinal().range(['#2c9c69']);
		case 2:
			var color = d3.scale.ordinal().range(['#2c9c69', '#c62f29']);
		case 3:
			var color = d3.scale.ordinal().range(['#2c9c69', '#dbba34', '#c62f29']);
      }
    
      var arc = d3.svg.arc()
        .outerRadius(radius - 10)
        .innerRadius(radius - 70);
    
      var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) {
          return d.members;
        });
    
      var svg = d3.select(id)
        .attr("height", height)
        .attr("width", width);
      var g = svg.select("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    
      var path = g.selectAll("path")
        .data(pie(data));
    
      path.enter().append("path")
        .attr("class", id)
        .style("fill", options.colors)
        .attr("d", arc)
        .each(function(d) {
          this._current = d;
        });
		
	  path.exit().remove();
    
      g.append("text")
        .attr("class", "inner-label")
        .attr("text-anchor", "middle")
        .attr("dy", "+0.5em")
        .style("font-size", 24);   
		
      path.transition()
        .duration(750)
        .style("fill", options.colors)
        .attrTween("d", arcTween);

	  path.on("mouseover", options.mouseover)
        .on("mouseout", options.mouseout)
        .on("click", options.click);
    
      function arcTween(a) {
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function(t) {
          return arc(i(t));
        };
      }
    };
	}
]);
services.factory("table", ["$rootScope", "_", "d3", "lineChart", "vertStackedBarChart",
	function($rootScope, _, d3, rollupService, lineChart, vertStackedBarChart) {
	  return function (data, id, options) {
      var colorScale = d3.scale.ordinal()
        .domain(["1", "0"])
        .range(['#2c9c69', '#c62f29']);
    
      var table = d3.select(id);
      var tbody = table.select("tbody");
      var rows = tbody.selectAll('tr')
        .data(data);
      rows.enter().append('tr')
        .on("mouseover", options.mouseover);
    
      var contractCells = rows.selectAll('td.contract')
        .data(options.label);
      contractCells.enter().append('td').attr('class', 'contract');
      contractCells.transition()
        .duration(750)
        .text(function(d) {
          return d;
        });
    
      var membersCells = rows.selectAll('td.members')
        .data(function(d) {
          return [d.members];
        });
      membersCells.enter().append('td').attr('class', 'members');
      membersCells.transition()
        .duration(750)
        .text(function(d) {
          return d3.format(",")(d);
        });
	
      rows.selectAll('td.scores').remove();
      var scoresCells = rows.selectAll('td.scores')
        .data(function(d) {
          return [{
            score: !_.isUndefined(d.diabetesScore) ? d.diabetesScore : '',
            fourStars: !_.isUndefined(d.diabetesFourStars) ? d.diabetesFourStars : ''
          }, {
            score: !_.isUndefined(d.highBloodPressureScore) ? d.highBloodPressureScore : '',
            fourStars: !_.isUndefined(d.highBloodPressureFourStars) ? d.highBloodPressureFourStars : ''
          }, {
            score: !_.isUndefined(d.highCholesterolScore) ? d.highCholesterolScore : '',
            fourStars: !_.isUndefined(d.highCholesterolFourStars) ? d.highCholesterolFourStars : ''
          }];
        });
      scoresCells.enter().append('td')
        .attr('class', 'scores')
        .append('svg')
        .attr('height', 50)
        .attr('width', 100)
        .append('g')
        .each(function(d) {
          d3.select(this).append("circle");
          d3.select(this).append("text");
        });
      scoresCells.transition()
        .duration(750)
        .selectAll('text')
        .attr('x', 25)
        .attr('y', 30)
        .text(function(d) {
		  if (d.score !== '')
            return d3.format('%')(d.score);
        })
        .style("fill", function(d) {
		  if (d.fourStars !== '')
            return colorScale(d.fourStars);
        })
        .style("color", function(d) {
		  if (d.fourStars !== '')
            return colorScale(d.fourStars);
        })
        .style("text-anchor", "middle");
    
      scoresCells.transition()
        .duration(750)
        .select('circle')
        .attr('cx', 25)
        .attr('cy', 25)
        .attr('r', 20)
        .style('fill', 'none')
        .style('stroke', function(d) {
			if (d.fourStars !== '')
          return colorScale(d.fourStars);
        });
    
      rows.exit().remove();
      scoresCells.exit().remove();
    };
	}
]);
services.factory("vertStackedBarChart", ["d3", "tip",
	function(d3, tip) {
	  return function (data, id) {
      var xColumn = "month";
      var yColumns = ["diabetes", "highBloodPressure", "highCholesterol"];
      var months = ['Jan','Feb','Mar','Apr','May','Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	  
      var barWidth = 50;
      var barPadding = 0.2;
      var margin = {
        left: 90,
        top: 30,
        right: 30,
        bottom: 90
      };
      var outerHeight = 250;
      var innerHeight = outerHeight - margin.top - margin.bottom;
      var innerWidth = data.length * barWidth;
      var outerWidth = innerWidth + margin.left + margin.right;
    
      var svg = d3.select(id)
        .attr("height", outerHeight)
        .attr("width", outerWidth);
    
      var g = svg.select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
      g.selectAll('g.axis').remove();
      var xAxisG = g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + innerHeight + ")");
      var yAxisG = g.append("g")
        .attr("class", "y axis");
    
      var xScale = d3.scale.ordinal()
        .rangeBands([0, innerWidth], barPadding)
        .domain(data.map(function(d) {
          return d[xColumn];
        }));
      var yScale = d3.scale.linear()
        .range([innerHeight, 0])
        .domain([0, Math.max(d3.max(data, function(d) {
          return d.diabetesMembersToGoal + d.highBloodPressureMembersToGoal + d.highCholesterolMembersToGoal;
        }), 100)]);
    
      var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(5)
        .outerTickSize(0);
      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .tickFormat(function (d) { return months[d - 1]; })
        .outerTickSize(0);
    
      yAxisG.call(yAxis);
      xAxisG.call(xAxis);
      g.call(tip);

      var bars = bars || {};
      bars.g = g.selectAll("g.bars")
        .data(data);
      bars.g.enter().append("g")
        .attr("class", "bars")
        .on("mouseover", function(d) {
          var total = d3.round(d.diabetesMembersToGoal + d.highBloodPressureMembersToGoal + d.highCholesterolMembersToGoal);
          tip.html(['<div><strong>',
            d.contract,
            '</strong></div>',
            '<div>Diabetes: ',
            d3.format(",")(d3.round(d.diabetesMembersToGoal)),
            '</div>',
            '<div>RASAs: ',
            d3.format(",")(d3.round(d.highBloodPressureMembersToGoal)),
            '</div>',
            '<div>Statins: ',
            d3.format(",")(d3.round(d.highCholesterolMembersToGoal)),
            '</div>',
            '<div>Total: ',
            d3.format(",")(total),
            '</div>'
            ].join(''));
          tip.show(d);
        })
        .on("mouseout", tip.hide);
    
      var yValue = function (d, i) {
        var result = 0;
        for (var j = 0; j <= i; j++) {
          result += d[yColumns[j] + 'MembersToGoal'];
        }
        return result;
      }

      for (var i = 0; i < yColumns.length; i++) {
        var measure = yColumns[i];
        bars[measure] = bars.g.selectAll("rect." + measure)
          .data(function(d) {
            return [d];
          });
        bars[measure].enter().append('rect')
          .attr('class', function(d) {
            return d[measure + 'FourStars'] != 1 ? (measure + ' below_cutpoint') : (measure + ' above_cutpoint');
          })
          .attr("width", xScale.rangeBand())
          .attr("x", function(d) {
            return xScale(d[xColumn]);
          });
        bars[measure].transition()
          .duration(750)
          .attr('y', function(d) {
            return yScale(yValue(d, i));
          })
          .attr("height", function(d) {
            return innerHeight - yScale(d[measure + 'MembersToGoal']);
          });
        bars[measure].exit().remove();
      }
	  }
	}
]);
services.factory("vertBarChart", ["d3", "tip",
	function(d3, tip) {
	  return function (data, id, options) {
      options.xColumn = options.xColumn || "key";
      options.yColumn = options.yColumn || "days_to_refill";
      options.barWidth = options.barWidth || 65;
	  
      var barPadding = 0.2;
      var margin = {
        left: 90,
        top: 30,
        right: 30,
        bottom: 90
      };
      var outerHeight = 250;
      var innerHeight = outerHeight - margin.top - margin.bottom;
      var innerWidth = data.length * options.barWidth;
      var outerWidth = innerWidth + margin.left + margin.right;
    
      var svg = d3.select(id)
        .attr("height", outerHeight)
        .attr("width", outerWidth);
    
      var g = svg.select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
      g.selectAll('g.axis').remove();
      var xAxisG = g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + innerHeight + ")");
      var yAxisG = g.append("g")
        .attr("class", "y axis");
    
      var xScale = d3.scale.ordinal()
        .rangeBands([0, innerWidth], barPadding)
        .domain(data.map(function(d) {
          return d[options.xColumn];
        }));
      var yScale = d3.scale.linear()
        .range([innerHeight, 0])
        .domain([0, d3.max(data, function(d) {
          return d[options.yColumn];
        })]);
    
      var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(5)
        .outerTickSize(0);
      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .outerTickSize(0);
    
      yAxisG.call(yAxis);
      xAxisG.call(xAxis)
        .selectAll(".tick text")
        .call(wrap, xScale.rangeBand());
      g.call(tip);

      function wrap(text, width) {
        text.each(function() {
          var text = d3.select(this),
              words = text.text().split(/\s+/).reverse(),
              word,
              line = [],
              lineNumber = 0,
              lineHeight = 1.1,
              y = text.attr("y"),
              dy = parseFloat(text.attr("dy")),
              tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
          while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width && line.length > 1) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
          }
        });
      };

      var bars = g.selectAll("rect")
        .data(data);
      bars.enter().append('rect')
        .attr("width", xScale.rangeBand())
        .attr("x", function(d) {
          return xScale(d[options.xColumn]);
        });
      bars.transition()
        .duration(750)
        .attr('y', function(d) {
          return yScale(d[options.yColumn]);
        })
        .attr("height", function(d) {
          return innerHeight - yScale(d[options.yColumn]);
        });
      bars.exit().remove();
	  }
	}
]);
services.factory("lineChart", ["d3", "tip", "_",
	function(d3, tip, _) {
	  return function (options) {
    
      var margin = {
        left: 90,
        top: 30,
        right: 30,
        bottom: 30
      };
      var outerHeight = 250;
      var innerHeight = outerHeight - margin.top - margin.bottom;
      var innerWidth = options.data.length * 50;
      var outerWidth = innerWidth + margin.left + margin.right;
    
      var svg = d3.select(options.id)
        .attr("height", outerHeight)
        .attr("width", outerWidth);
    
      var g = svg.select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      g.selectAll("g.axis").remove();
      
      var xAxisG = g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + innerHeight + ")");
      var yAxisG = g.append("g")
        .attr("class", "y axis");
    
      var yScale = d3.scale.linear()
        .range([innerHeight, 0])
        .domain(options.yScale);
      var xScale = d3.scale.linear()
        .range([0, innerWidth])
        .domain(d3.extent(options.data, function(d) {
          return d[options.xColumn];
        }));
    
      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(options.data.length)
        .tickFormat(options.xTickFormat)
        .outerTickSize(0);
      var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(5)
        .tickFormat(options.yTickFormat)
        .outerTickSize(0);
    
      yAxisG.call(yAxis);
      xAxisG.call(xAxis);
      g.call(tip);
      
      var showTip = function (d) {
        tip.html(options.tip)
          .show(d);
      };

      var lines = lines || {};
      for (var i = 0; i < options.yColumns.length; i++) {
        var yColumn = options.yColumns[i];
        lines[yColumn] = lines[yColumn] || {};

        lines[yColumn]['fn'] = d3.svg.line()
          .x(function(d) {
            return xScale(d[options.xColumn]);
          })
          .y(function(d) {
            return yScale(d[yColumn]);
          })
          .interpolate('linear');        
        lines[yColumn]['path'] = g.selectAll('path.' + _.kebabCase(yColumn))
          .data([null]);
        lines[yColumn]['path'].enter()
          .append('path')
          .attr('class', _.kebabCase(yColumn))
          .style("fill", "none");
        lines[yColumn]['path'].transition()
          .duration(750)
          .attr('d', lines[yColumn]['fn'](options.data));
        lines[yColumn]['path'].exit().remove();
        
        lines[yColumn]['innerCircle'] = g.selectAll("circle.innerCircle." + _.kebabCase(yColumn))
          .data(options.data);
        lines[yColumn]['innerCircle'].enter().append("circle")
          .attr('class', function (d) {
            return 'innerCircle ' + _.kebabCase(yColumn) + ' month' + d.month;
          })
          .attr("r", 2.5)
          .on("mouseover", function(d) {
            d3.select(this).transition()
              .attr("r", 5);
            showTip(d);
          })
          .on("mouseout", function(d) {
            d3.select(this).transition()
              .attr("r", 2.5);
            tip.hide();
          });
        lines[yColumn]['innerCircle'].transition()
          .duration(750)
          .attr("cx", function(d) {
            return xScale(d[options.xColumn]);
          })
          .attr("cy", function(d) {
            return yScale(d[yColumn]);
          })
          ;
        lines[yColumn]['innerCircle'].exit().remove();
      }
	  }
	}
]);
