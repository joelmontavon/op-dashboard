var year = 2015;
var month = 12;
var contract = 'H5521';

var controllers = angular.module('controllers', []);
controllers.controller('activityController', function($scope, d3, _, queryCSV, activityDataService, horBarChart, lineChart) {
  var months = ['Jan','Feb','Mar','Apr','May','Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  $scope.options = [
    {name: 'Targeted Members', value: 'targeted_members', color: '8, 188, 228'},
    {name: 'Targeted per Member', value: 'targeted_per_member', color: '8, 188, 228'},
    {name: '% Outreached', value: 'outreached_percent', color: '125, 63, 152'},
    {name: '% Reached', value: 'reached_percent', color:'122, 193, 67'},
    {name: '% Completed', value: 'engaged_percent', color:'0, 167, 142'}
  ];
  $scope.selected = $scope.options[0].value;
  var selected = $scope.options[0];

  var updateDetail = function () { 
	activityDataService.updateDetail({selected: selected.value, color: selected.color}).then(function (data) {
	  var barChart = _.slice(data.barChart.filter(function (item) {return item.pct > .01;}), 0, 19);
      var x = d3.scale.linear()
        .domain(d3.extent(barChart, function (item) { return item[selected.value]}))
        .range([0,1]);
        data.mapFills = {};
          data.mapData = {};
          data.barChart.forEach(function (item) {
            data.mapFills[item.state] = 'rgba(' + selected.color + ', ' + x(item[selected.value]) + ")";
            data.mapData[item.state] = item;
            data.mapData[item.state].fillKey = item.state;
          });

	  horBarChart(barChart, "#activity-bar-chart", {
		yColumn: "state",
		xColumn: selected.value,
		domain: _.reverse(d3.extent(barChart, function (item) { return item[selected.value]})),
		xAxis: (selected.value == 'targeted_members' || selected.value == 'targeted_per_member') ? d3.format(",") : d3.format("%"),
		mouseover: function (d) { 
		  return ['<div><strong>',
			d.item,
			'</strong></div>',
			'<div>',
			selected.name,
			': ',
			selected.value == 'targeted_per_member' ? d3.round(d[selected.value], 1) : (d3.format((selected.value == 'targeted_members') ? "," : "%")(d[selected.value])),
			'</div>'].join('');
		  },
		  color: function (d) {
			return 'rgba(' + selected.color + ', ' + x(d[selected.value]) + ")";
		  }
		});
		  
      var options = {
        scope: 'usa',
        element: document.getElementById('map'),
        projection: 'mercator',
        height: 500,
        fills: data.mapFills,
        data: data.mapData,
        geographyConfig: {
          popupTemplate: function(geo, data) {
			if (data)
				return ['<div class="d3-tip"><table><thead><tr><th>',
				  geo.properties.name,
				  '</th></tr></thead><tbody>',
				  '<tr><td>Members: ',
				  d3.format(",")(data.members),        
				  '</td></tr>',
				  '<tr><td>Targeted: ',
				  d3.format(",")(data.targeted_members),
				  ' (' + d3.round(data.targeted_per_member, 1) + ")",          
				  '</td></tr>',
				  '<tr><td>Outreached: ',
				  d3.format(",")(data.outreached_members),
				  ' (' + d3.format('%')(data.outreached_percent) + ")",
				  '</td></tr>',
				  '<tr><td>Reached: ',
				  d3.format(",")(data.reached_members),
				  ' (' + d3.format('%')(data.reached_percent) + ")",
				  '</td></tr>',
				  '<tr><td>Engaged: ',
				  d3.format(",")(data.engaged_members),
				  ' (' + d3.format('%')(data.engaged_percent) + ")",
				  '</td></tr>',
				  '</tbody></table>',
				  '</div>'
				].join('');
          },
          borderWidth:  1,
          borderColor: 'rgba(127, 127, 127, 1)',
          highlightFillColor: 'rgba(127, 127, 127, .5)',
          highlightBorderColor: 'rgba(127, 127, 127, 1)',
          highlightBorderWidth: 2
        }
      };
    
      if (map) d3.select('#map').html('');
      map = new Datamap(options);

	});
  };
  
  var update = function () {
	activityDataService.update({year: year, month: month}).then(function (data) {
	  $scope.$apply(function () {
		$scope.table = data.table;
	  });
	  lineChart({
		data: data.line, 
		id: '#activity-line-chart', 
		xColumn: "month",
		yColumns: ["Customer Service",'Nurse - Aetna','Nurse - Coventry','Pharmacist','Silverlink','U of Fl'],
		yScale: [0,30],//d3.extent(data.line, function(item) {return _.max(_.values(item));}),
		xTickFormat: function (d) { return months[d - 1]; },
		tip: function (d) {
		  return ['</div>',
			'<div>Customer Service: ',
			d3.round(d['Customer Service'], 0),
			'</div>',
			'<div>Nurse - Aetna: ',
			d3.round(d['Nurse - Aetna'], 0),
			'</div>',
			'<div>Nurse - Coventry: ',
			d3.round(d['Nurse - Coventry'], 0),
			'</div>',
			'<div>Pharmacist: ',
			d3.round(d['Pharmacist'], 0),
			'</div>',
			'<div>Silverlink: ',
			d3.round(d['Silverlink'], 0),
			'</div>',
			'<div>U of Fl: ',
			d3.round(d['U of Fl'], 0),
			'</div>'].join('');
		}
	  });

	  updateDetail();
	});
  };
    
  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    update();
  });
	
  $scope.selectChanged = function() {
  	selected = _.find($scope.options, function (item) {
  	  return item.value == $scope.selected;
  	});
  	updateDetail();
  };

});

