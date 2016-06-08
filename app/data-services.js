var services = angular.module('dataServices', []);
services.factory("contractDataService", ["queryCSV",
	function(queryCSV) {
    var data = {};
	  return {
      update: function (options) {
        var data = {};
		
        return queryCSV({
          select: [
          {srcProp: 'members', method: 'sum', destProp: 'members'}
          ],
          from: [{
          path: '../../data/members_data.csv'
          }],
          /*where: {year: options.year, month: options.month},*/
          groupBy: ['contract']
        }).then(function(result) {
          data.members = result;
          return queryCSV({
            select: [
              {srcProp: 'members', method: 'first', destProp: 'members'},
              {srcProp: 'four_star_thresh', method: 'first', destProp: 'fourStarThresh'},
              {srcProp: 'den_proj', method: 'sum', destProp: 'den'},
              {srcProp: 'num_proj', method: 'sum', destProp: 'num'},
              {method: 'user-defined', fn: function (accum, val) {
                accum.score = {value: accum.num.value/accum.den.value}; 
                accum.fourStars = {value: accum.score.value >= accum.fourStarThresh.value ? 1 : 0};
                accum.membersToGoal = {value: Math.max(Math.ceil((accum.fourStarThresh.value - accum.score.value) * accum.den.value), 0)};
                return accum;
              }}
            ],
            from: [{
            path: '../../data/measure_data_wo_pgs.csv'
            }],
            where: {year: options.year, month: options.month},
            groupBy: ['contract', 'contract_name', 'measure'],
            orderBy: {
              props: ['members'],
              orders: ['desc']
            }
          });
        }).then(function (result) {
          return queryCSV({
            select: [
              {method: 'user-defined', fn: function (accum, val) {
                accum.fourStarMeasures =  accum.fourStarMeasures || {value: 0}; 
                accum.fourStarMeasures.value += val.fourStars; 
                accum.fourStarMeasuresBand = accum.fourStarMeasuresBand || {value: null};
                accum.fourStarMeasuresBand = {value: (accum.fourStarMeasures.value == 3 ? 'All Measures at 4+ Stars' : (accum.fourStarMeasures.value == 0 ? 'No Measures at 4+ Stars' : '1-2 Measures at 4+ Stars'))};
                accum[_.camelCase(val.measure) + 'Score'] = {value: val.score}; 
                accum[_.camelCase(val.measure) + 'FourStars'] = {value: val.fourStars}; 
                accum[_.camelCase(val.measure) + 'MembersToGoal'] = {value: val.membersToGoal}; 
                return accum;
              }}
            ],
            from: [{
              data: result
            }],
            groupBy: ['contract', 'contract_name']
          });
        }).then(function (result){
          data.scores = result;
          return queryCSV({
            from: [{
              path: 'scores',
              data: data.scores
            }, {
              path: 'members',
              data: data.members,
              keys: {
                left: ['contract'],
                right: ['contract']
              }
            }],
            orderBy: {
              props: ['members'],
              orders:['desc']
            }
          });
        }).then(function (result){
          data.table = result;
          return queryCSV({
            select: [
              {srcProp: 'members', method: 'first', destProp: 'members'}
            ],
            from: [{
              data: result
            }],
            groupBy: ['fourStarMeasuresBand']
          });
        }).then(function(result) {
          total = result.reduce(function (accum, val) {
            accum += val.members;
            return  accum
          }, 0);
          result.forEach(function (obj) {
            obj.pct = obj.members/total;
          });
          data.donut = result;
          return data;
        });
      },
      updateDetail: function (options) {
        var data = {};
        return queryCSV({
          select: [
            {srcProp: 'members', method: 'sum', destProp: 'members'},
            {method: 'user-defined', fn: function(accum, val) {
              accum.pct = {value: accum.members.value/options.members}
              return accum;
            }}
          ],
          from: [{
            path: '../../data/members_data.csv'
          }],
          where: {/*year: options.year, month: options.month,*/ contract: options.contract},
          groupBy: ['state']
        }, false).then(function(result) {
          data.members = result;
          return queryCSV({
            select: [
              {srcProp: 'members', method: 'first', destProp: 'members'},
              {srcProp: 'four_star_thresh', method: 'first', destProp: 'fourStarThresh'},
              {srcProp: 'den_proj', method: 'sum', destProp: 'den'},
              {srcProp: 'num_proj', method: 'sum', destProp: 'num'},
              {method: 'user-defined', fn: function (accum, val) {
                accum.score = {value: accum.num.value/accum.den.value}; 
                accum.fourStars = {value: accum.score.value >= accum.fourStarThresh.value ? 1 : 0};
                accum.membersToGoal = {value: Math.max(Math.ceil((accum.fourStarThresh.value - accum.score.value) * accum.den.value), 0)};
                return accum;
              }}
            ],
            from: [{
              path: '../../data/measure_data_wo_pgs.csv'
            }],
            where: {year: options.year, contract: options.contract},
            groupBy: ['contract', 'contract_name', 'month', 'measure']
          }, false);
        }).then(function(result) {
          return queryCSV({
            select: [
              {method: 'user-defined', fn: function (accum, val) {
                accum.fourStarMeasures =  accum.fourStarMeasures || {value: 0}; 
                accum.fourStarMeasures.value += val.fourStars; 
                accum.fourStarMeasuresBand = accum.fourStarMeasuresBand || {value: null};
                accum.fourStarMeasuresBand = {value: (accum.fourStarMeasures.value == 3 ? 'All Measures at 4+ Stars' : (accum.fourStarMeasures.value == 0 ? 'No Measures at 4+ Stars' : '1-2 Measures at 4+ Stars'))};
                accum[_.camelCase(val.measure) + 'Score'] = {value: val.score}; 
                accum[_.camelCase(val.measure) + 'FourStars'] = {value: val.fourStars}; 
                accum[_.camelCase(val.measure) + 'MembersToGoal'] = {value: val.membersToGoal}; 
                return accum;
              }}
            ],
            from: [{
              data: result
            }],
            groupBy: ['contract', 'contract_name', 'month']
          }, false);
        }).then(function(result) {
          data.line = result;
          return queryCSV({
            select: [
              {srcProp: 'members', method: 'first', destProp: 'members'},
              {srcProp: 'four_star_thresh', method: 'first', destProp: 'fourStarThresh'},
              {srcProp: 'den_proj', method: 'sum', destProp: 'den'},
              {srcProp: 'num_proj', method: 'sum', destProp: 'num'},
              {method: 'user-defined', fn: function (accum, val) {
                accum.score = {value: accum.num.value/accum.den.value}; 
                accum.fourStars = {value: accum.score.value >= accum.fourStarThresh.value ? 1 : 0};
                accum.membersToGoal = {value: Math.max(Math.ceil((accum.fourStarThresh.value - accum.score.value) * accum.den.value), 0)};
                return accum;
              }}
            ],
            from: [{
              path: '../../data/measure_data_wo_pgs.csv'
            }],
            where: {year: options.year, month: options.month, contract: options.contract},
            groupBy: ['state', 'measure']
          }, false);
        }).then(function(result) {
          return queryCSV({
            select: [
              {method: 'user-defined', fn: function (accum, val) {
                accum.fourStarMeasures =  accum.fourStarMeasures || {value: 0}; 
                accum.fourStarMeasures.value += val.fourStars; 
                accum.fourStarMeasuresBand = accum.fourStarMeasuresBand || {value: null};
                accum.fourStarMeasuresBand = {value: (accum.fourStarMeasures.value == 3 ? 'All Measures at 4+ Stars' : (accum.fourStarMeasures.value == 0 ? 'No Measures at 4+ Stars' : '1-2 Measures at 4+ Stars'))};
                accum[_.camelCase(val.measure) + 'Score'] = {value: val.score}; 
                accum[_.camelCase(val.measure) + 'FourStars'] = {value: val.fourStars}; 
                accum[_.camelCase(val.measure) + 'MembersToGoal'] = {value: val.membersToGoal}; 
                return accum;
              }}
            ],
            from: [{
              data: result
            }],
            groupBy: ['state'],
            orderBy: {
              props: ['members'],
              orders:['desc']
            }
          }, false);
        }).then(function (result) {
          data.state = result;
          return queryCSV({
            from: [{
              path: 'state',
              data: data.state
            }, {
              path: 'members',
              data: data.members,
              keys: {
                left: ['state'],
                right: ['state']
              }
            }],
            orderBy: {
              props: ['members'],
              orders:['desc']
             }
          }, false);
        }).then(function (result){
          data.state = result;
          return data;
      });
    }
	};
}]);
services.factory("measureDataService", ["queryCSV",
	function(queryCSV) {
	  return {
      update: function (options) {
        var data = {};
        return queryCSV({
          select: [
            {srcProp: 'members', method: 'first', destProp: 'members'},
            {srcProp: 'four_star_thresh', method: 'first', destProp: 'fourStarThresh'},
            {srcProp: 'goal', method: 'first', destProp: 'goal'},
            {srcProp: 'den_proj', method: 'sum', destProp: 'den'},
            {srcProp: 'num_proj', method: 'sum', destProp: 'num'},
            {srcProp: 'num_proj_0', method: 'sum', destProp: 'num_proj_0'},
            {srcProp: 'num_proj_1_19', method: 'sum', destProp: 'num_proj_1_19'},
            {srcProp: 'num_proj_20_39', method: 'sum', destProp: 'num_proj_20_39'},
            {srcProp: 'num_proj_40_59', method: 'sum', destProp: 'num_proj_40_59'},
            {srcProp: 'num_proj_60_79', method: 'sum', destProp: 'num_proj_60_79'},
            {srcProp: 'num_proj_80_99', method: 'sum', destProp: 'num_proj_80_99'},
            {srcProp: 'num_proj_100', method: 'sum', destProp: 'num_proj_100'},
            {method: 'user-defined', fn: function (accum, val) {
              accum.score = {value: accum.num.value/accum.den.value}; 
              accum.fourStars = {value: accum.score.value >= accum.fourStarThresh.value ? 1 : 0};
              accum.membersToGoal = {value: Math.ceil((accum.goal.value - accum.score.value) * accum.den.value)};
              accum.membersToFourStars = {value: Math.ceil((accum.fourStarThresh.value - accum.score.value) * accum.den.value)};
              return accum;
            }}
          ],
          from: [{
            path: '../../data/measure_data_wo_pgs.csv'
          }],
          where: {year: options.year, month: options.month, measure: options.measure},
          groupBy: ['contract', 'contract_name', 'measure'],
          orderBy: {
            props: ['members'],
            orders: ['desc']
          }
        }).then(function (result) {
          data.barChart = result;
          return queryCSV({
            select: [
              {srcProp: 'members', method: 'sum', destProp: 'members'}
            ],
            from: [{
              data: data.barChart
            }],
            groupBy: ['fourStars']
          });
        }).then(function(result) {
          total = result.reduce(function (accum, val) {
            accum += val.members;
            return  accum
          }, 0);
          result.forEach(function (obj) {
            obj.pct = obj.members/total;
          });
          data.donut = result;
          return data;
        });
      },
      updateDetail: function (options) {
        var data = {};

        return queryCSV({
          select: [
            {srcProp: 'members', method: 'sum', destProp: 'members'},
            {srcProp: 'four_star_thresh', method: 'first', destProp: 'fourStarThresh'},
            {srcProp: 'goal', method: 'first', destProp: 'goal'},
            {srcProp: 'den_proj', method: 'sum', destProp: 'den'},
            {srcProp: 'num_proj', method: 'sum', destProp: 'num'},
            {srcProp: 'num_proj_0', method: 'sum', destProp: 'num_proj_0'},
            {srcProp: 'num_proj_1_19', method: 'sum', destProp: 'num_proj_1_19'},
            {srcProp: 'num_proj_20_39', method: 'sum', destProp: 'num_proj_20_39'},
            {srcProp: 'num_proj_40_59', method: 'sum', destProp: 'num_proj_40_59'},
            {srcProp: 'num_proj_60_79', method: 'sum', destProp: 'num_proj_60_79'},
            {srcProp: 'num_proj_80_99', method: 'sum', destProp: 'num_proj_80_99'},
            {srcProp: 'num_proj_100', method: 'sum', destProp: 'num_proj_100'},
            {method: 'user-defined', fn: function (accum, val) {
              accum.score = {value: accum.num.value/accum.den.value}; 
              accum.fourStars = {value: accum.score.value >= accum.fourStarThresh.value ? 1 : 0};
              accum.membersToGoal = {value: Math.ceil((accum.goal.value - accum.score.value) * accum.den.value)};
              accum.membersToFourStars = {value: Math.ceil((accum.fourStarThresh.value - accum.score.value) * accum.den.value)};
              return accum;
            }}
          ],
          from: [{
            path: '../../data/measure_data_wo_pgs.csv'
          }],
          where: {year: options.year, month: options.month, measure: options.measure, contract: options.contract},
          groupBy: ['measure']
        }, false).then(function (result) {
          data.vertBarChart = [];
          result.forEach(function(obj) {
            data.vertBarChart.push({
              band: '0%', 
              members: obj.num_proj_0
            });
            data.vertBarChart.push({
              band: '1-19%', 
              members: obj.num_proj_1_19
            });
            data.vertBarChart.push({
              band: '20-39%', 
              members: obj.num_proj_20_39
            });
            data.vertBarChart.push({
              band: '40-59%', 
              members: obj.num_proj_40_59
            });
            data.vertBarChart.push({
              band: '60-79%', 
              members: obj.num_proj_60_79
            });
            data.vertBarChart.push({
              band: '80-99%', 
              members: obj.num_proj_80_99
            });
            data.vertBarChart.push({
              band: '100%', 
              members: obj.num_proj_100
            });
          });
          return;
        }).then(function() {
          return queryCSV({
            select: [
              {srcProp: 'num_proj_0', method: 'sum', destProp: 'failed'},
            {srcProp: 'num_proj_1_19', method: 'sum', destProp: 'num_proj_1_19'},
            {srcProp: 'num_proj_20_39', method: 'sum', destProp: 'num_proj_20_39'},
            {srcProp: 'num_proj_40_59', method: 'sum', destProp: 'num_proj_40_59'},
            {srcProp: 'num_proj_60_79', method: 'sum', destProp: 'num_proj_60_79'},
            {srcProp: 'num_proj_80_99', method: 'sum', destProp: 'num_proj_80_99'},
              {srcProp: 'num_proj_100', method: 'sum', destProp: 'achieved'},
              {method: 'user-defined', fn: function (accum, val) {
                accum['in_play'] = {value: accum.num_proj_1_19.value + accum.num_proj_20_39.value + accum.num_proj_40_59.value + accum.num_proj_60_79.value + accum.num_proj_80_99.value};
				accum['total'] = {value: accum.failed.value + accum.achieved.value + accum.in_play.value};
                return accum;
              }}
            ],
            from: [{
              path: '../../data/measure_data_wo_pgs.csv'
            }],
            where: {year: year, contract: options.contract, measure: options.measure},
            groupBy: ['month']
          }, false); 
        }).then(function(result) {
          data.inplay = result;
          return data;
        });   
      }
    };
	}
]);
services.factory("activityDataService", ["queryCSV",
  function(queryCSV) {
    return {
      update: function (options) {
        var data = {};
        
          return queryCSV({
            select: [
              {srcProp: 'targeted_members', method: 'sum', destProp: 'targeted_members'},
              {srcProp: 'outreached_members', method: 'sum', destProp: 'outreached_members'},
              {srcProp: 'reached_members', method: 'sum', destProp: 'reached_members'},
              {srcProp: 'engaged_members', method: 'sum', destProp: 'engaged_members'},
              {method: 'user-defined', fn: function (accum, val) {
                accum.outreached_percent = {value: accum.outreached_members.value/accum.targeted_members.value}; 
                accum.reached_percent = {value: accum.reached_members.value/accum.outreached_members.value}; 
                accum.engaged_percent = {value: accum.engaged_members.value/accum.reached_members.value}; 
                return accum;
              }}
            ],
            from: [{
              path: '../../data/activity_data.csv'
            }],
			where: function (item) {
				return item.targeted_members > 0 && item.program != 'Case-Embedded Nurses';
			},
            groupBy: ['program']
          }).then(function(result) {
            data.table = result;
            return queryCSV({
              select: [
                {srcProp: 'outreached_members', method: 'sum', destProp: 'outreached_members'},
                {srcProp: 'days_to_initial_call', method: 'sum', destProp: 'days_to_initial_call'},
                {method: 'user-defined', fn: function (accum, val) {
                accum.avg_days_to_initial_call = {value: accum.days_to_initial_call.value/accum.outreached_members.value};  
                return accum;
                }}
              ],
              from: [{
                path: '../../data/activity_data.csv'
              }],
			  where: function (item) {
				return item.month > (options.month - 3);   
			  },
              groupBy: ['program', 'month']
            });
          }).then(function(result) {
            return queryCSV({
              select: [
                {method: 'transpose', prop: 'program', value: 'avg_days_to_initial_call'}
              ],
              from: [{
                data: result
              }],
              groupBy: ['month']
            });
          }).then(function (result) {
            data.line = result;
            return data;
          });
        },
        updateDetail: function (options) {
          var data = {};

		return queryCSV({
          select: [
            {srcProp: 'members', method: 'sum', destProp: 'members'}
          ],
          from: [{
            path: '../../data/members_data.csv'
          }],
          /*where: {year: options.year, month: options.month},*/
          groupBy: ['month']
        }, false).then(function(result) {
          data.all_members = result[0].members;
			return queryCSV({
			  select: [
				{srcProp: 'members', method: 'sum', destProp: 'members'},
				{method: 'user-defined', fn: function (accum, val) {
					accum.pct = {value: accum.members.value/data.all_members};
					return accum;
				}}
			  ],
			  from: [{
				path: '../../data/members_data.csv'
			  }],
			  /*where: {year: options.year, month: options.month},*/
			  groupBy: ['state']
			}, false);
        }).then(function(result) {
          data.members = result;
          return queryCSV({
          select: [
            {srcProp: 'targeted_members', method: 'sum', destProp: 'targeted_members'},
            {srcProp: 'outreached_members', method: 'sum', destProp: 'outreached_members'},
            {srcProp: 'reached_members', method: 'sum', destProp: 'reached_members'},
            {srcProp: 'engaged_members', method: 'sum', destProp: 'engaged_members'},
            {method: 'user-defined', fn: function (accum, val) {
            accum.outreached_percent = {value: accum.outreached_members.value/accum.targeted_members.value}; 
            accum.reached_percent = {value: accum.reached_members.value/accum.outreached_members.value}; 
            accum.engaged_percent = {value: accum.engaged_members.value/accum.reached_members.value}; 
            return accum;
            }}
          ],
          from: [{
            path: '../../data/activity_data.csv'
          }],
          groupBy: ['state']
          }, false);
        }).then(function (result) {
          data.scores = result;
          return queryCSV({
            select: [
              {srcProp: 'members', method: 'first', destProp: 'members'},
			  {srcProp: 'pct', method: 'first', destProp: 'pct'},
              {srcProp: 'targeted_members', method: 'first', destProp: 'targeted_members'},
              {srcProp: 'outreached_members', method: 'first', destProp: 'outreached_members'},
              {srcProp: 'reached_members', method: 'first', destProp: 'reached_members'},
              {srcProp: 'engaged_members', method: 'first', destProp: 'engaged_members'},
              {srcProp: 'outreached_percent', method: 'first', destProp: 'outreached_percent'},
              {srcProp: 'reached_percent', method: 'first', destProp: 'reached_percent'},
              {srcProp: 'engaged_percent', method: 'first', destProp: 'engaged_percent'},
              {method: 'user-defined', fn: function (accum, val) {
                accum.targeted_per_member = {value: accum.targeted_members.value/accum.members.value};  
                return accum;
              }}
            ],
            from: [{
              path: 'scores',
              data: data.scores
            }, {
              path: 'members',
              data: data.members,
              keys: {
                left: ['state'],
                right: ['state']
              }
            }],
			/*where: function (item) {
				return item.pct > .01;
			},*/
            groupBy: ['state'],
            orderBy: {
              props: [options.selected],
              orders: [options.selected == 'targeted_members' ? 'desc' : 'asc']
            }
          }, false);
        }).then(function (result) {   
          data.barChart = result;
          return data;
        });
      }
    };
  }
]);
services.factory("opportunitiesDataService", ["queryCSV",
  function(queryCSV) {
    return {
      update: function (options) {
        var data = {};
        return queryCSV({
          select: [
            {srcProp: 'members', method: 'sum', destProp: 'members'}
          ],
          from: [{
            path: '../../data/members_data.csv'
          }],
          /*where: {year: options.year, month: options.month},*/
          groupBy: [options.groupingType]
        }).then(function(result) {
          data.members = result;
          return queryCSV({
            select: [
              {srcProp: 'members', method: 'sum', destProp: 'members'},
              {srcProp: 'goal', method: 'first', destProp: 'goal'},
              {srcProp: 'four_star_thresh', method: 'first', destProp: 'fourStarThresh'},
              {srcProp: 'provider_group_goal', method: 'first', destProp: 'providerGroupGoal'},
              {srcProp: 'den_proj', method: 'sum', destProp: 'den'},
              {srcProp: 'num_proj', method: 'sum', destProp: 'num'},
              {method: 'user-defined', fn: function (accum, val) {
              accum.score = {value: accum.num.value/accum.den.value}; 
              accum.fourStars = {value: accum.score.value >= accum.fourStarThresh.value ? 1 : 0};
              accum.membersToGoal = {value: Math.ceil((accum.goal.value - accum.score.value) * accum.den.value)};
              accum.membersToFourStars = {value: Math.ceil((accum.fourStarThresh.value - accum.score.value) * accum.den.value)};
              accum.membersToProviderGroupGoal = {value: Math.ceil((accum.providerGroupGoal.value - accum.score.value) * accum.den.value)};
              return accum;
            }}
            ],
            from: [{
              path: '../../data/measure_data.csv'
            }],
            where: {year: year, month: month},
            groupBy: [options.groupingType, 'measure']
            });
          }).then(function(result) {
			  data.test = result;
            return queryCSV({
              select: [
              {method: 'user-defined', fn: function (accum, val) {
                accum.fourStarMeasures =  accum.fourStarMeasures || {value: 0}; 
                accum.fourStarMeasures.value += val.fourStars; 
                accum.fourStarMeasuresBand = accum.fourStarMeasuresBand || {value: null};
                accum.fourStarMeasuresBand = {value: (accum.fourStarMeasures.value == 3 ? 'All Measures at 4+ Stars' : (accum.fourStarMeasures.value == 0 ? 'No Measures at 4+ Stars' : '1-2 Measures at 4+ Stars'))};
                accum[_.camelCase(val.measure) + 'Score'] = {value: val.score}; 
                accum[_.camelCase(val.measure) + 'FourStars'] = {value: val.fourStars}; 
                accum[_.camelCase(val.measure) + 'MembersToGoal'] = {value: val.membersToGoal}; 
                accum[_.camelCase(val.measure) + 'MembersToFourStars'] = {value: val.membersToFourStars}; 
                accum[_.camelCase(val.measure) + 'MembersToProviderGroupGoal'] = {value: val.membersToProviderGroupGoal}; 
                return accum;
              }}
            ],
            from: [{
              data: result
            }],
            groupBy: [options.groupingType]
          });
        }).then(function (result) {
          data.scores = result;
          return queryCSV({
            from: [{
              path: 'scores',
              data: data.scores
            }, {
              path: 'members',
              data: data.members,
              keys: {
                left: [options.groupingType],
                right: [options.groupingType]
              }
            }],
            orderBy: {
              props: ['members'],
              orders:['desc']
            }
          });
        }).then(function (result) {			
          data.table = result;
          return queryCSV({
            select: [
              {srcProp: 'members', method: 'sum', destProp: 'members'}
            ],
            from: [{
              data: result
            }],
            groupBy: ['fourStarMeasuresBand']
          });
        }).then(function(result) {
          total = result.reduce(function (accum, val) {
            accum += val.members;
            return  accum
          }, 0);
          result.forEach(function (obj) {
            obj.pct = obj.members/total;
          });
          data.donut = result;
          return data;
        });
      },
      updateDetail: function (options) {
        var data = {};
        return queryCSV({
          select: [
            {srcProp: 'members', method: 'sum', destProp: 'members'}
          ],
          from: [{
            path: '../../data/members_data.csv'
          }],
          /*where: {year: options.year, month: options.month},*/
          groupBy: [options.groupingType]
        }, false).then(function(result) {
          data.members = result;
          var qry = {
            select: [
            /*{srcProp: 'members', method: 'sum', destProp: 'members'},*/
            {srcProp: 'ninety_ds_opp', method: 'sum', destProp: 'ninety_ds_opp'},
            {srcProp: 'chronic_non_adh_opp', method: 'sum', destProp: 'chronic_non_adh_opp'}/*,
            {srcProp: 'med_sync_opp', method: 'sum', destProp: 'med_sync_opp'},
            {srcProp: 'gap_opp', method: 'sum', destProp: 'gap_opp'},
            {srcProp: 'network_opp', method: 'sum', destProp: 'network_opp'},
            {srcProp: 'hrm_opp', method: 'sum', destProp: 'hrm_opp'},
            {srcProp: 'statin_diab_opp', method: 'sum', destProp: 'statin_diab_opp'}*/
            ],
            from: [{
              path: '../../data/individual_data.csv'
            }],
            where: {year: options.year, month: options.month},
            groupBy: [options.groupingType]
          };
          qry.where[options.groupingType] = options.grouping;
          return queryCSV(qry, false)
        }).then(function (result) {
          data.scores = result;
          return queryCSV({
            from: [{
              path: 'scores',
              data: data.scores
            }, {
              path: 'members',
              data: data.members,
              keys: {
                left: [options.groupingType],
                right: [options.groupingType]
              }
            }]/*,
            orderBy: {
              props: ['members'],
              orders:['desc']
            }*/
          }, false);
        }).then(function (result) {
          data.opps = result[0];
          return queryCSV({
			  select: [
				{srcProp: 'members', method: 'sum', destProp: 'members'}
			  ],
			  from: [{
				path: '../../data/members_data.csv'
			  }],
			  /*where: {year: options.year, month: options.month},*/
			  groupBy: ['month']
		  }, false);
        }).then(function(result) {
          data.all_members = result;
          var qry = {
            select: [
            /*{srcProp: 'members', method: 'sum', destProp: 'members'},*/
            {srcProp: 'ninety_ds_opp', method: 'sum', destProp: 'ninety_ds_opp'},
            {srcProp: 'chronic_non_adh_opp', method: 'sum', destProp: 'chronic_non_adh_opp'}/*,
            {srcProp: 'med_sync_opp', method: 'sum', destProp: 'med_sync_opp'},
            {srcProp: 'gap_opp', method: 'sum', destProp: 'gap_opp'},
            {srcProp: 'network_opp', method: 'sum', destProp: 'network_opp'},
            {srcProp: 'hrm_opp', method: 'sum', destProp: 'hrm_opp'},
            {srcProp: 'statin_diab_opp', method: 'sum', destProp: 'statin_diab_opp'}*/
            ],
            from: [{
              path: '../../data/individual_data.csv'
            }],
            where: {year: options.year, month: options.month},
            groupBy: ['month']
          };
          return queryCSV(qry, false)
        }).then(function (result) {
          data.all_scores = result;
          return queryCSV({
            from: [{
              path: 'all_scores',
              data: data.all_scores
            }, {
              path: 'all_members',
              data: data.all_members,
              keys: {
                left: ['month'],
                right: ['month']
              }
            }]/*,
            orderBy: {
              props: ['members'],
              orders:['desc']
            }*/
          }, false);
        }).then(function (result) {
          data.all_opps = result[0];
          return;
        }).then(function () {
          var qry = {
            select: [
              {srcProp: 'members', method: 'sum', destProp: 'members'},
              {srcProp: 'ninety_ds_opp', method: 'sum', destProp: 'ninety_ds_opp'},
              {srcProp: 'chronic_non_adh_opp', method: 'sum', destProp: 'chronic_non_adh_opp'}/*,
              {srcProp: 'med_sync_opp', method: 'sum', destProp: 'med_sync_opp'},
              {srcProp: 'gap_opp', method: 'sum', destProp: 'gap_opp'},
              {srcProp: 'network_opp', method: 'sum', destProp: 'network_opp'},
              {srcProp: 'hrm_opp', method: 'sum', destProp: 'hrm_opp'},
              {srcProp: 'statin_diab_opp', method: 'sum', destProp: 'statin_diab_opp'}*/
            ],
            from: [{
              path: '../../data/individual_data.csv'
            }],
            where: {year: options.year},
            groupBy: ['month']
          };
          qry.where[options.groupingType] = options.grouping;
          return queryCSV(qry, false);
        }).then(function (result) {
          data.lineChart = result;
          return data;
        });
      }
    };
  }
]);
services.factory("outcomesDataService", ["queryCSV",
	function(queryCSV) {
	  return {
		update: function (options) {
		  var data = {};
		  
		  return queryCSV({
            select: [
              {srcProp: 'outreached_members', method: 'sum', destProp: 'outreached_members'}
            ],
            from: [{
              path: '../../data/program_data.csv'
            }],
            where: {script: options.script},
            groupBy: ['program']
          }).then(function(result){
			  data.members = result;
			  return queryCSV({
				select: [
				  {srcProp: 'members', method: 'sumIf', destProp: 'den', condition: function (item) {
					  return !_.isNull(item.engaged);
				  }},
				  {srcProp: 'members', method: 'sumIf', destProp: 'num', condition: function (item) {
					  return !_.isNull(item.engaged) && item.adherent == 1;
				  }},
				  {method: 'user-defined', fn: function (accum, val) {
					accum.score = {value: accum.num.value / accum.den.value}
					return accum;
				  }}
				],
				from: [{
				  path: '../../data/outcomes_data.csv'
				}],
				where: {/*year: options.year, month: options.month,*/ script: options.script},
				groupBy: ['program', 'engaged']
			  });
			}).then(function (result) {
			  data.scores = result;
			  return queryCSV({
				select: [
					{method: 'user-defined', fn: function (accum, val) {
					  accum.nnt = accum.nnt || {value: 0};
					  accum.engaged = accum.engaged || {value: 0};
					  accum.not_engaged = accum.not_engaged || {value: 0};
					  
					  if (val.engaged == 1) {
						accum.engaged.value = val.score;
						accum.nnt.engaged_members = val.den;
					  } else {
						accum.not_engaged.value = val.score;
					  }
					  accum.nnt.value = /*val.outreached_members*/ accum.nnt.engaged_members / ((accum.engaged.value - accum.not_engaged.value) * accum.nnt.engaged_members);
					  return accum;
					}}
				],
				from: [{
				  path: 'scores',
				  data: data.scores
				}, {
				  path: 'members',
				  data: data.members,
				  keys: {
					left: ['program'],
					right: ['program']
				  }
				}],
				where: function (item) {
					return item.program != 'Case-Embedded Nurses';
				},
				groupBy: ['program'],
				orderBy: {
					props: ['program'],
					orders: ['asc']
				}
			  });
		  }).then(function(result) {
			data.table = result;
			  return queryCSV({
				select: [
				  {srcProp: 'outreached_members', method: 'sum', destProp: 'members'},
				  {srcProp: 'days_to_refill', method: 'sum', destProp: 'days_to_refill'},
				  {srcProp: 'days_missed', method: 'sum', destProp: 'days_missed'}
				],
				from: [{
				  path: '../../data/program_data.csv'
				}],
				where: function (item) {
					return item.script == options.script && !_.isNull(item.engaged) && item.program != 'Monitor' && options.script == 'Late to Refill' ? (item.days_to_refill_band == '>10' ? false : true) : true; 
				},
				groupBy: ['program', 'engaged']
			  });
		  }).then(function (result) {
			  return queryCSV({
				select: [
				  {method: 'user-defined', fn: function (accum, val) {
					  if(val.engaged == 1) {
						  accum.engaged_avg_days_to_refill = {value: val.days_to_refill/val.members};
						  accum.engaged_avg_days_missed = {value: val.days_missed/val.members};
					  } else {
						  accum.not_engaged_avg_days_to_refill = {value: val.days_to_refill/val.members};
						  accum.not_engaged_avg_days_missed = {value: val.days_missed/val.members};
					  }
					  return accum;
				  }}
				],
				from: [{
				  data: result
				}],
				where: function (item) {
					return item.members > 0 && item.program != 'Monitor';
				},
				groupBy: ['program'],
				orderBy: {
					props: ['program'],
					orders: ['asc']
				}
			  });
		  }).then(function (result) {
			data.table2 = result;
			  return queryCSV({
				select: [
				  {srcProp: 'outreached_members', method: 'sum', destProp: 'members'},
				  {srcProp: 'days_to_refill', method: 'sum', destProp: 'days_to_refill'},
				  {srcProp: 'days_missed', method: 'sum', destProp: 'days_missed'},
				  {method: 'user-defined', fn: function (accum, val) {
					  accum.avg_days_to_refill = {value: accum.days_to_refill.value / accum.members.value};
					  accum.avg_days_missed = {value: accum.days_missed.value / accum.members.value};
					  return accum;
				  }}
				],
				from: [{
				  path: '../../data/program_data.csv'
				}],
				where: function (item) {
					return item.script == options.script && !_.isNull(item.engaged) && item.program != 'Monitor' && options.script == 'Late to Refill' ? (item.days_to_refill_band == '>10' ? false : true) : true; 
				},
				groupBy: ['month', 'program']
			  });
		  }).then(function (result) {
			  return queryCSV({
				select: [
				  {prop: 'program', value: options.grouping2, method: 'transpose'}
				],
				from: [{
				  data: result
				}],
				where: function (item) {
					return item.month > 7 && item.month < 11;
				},
				groupBy: ['month']
			  });
		  }).then(function (result) {
			  data.line = result;
			  return data;
		  });
		},
		updateDetail: function (options) {
			  var data = {};

			  return queryCSV({
				select: [
				  {srcProp: 'engaged_members', method: 'sum', destProp: 'members'}
				],
				from: [{
				  path: '../../data/program_data.csv'
				}],
				where: {program: options.program},
				groupBy: [options.grouping]
			  }, false).then(function (result) {			  
				  return queryCSV({
					select: [
					  {method: 'user-defined', fn: function (accum, val) {
						  switch (val[options.grouping]) {
							case '<=3':
							case '<=7':
								accum.order = {value: 1};
								break;
							case '4-7':
							case '8-14':
								accum.order = {value: 2};
								break;
							case '8-10':
							case '15-21':
								accum.order = {value: 3};
								break;
							case '>10':
							case '22-30':
								accum.order = {value: 4};
								break;
							case '31-60':
								accum.order = {value: 5};
								break;
							case '>60':
								accum.order = {value: 6};
								break;
						  }
						  return accum;
					  }}
					],
					from: [{
					  data: result
					}],
					where: function (item) {
						return item.members > 0;
					},
					groupBy: [options.grouping, 'members'],
					orderBy: {
						props: ['order'],
						orders: ['asc']
					}
				  }, false);
			  }).then(function (result) {
				  data.barChart = result;
				  return data;
			  });
		}
	  };
	}
]);
services.factory("gapDataService", ["queryCSV",
	function(queryCSV) {
    var data = {};
	  return {
      update: function (options) {
        var data = {};
		
        return queryCSV({
          select: [
          {srcProp: 'members', method: 'sum', destProp: 'members'}
          ],
          from: [{
          path: '../../data/members_data.csv'
          }],
          /*where: {year: options.year, month: options.month},*/
          groupBy: ['contract']
        }).then(function(result) {
          data.members = result;
          return queryCSV({
            select: [
              {srcProp: 'members', method: 'first', destProp: 'members'},
              {srcProp: 'four_star_thresh', method: 'first', destProp: 'fourStarThresh'},
              {srcProp: 'den_proj', method: 'sum', destProp: 'den'},
              {srcProp: 'num_proj', method: 'sum', destProp: 'num'},
              {method: 'user-defined', fn: function (accum, val) {
                accum.score = {value: accum.num.value/accum.den.value}; 
                accum.fourStars = {value: accum.score.value >= accum.fourStarThresh.value ? 1 : 0};
                accum.membersToGoal = {value: Math.max(Math.ceil((accum.fourStarThresh.value - accum.score.value) * accum.den.value), 0)};
                return accum;
              }}
            ],
            from: [{
            path: '../../data/measure_data_wo_pgs.csv'
            }],
            where: {year: options.year, month: options.month},
            groupBy: ['contract', 'contract_name', 'measure'],
            orderBy: {
              props: ['members'],
              orders: ['desc']
            }
          });
        }).then(function (result) {
          return queryCSV({
            select: [
              {method: 'user-defined', fn: function (accum, val) {
                accum.fourStarMeasures =  accum.fourStarMeasures || {value: 0}; 
                accum.fourStarMeasures.value += val.fourStars; 
                accum.fourStarMeasuresBand = accum.fourStarMeasuresBand || {value: null};
                accum.fourStarMeasuresBand = {value: (accum.fourStarMeasures.value == 3 ? 'All Measures at 4+ Stars' : (accum.fourStarMeasures.value == 0 ? 'No Measures at 4+ Stars' : '1-2 Measures at 4+ Stars'))};
                accum[_.camelCase(val.measure) + 'Score'] = {value: val.score}; 
                accum[_.camelCase(val.measure) + 'FourStars'] = {value: val.fourStars}; 
                accum[_.camelCase(val.measure) + 'MembersToGoal'] = {value: val.membersToGoal}; 
                return accum;
              }}
            ],
            from: [{
              data: result
            }],
            groupBy: ['contract', 'contract_name']
          });
        }).then(function (result){
          data.scores = result;
          return queryCSV({
            from: [{
              path: 'scores',
              data: data.scores
            }, {
              path: 'members',
              data: data.members,
              keys: {
                left: ['contract'],
                right: ['contract']
              }
            }],
			where: function (item) {
				return item.fourStarMeasuresBand != 'All Measures at 4+ Stars';
			},
            orderBy: {
              props: ['members'],
              orders:['desc']
            }
          });
        }).then(function (result){
          data.table1 = result;
          return queryCSV({
            select: [
              {srcProp: 'members', method: 'first', destProp: 'members'}
            ],
            from: [{
              data: result
            }],
            groupBy: ['fourStarMeasuresBand']
          });
        }).then(function(result) {
          total = result.reduce(function (accum, val) {
            accum += val.members;
            return  accum
          }, 0);
          result.forEach(function (obj) {
            obj.pct = obj.members/total;
          });
          data.donut = result;
		  return queryCSV({
            select: [
              {srcProp: 'targeted_members', method: 'sum', destProp: 'targeted_members'},
              {srcProp: 'outreached_members', method: 'sum', destProp: 'outreached_members'},
              {srcProp: 'reached_members', method: 'sum', destProp: 'reached_members'},
              {srcProp: 'engaged_members', method: 'sum', destProp: 'engaged_members'},
              {method: 'user-defined', fn: function (accum, val) {
                accum.outreached_percent = {value: accum.outreached_members.value/accum.targeted_members.value}; 
                accum.reached_percent = {value: accum.reached_members.value/accum.outreached_members.value}; 
                accum.engaged_percent = {value: accum.engaged_members.value/accum.reached_members.value}; 
				accum.group = {value:0};
                return accum;
              }}
            ],
            from: [{
              path: '../../data/activity_data.csv'
            }],
			where: function (item) {
				return item.targeted_members > 0 && item.program != 'Case-Embedded Nurses';
			},
            groupBy: ['program']
		  });
        }).then(function(result) {
		  return queryCSV({
            select: [
              {srcProp: 'reached_percent', method: 'max', destProp: 'max_reach_rate'},
			  {srcProp: 'reached_percent', method: 'min', destProp: 'min_reach_rate'},
			  {srcProp: 'reached_percent', method: 'average', destProp: 'avg_reach_rate'},
              {srcProp: 'engaged_percent', method: 'max', destProp: 'max_engaged_rate'},
			  {srcProp: 'engaged_percent', method: 'min', destProp: 'min_engaged_rate'},
			  {srcProp: 'engaged_percent', method: 'average', destProp: 'avg_engaged_rate'}
            ],
            from: [{
              data: result
            }],
            groupBy: ['group']
		  });
        }).then(function(result) {
			data.table2 = result;
			  return queryCSV({
				select: [
				  {srcProp: 'outreached_members', method: 'sum', destProp: 'outreached_members'}
				],
				from: [{
				  path: '../../data/program_data.csv'
				}],
				groupBy: ['script', 'program']
			  });
          }).then(function(result){
			  data.members = result;
			  return queryCSV({
				select: [
				  {srcProp: 'members', method: 'sumIf', destProp: 'den', condition: function (item) {
					  return !_.isNull(item.engaged);
				  }},
				  {srcProp: 'members', method: 'sumIf', destProp: 'num', condition: function (item) {
					  return !_.isNull(item.engaged) && item.adherent == 1;
				  }},
				  {method: 'user-defined', fn: function (accum, val) {
					accum.score = {value: accum.num.value / accum.den.value}
					return accum;
				  }}
				],
				from: [{
				  path: '../../data/outcomes_data.csv'
				}],
				groupBy: ['script', 'program', 'engaged']
			  });
			}).then(function (result) {
			  data.scores = result;
			  return queryCSV({
				select: [
					{method: 'user-defined', fn: function (accum, val) {
					  accum.nnt = accum.nnt || {value: 0};
					  accum.engaged = accum.engaged || {value: 0};
					  accum.not_engaged = accum.not_engaged || {value: 0};
					  
					  if (val.engaged == 1) {
						accum.engaged.value = val.score;
						accum.nnt.engaged_members = val.den;
					  } else {
						accum.not_engaged.value = val.score;
					  }
					  accum.nnt.value = /*val.outreached_members*/ accum.nnt.engaged_members / ((accum.engaged.value - accum.not_engaged.value) * accum.nnt.engaged_members);
					  accum.group = {value: 0};
					  return accum;
					}}
				],
				from: [{
				  path: 'scores',
				  data: data.scores
				}, {
				  path: 'members',
				  data: data.members,
				  keys: {
					left: ['script', 'program'],
					right: ['script', 'program']
				  }
				}],
				groupBy: ['script', 'program']
			  });
		  }).then(function(result) {
			  return queryCSV({
				select: [
				  {srcProp: 'nnt', method: 'max', destProp: 'max_nnt'},
				  {srcProp: 'nnt', method: 'min', destProp: 'min_nnt'},
				  {srcProp: 'nnt', method: 'average', destProp: 'avg_nnt'}
				],
				from: [{
				  data: result
				}],
				where: function (item) {
					return item.nnt > 0;
				},
				groupBy: ['group']
			  });
		  }).then(function(result) {
			data.table3 = result;
			data.table4 = [];
			data.table1.forEach(function (item1) {
				data.table2.forEach(function (item2) {
					data.table3.forEach(function (item3) {
						data.table4.push(_.assign({}, item1, item2, item3));
					});
				});
			});
			return data;
		  });
	  }
	};
  }
]);		  