controllers.controller('contractsController', function($scope, contractDataService, donutChart, table, lineChart, vertStackedBarChart) {
  var months = ['Jan','Feb','Mar','Apr','May','Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var data = {};
  var options = {
    year: year,
    month: month,
    contract: contract,
    members: 252610
  };
  $scope.contract = contract;

  var update = function() {
    contractDataService.update(options).then(function(data){
      table(data.table, '#contracts-table', {
        label: function(d) {
          return [d.contract_name + ' (' + d.contract + ')'];
        },
        mouseover: function (d) {
          if(options.contract != d.contract) {
            options.contract = d.contract;
            options.members = d.members;
            updateDetail();
          }
        }
      });
      donutChart(data.donut, '#contracts-donut', {
        colors: function(d) {
          var colors = ['#2c9c69', '#dbba34', '#c62f29'];
          switch (d.data.fourStarMeasuresBand) {
            case "All Measures at 4+ Stars":
              return colors[0];
            case '1-2 Measures at 4+ Stars':
              return colors[1];
            case 'No Measures at 4+ Stars':
              return colors[2];
          }
        },
        click: function(d) {
          var chart = d3.select('#contracts-donut');
          var label = chart.select(".inner-label");
          if (label.text() == d3.format("%")(d.data.pct)) {
            table(data.table, '#contracts-table', {
              label: function(d) {
                return [d.contract_name + ' (' + d.contract + ')'];
              },
              mouseover: function (d) {
                options.contract = d.contract;
                options.members = d.members;
                updateDetail();
              }
            });
            label.text(function() {
              return '';
            });
          } else {
            table(data.table.filter(function(obj) {
              return d.data.fourStarMeasuresBand == obj.fourStarMeasuresBand;
            }), '#contracts-table', {
              label: function(d) {
                return [d.contract_name + ' (' + d.contract + ')'];
              },
              mouseover: function (d) {
                options.contract = d.contract;
                options.members = d.members;
                updateDetail();
              }
            });
            label.text(function() {
              return  d3.format("%")(d.data.pct);
            });
          }
        }
      });
      updateDetail();
    });
  };

  var updateDetail = function () {
    contractDataService.updateDetail(options).then(function (data) {
      lineChart({
			data: data.line, 
			id: '#contracts-line-chart',
			xColumn: "month",
			yColumns: ["diabetesScore", "highBloodPressureScore", "highCholesterolScore"],
			yScale: [0.6, 1],
			xTickFormat: function (d) { return months[d - 1]; },
			yTickFormat: d3.format("%"),
			tip: function (d) {
				return ['<div><strong>',
					d.contract,
					'</strong></div>',
					'<div>Diabetes: ',
					d3.format("%")(d['diabetesScore']),
					'</div>',
					'<div>RASAs: ',
					d3.format("%")(d['highBloodPressureScore']),
					'</div>',
					'<div>Statins: ',
					d3.format("%")(d['highCholesterolScore']),
					'</div>'].join('');
			}
		});
      vertStackedBarChart(data.line, '#contracts-bar-chart');
      var index = _.findIndex(data.state, function(item) { return item.pct < .01});
      var max = _.max([index, 5]);
      var arr = _.slice(data.state, 0, index);
      table(arr, '#states-table', {
        label: function(d) {
          return [d.state];
        }
      });
	  $scope.$apply(function () {
		$scope.contract = options.contract;
	  });  
    });
  };

  update();
});

controllers.controller('measuresController', function($scope, $rootScope, d3, _, measureDataService, queryCSV, horBarChart, donutChart, vertBarChart) {
    $scope.options = [
      {name: 'Diabetes', value: 'Diabetes'}, 
      {name: 'High Blood Pressure', value: 'High Blood Pressure'}, 
      {name: 'High Cholesterol', value: 'High Cholesterol'}
    ];
    $scope.thresholds = {
      fourStarThresh: {
        title: 'Members in 4+ Star Contracts',
        good: 'At or Above 4-Stars',
        bad: 'Below 4-Stars'
      },
      goal: {
        title: 'Members in Contracts at Goal',
        good: 'At or Above Goal',
        bad: 'Below Goal'
      }
    }
    $scope.threshold = 'fourStarThresh';
    $scope.measure = $scope.options[0].value;
    $scope.contract = contract;

    var colors = ['#c62f29', '#2c9c69'];
    var options = {
      year: year,
      month: month,
      contract: $scope.contract,
      measure: $scope.options[0].value
    };
    var data = {};

    var update = function () {
      measureDataService.update(options).then(function(data) {
        horBarChart(_.cloneDeep(data.barChart), "#measures-bar-chart", {
          threshold: $scope.threshold, 
          mouseover: function (d) { 
            $scope.contract = d.contract;
            options.contract = d.contract;
            updateDetail();
            return ['<div><strong>',
              d.contract,
              '</strong></div>',
              '<div>Projected Score: ',
              d3.format("%")(d.score),
              '</div>',
              '<div>Projected 4-Star Cutpoint: ',
              d3.format("%")(d.fourStarThresh),
              '</div>',
              '<div>Goal: ',
              d3.format("%")(d.goal),
              '</div>'].join('');
            },
            class: function(d) {
              return ($scope.threshold == 'goal' ? d.membersToGoal > 0 : d.membersToFourStars > 0) ? 'below_cutpoint' : 'above_cutpoint';
            }
          });
          donutChart(data.donut, "#measures-donut", {
            colors: function(d) {
              return colors[d.data.fourStars];
            },
            mouseover: function(d) {
              var chart = d3.select('#measures-donut');
              var label = chart.select(".inner-label")
                .text(function() {
                  return d3.format('%')(d.data.pct);
                })
              var bars = d3.selectAll(d.data.fourStars == 1 ? 'rect.above_cutpoint' : 'rect.below_cutpoint');
              bars.transition()
                .duration(250)
                .style('fill', d.data.fourStars == 1 ? '#2c9c69' : '#c62f29');
            }, 
            mouseout: function(d) {
              var chart = d3.select('#measures-donut');
              chart.select(".inner-label")
                .text(function() {
                    return '';
                  });
              var bars = d3.selectAll(d.data.fourStars == 1 ? 'rect.above_cutpoint' : 'rect.below_cutpoint');
              bars.transition()
                .duration(250)
                .style('fill', '');
            }
          }); 
          updateDetail(); 
        });
      };

      var updateDetail = function () {
        measureDataService.updateDetail(options).then(function(data) {
          vertBarChart(data.vertBarChart, "#measures-vert-bar-chart", {
            xColumn: 'band',
            yColumn: 'members',
            barWidth: 50
          });
      	  $scope.months = ['Jan','Feb','Mar','Apr','May','Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      	  $scope.$apply(function () {
      		  $scope.inplay = data.inplay;
          });
        });
      };

      $scope.measureChanged = function (measure) {
        options.measure = $scope.measure;
        update();
      };

      $scope.thresholdChanged = function (threshold) {
        update();
      };

  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    update();
  });
});

controllers.controller('outcomesController', function($scope, outcomesDataService, lineChart, vertBarChart, d3) {
  var months = ['Jan','Feb','Mar','Apr','May','Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  $scope.options = ['Late to Refill','Preventative','90-Day Supply'];
  $scope.selected = $scope.options[0];
  $scope.program = 'Pharmacist';
  $scope.grouping = 'avg_days_to_refill';
  var options = {
    year: year,
    month: month,
	script: $scope.selected,
	program: $scope.program,
	grouping: 'days_to_refill_band',
	grouping2: 'avg_days_to_refill'
  };
  
  $scope.round = d3.round;
  
  var update = function () {
	  outcomesDataService.update(options).then(function(data) {
		$scope.$apply(function (){
			$scope.nnt = data.table;
			$scope.outcomes = data.table2;
		});
        lineChart({
			data: data.line, 
			id: '#outcomes-line-chart',
			xColumn: "month",
			yColumns: ["Customer Service", "Nurse - Aetna", "Nurse - Coventry", 'Pharmacist'],
			yScale: [0, $scope.selected == 'Preventative' ? 30 : 10],
			xTickFormat: function (d) { return months[d - 1]; },
			yTickFormat: d3.format(",")/*,
			tip: function (d) {
				return ['<div><strong>',
					d.contract,
					'</strong></div>',
					'<div>Diabetes: ',
					d3.format("%")(d['diabetesScore']),
					'</div>',
					'<div>RASAs: ',
					d3.format("%")(d['highBloodPressureScore']),
					'</div>',
					'<div>Statins: ',
					d3.format("%")(d['highCholesterolScore']),
					'</div>'].join('');
			}*/
		});
		updateDetail();
	  });
  };
  
  var updateDetail = function () {
	  outcomesDataService.updateDetail(options).then(function(data) {
          vertBarChart(data.barChart, "#outcomes-vert-bar-chart", {
            xColumn: options.grouping,
            yColumn: 'members',
            barWidth: 50
          });
	  });
  };
  
  $scope.mouseoverProgram = function (item) {
	  $scope.program = item.item.program;
	  options.program = $scope.program;
	  updateDetail();
  };
  
  $scope.selectChanged = function () {
	options.script = $scope.selected;
	options.grouping = options.script == 'Late to Refill' ? 'days_to_refill_band' : 'days_missed_band';
	options.grouping2 = options.script == 'Late to Refill' ? 'avg_days_to_refill' : 'avg_days_missed';
	$scope.grouping = options.script == 'Late to Refill' ? 'avg_days_to_refill' : 'avg_days_missed';
	update();
  };
	  
  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    update();
  });
});
controllers.controller('opportunitiesController', function($scope, opportunitiesDataService, table, donutChart, horBarChart, lineChart) {
  var colors = ['#2c9c69', '#dbba34', '#c62f29'];
  var months = ['Jan','Feb','Mar','Apr','May','Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	
  $scope.groupings = [
    {header: 'Members in 4+ Star Contracts', name: 'Contract', value: 'contract', color: '125, 63, 152'},
    {header: 'Members in 4+ Star Regions', name: 'Region', value: 'region', color: '8, 188, 228'},
    {header: 'Members in 4+ Star States', name: 'State', value: 'state', color:'122, 193, 67'},
    {header: 'Members in 4+ Star Provider Groups', name: 'Provider Group', value: 'provider_group', color:'0, 167, 142'}
  ];
  $scope.selectedGroupingType = $scope.groupings[0].value;
  $scope.selectedGrouping = contract;
  $scope.grouping = $scope.groupings[0];
  $scope.members = 250000;
  
  var update = function () {
    opportunitiesDataService.update({groupingType: $scope.grouping.value}).then(function (data) {
      table(data.table, '#opps-table', {
        label: function(d) {
          return [d[$scope.grouping.value]];
        },
        mouseover: function (d) {
          $scope.members = d.members;
          $scope[$scope.grouping.value] = d[$scope.grouping.value];
          updateDetail();
        }
      });
	  
	  var options = {
        colors: function(d) {
          switch (d.data.fourStarMeasuresBand) {
            case "All Measures at 4+ Stars":
              return colors[0];
            case '1-2 Measures at 4+ Stars':
              return colors[1];
            case 'No Measures at 4+ Stars':
              return colors[2];
          }
        },
        click: function(d) {
          var chart = d3.select('#opps-donut');
          var label = chart.select(".inner-label");
          if (label.text() == d3.format("%")(d.data.pct)) {
            table(data.table, '#opps-table', {
              label: function(d) {
                return [d[$scope.grouping.value]];
              },
              mouseover: function (d) {
                $scope[$scope.grouping.value] = d[$scope.grouping.value];
                $scope.members = d.members;
                updateDetail();
              }
            });
            label.text(function() {
              return '';
            });
          } else {
            table(data.table.filter(function(obj) {
              return d.data.fourStarMeasuresBand == obj.fourStarMeasuresBand;
				}), '#opps-table', {
				  label: function(d) {
				  return [d[$scope.grouping.value]];
				},
				mouseover: function (d) {
				  $scope[$scope.grouping.value] = d[$scope.grouping.value];
				  $scope.members = d.members;
				  updateDetail();
				}
			});
            label.text(function() {
              return  d3.format("%")(d.data.pct);
            });
          }
        }
      };
      donutChart(data.donut, '#opps-donut', options);
      updateDetail();
    });
  };

  var updateDetail = function () {
    opportunitiesDataService.updateDetail({
      year: year,
      month: month,
      groupingType: $scope.grouping.value,
      grouping: $scope[$scope.grouping.value]
    }).then(function (data) {
  	  $scope.$apply(function () {
  		  $scope.opps = data.opps;
		  $scope.all_opps = data.all_opps;
  	  });
	    lineChart({
			data: data.lineChart, 
			id: '#opps-line-chart', 
			xColumn: "month",
			yColumns: ["ninety_ds_opp","chronic_non_adh_opp"/*,"med_sync_opp","gap_opp","network_opp","hrm_opp","statin_diab_opp"*/],
			yScale: [0, $scope.members],
			xTickFormat: function (d) { return months[d - 1]; },
			tip: function (d) {
				return ['<div><strong>',
				d.contract,
				'</strong></div>',
				'<div>90-Day Supply: ',
				d3.format(",")(d[measures[0]]),
				'</div>',
				'<div>Chronic Non-Adherent: ',
				d3.format(",")(d[measures[1]]),
				'</div>',
				'<div>Medication Synchronization: ',
				d3.format(",")(d[measures[2]]),
				'</div>'].join('');
			}
		});
		$scope.selectedGrouping = $scope[$scope.grouping.value];
    });
  };
  
  $scope.selectChanged = function(item) {
	  $scope.grouping = _.find($scope.groupings, function (item) {
	    return item.value == $scope.selectedGroupingType;
	  });
	  console.log($scope.grouping);
  	update();
  };

  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    update();
  });
});
controllers.controller('gapController', function($scope, gapDataService, contractDataService, donutChart, table, lineChart, vertStackedBarChart) {
  var months = ['Jan','Feb','Mar','Apr','May','Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var data = {};
  var options = {
    year: year,
    month: month,
    contract: contract,
    members: 252610
  };
  $scope.selected = {};
  var update = function () {
    gapDataService.update(options).then(function(data){
	  options.contract = data.table4[0].contract;
	  options.members = data.table4[0].members;
	  $scope.selected = data.table4[0];
      table(data.table4, '#gap-table', {
        label: function(d) {
          return [d.contract_name + ' (' + d.contract + ')'];
        },
        mouseover: function (d) {
          if(options.contract != d.contract) {
            options.contract = d.contract;
            options.members = d.members;
			$scope.selected = d;
            updateDetail();
          }
        }
      });
	  updateDetail();
	});
  };
  
  var updateDetail = function () {
    contractDataService.updateDetail(options).then(function (data) {
      vertStackedBarChart(data.line, '#gap-bar-chart');
	  $scope.$apply(function () {
		$scope.selected.contract = options.contract;
	  });  
    });
  };
  update();
});