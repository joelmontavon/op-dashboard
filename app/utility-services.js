var services = angular.module('utilityServices', []);
services.factory("d3", function() {
  return window.d3;
});
services.factory("tip", ["d3", 
  function(d3) {
    var t = d3.tip()
      .attr('class', 'd3-tip')
      .direction('n')
      .offset([-5, 0]);
    return t;
  }
]);
services.factory("_", function() {
  var _ = window._;

  _.mixin({filterData: function (data, fn) {
    //console.log(data);
    if(_.isObject(fn))
      for (prop in fn)
        if(fn[prop] == undefined) delete fn[prop];
    return fn ? _.filter(data, fn) : data;
  }});
  
  _.mixin({groupByMulti: function (obj, values, context) {
    if (!values.length)
      return obj;
    var byFirst = _.groupBy(obj, values[0], context),
      rest = values.slice(1);
    for (var prop in byFirst) {
      byFirst[prop] = _.groupByMulti(byFirst[prop], rest, context);
    }
    //console.log(byFirst);
    return byFirst;
  }});
  
  _.mixin({uniqueValues: function (arr, cols) {
    //console.log(arr);
    var result = [];
    for (var i = 0; i < cols.length; i++) {
      result.push (
        _.chain(arr)
          .uniq(function (item) {
            return item[cols[i]];
          })
          .map(function (item) {
            return item[cols[i]];
          })
          .value()
      );
    }
    return result;
  }});
  
  _.mixin({cartesianProductOf: function (arr) {
      //console.log(arr);
      return _.reduce(arr, function(a, b) {
          return _.flatten(_.map(a, function(x) {
              return _.map(b, function(y) {
                  return x.concat([y]);
              });
          }), false);
      }, [ [] ]);
  }});
 
  _.mixin({uniqueGroups: function (arr, groupBy) {
      //console.log(arr);
      return _.chain(arr)
		.map(function (obj) {
		  return _.chain(obj)
			.pick(groupBy)
			.values()
			.value();
		})
		.uniq(JSON.stringify)
		.value();
  }});
 
  _.mixin({createNestedObjects: function (pathValues, pathProps, obj) {
      //console.log(pathValues);
      var createPathObject = function (path, cols) {
        var obj = {};
        for(var i = 0; i < path.length; i++)
          obj[cols[i]] = path[i];
        return obj;
      };
      var createNestedObject = function (obj, key) {
        for(var i = 0; i < key.length; i++ ) {
          obj = obj[key[i]] = obj[key[i]] || [{}];
          if(_.isArray(obj))
            obj.$path = createPathObject(key, pathProps);
        }
      };
      for(var i = 0; i < pathValues.length; i++ ) {
        createNestedObject(obj, pathValues[i]);
      }
      //console.log(obj);
      return obj;
  }});
  
  _.mixin({traverseObject: function(obj, fn) {
    //console.log(obj);
    fn = fn || function (val) {return val;};
    for (var key in obj) {
      if (Array.isArray(obj[key])) {
        obj[key] = fn(obj[key]);
      } else {
        _.traverseObject(obj[key], fn);
      }      
    }
    return obj;
  }});
  
  _.mixin({toArray: function(obj, arr) {
    //console.log(obj);
  	arr = arr || [];
    for (var key in obj) {
      if (_.isObject(obj[key])) {
        _.toArray(obj[key], arr);
      } else {
        arr.push(obj);
        break;
      }
    }
  	return arr;
  }});
  
  _.mixin({sortByMulti: function(arr, options) {
    if (!options)
      return arr;
    var sortFn = {
      asc: function (prop) {
        var isString = _.isString(arr[0][prop]);
        return function (a, b) {
          if (a[prop] == null) return 1
          if (b[prop] == null) return 0
          if (isString) {
            if(a[prop] < b[prop]) return -1;
            if(a[prop] > b[prop]) return 1;
            return 0;
          } else {
            return a[prop] - b[prop];
          }
        };
      },
      desc: function (prop) {
        var isString = _.isString(arr[0][prop]);
        return function (a, b) {
          if (a[prop] == null) return 1
          if (b[prop] == null) return 0
          if (isString) {
            if(a[prop] < b[prop]) return 1;
            if(a[prop] > b[prop]) return -1;
            return 0;
          } else {
            return b[prop] - a[prop];
          }
        };
      }
    }
    for(var i = (options.props.length - 1); i >= 0; i--) {
      arr = arr.sort(sortFn[options.orders[i]](options.props[i]));
    }
    return arr;
  }});
  
  _.mixin({merge: function (arr, options) {
    var result = [];
    if (!options)
      return arr;
      
    var obj = _.chain(options.data)
      .groupByMulti(options.keys.right)
      .value();
    
    _.forEach(arr, function (leftItem) {
      var values = _.chain(leftItem)
        .pick(options.keys.left)
        .map(function (val) {return val;})
        .value()
        .join('.');
      
      _.result(obj, values, (options.join || 'inner') == 'outer' ? [leftItem] : [])
        .forEach(function (rightItem) {
          result.push(_.defaultsDeep({}, leftItem, rightItem));
        });
    });
    return result;
  }});
  
  _.mixin({join: function(arr) {
    if (!Array.isArray(arr) && _.isObject(arr)) {
      return _.cloneDeep(arr.data);
    } else if (!Array.isArray(arr)) {
      return _.cloneDeep(arr);
    }

    var data = _.chain(arr[0].data);
    for (var i = 1; i < arr.length; i++) {
      data = data.merge(_.cloneDeep(arr[i]));
    }
    return data.value();
  }});

  _.mixin({picker: function(arr, props) {
    if (!props) return arr;
    return _.map(arr, function (obj) {
      return _.pick(obj, props);
    })
  }});

  return _;
});
services.factory("Papa", function() {
  return window.Papa;
});
services.factory("parseCSV", ["_", "Papa",
  function(_, Papa) {
	return function (paths) {
      var parse = _.memoize(function (path) {
        if (path.data) {
          var promise = new Promise(function(resolve, reject) {
            resolve(path.data);  
          });
        } else {
          var promise = new Promise(function(resolve, reject) {
            Papa.parse(_.isObject(path) ? path.path : path, {
              delimiter: ',',
            	header: true,
            	dynamicTyping: true,
            	worker: true,
            	download: true,
            	complete: function (results) {
            	 resolve(results.data);
            	}
            });
          });
        }
        
        if (_.isObject(path) && path.hasOwnProperty('fn')) {
          return promise.then(function (results) {
            return _.map(results, path.fn);
          });
        } else {
          return promise;
        }
      });
      
      if (!Array.isArray(paths)) {
        return parse(paths);
      } else {
        var promises = [];
        for (var i = 0; i < paths.length; i++) {
          promises.push(parse(paths[i]));
        }
        return Promise.all(promises).then(function (results) {
          var result = {};
          for (var i = 0; i < results.length; i++) {
            result[paths[i].path] = results[i];
          }
          return result;
        });
      }
    };
}]);
services.factory("queryJSON", ["_",
  function(_) {
	var fn = function (options) {

      var aggregates = {
        average: function (options) {
          return function (accum, val) {
            var def = {
              sum: 0,
              count: 0,
              value: 0
            }
            accum[options.destProp] = accum[options.destProp] || def;
            if (_.isFinite(val[options.srcProp])) { 
              accum[options.destProp]['sum'] += val[options.srcProp]; 
              accum[options.destProp]['count'] += 1; 
              accum[options.destProp]['value'] = accum[options.destProp]['sum']/accum[options.destProp]['count']; 
            } 
            return accum; 
          };
        },
        count: function (options) {
          return function (accum, val) { 
            var def = {
              value: 0
            };
            accum[options.destProp] = accum[options.destProp] || def;
            if (!_.isEmpty(val) && !_.isNull(val[options.srcProp])) { 
              accum[options.destProp]['value'] += 1; 
            } 
            return accum; 
          };
        },
        countDistinct: function (options) {
          return function (accum, val) { 
            var def = {
              keys: {},
              value: 0
            };
            accum[options.destProp] = accum[options.destProp] || def; 
            if (!_.isEmpty(val) && !_.isNull(val[options.srcProp])) { 
              accum[options.destProp]['keys'][val[options.srcProp]] = 1;
              accum[options.destProp]['value'] = Object.keys(accum[options.destProp]['keys']).length;
            } 
            return accum; 
          };
        },
        countIf: function (options) {
          return function (accum, val) { 
            var def = {
              keys: {},
              value: 0
            };
            accum[options.destProp] = accum[options.destProp] || def;
            if (options.condition(val) && !_.isEmpty(val) && !_.isNull(val[options.srcProp])) { 
              accum[options.destProp]['keys'][val[options.srcProp]] = 1;
              accum[options.destProp]['value'] = Object.keys(accum[options.destProp]['keys']).length;
            } 
            return accum; 
          };
        },
        first: function (options) {
          return function (accum, val) { 
            var def = {
              value: null
            };
            accum[options.destProp] = accum[options.destProp] || def; 
            if (_.isNull(accum[options.destProp]['value']) 
              && !_.isNull(val[options.srcProp])) { 
              accum[options.destProp]['value'] = val[options.srcProp];
            } 
            return accum; 
          };
        },
        last: function (options) {
          return function (accum, val) { 
            var def = {
              value: -Infinity
            };
            accum[options.destProp] = accum[options.destProp] || def; 
            if (!_.isNull(val[options.srcProp])) { 
              accum[options.destProp]['value'] = val[options.srcProp];
            } 
            return accum; 
          };
        },
        min: function (options) {
          return function (accum, val) { 
            var def = {
              value: Infinity
            };
            accum[options.destProp] = accum[options.destProp] || def; 
            if (_.isFinite(val[options.srcProp])) { 
              accum[options.destProp]['value'] = val[options.srcProp] > accum[options.destProp]['value'] ? accum[options.destProp]['value'] : val[options.srcProp];
            } 
            return accum; 
          };
        },
        max: function (options) {
          return function (accum, val) { 
            var def = {
              value: null
            };
            accum[options.destProp] = accum[options.destProp] || def; 
            if (_.isFinite(val[options.srcProp])) { 
              accum[options.destProp]['value'] = val[options.srcProp] > accum[options.destProp]['value'] ? val[options.srcProp] : accum[options.destProp]['value'];
            } 
            return accum; 
          };
        },
        sum: function (options) {
          return function (accum, val) { 
            var def = {
              value: 0
            };
            accum[options.destProp] = accum[options.destProp] || def; 
            if (_.isFinite(val[options.srcProp])) { 
              accum[options.destProp]['value'] += val[options.srcProp]; 
            }
            return accum; 
          };
        },
        sumIf: function (options) {
          return function (accum, val) { 
            var def = {
              value: 0
            };
            accum[options.destProp] = accum[options.destProp] || def; 
            if (options.condition(val) && _.isFinite(val[options.srcProp])) { 
              accum[options.destProp]['value'] += val[options.srcProp]; 
            }
            return accum; 
          };
        },
        transpose: function (options) {
          return function (accum, val) { 
            accum[val[options.prop]] = {
				value: val[options.value]
			}; 
            return accum; 
          };
        },
        'user-defined': function (options) {
          return options.fn;
        }
      };
      
      var calc = function (cols, accum, val) {
        cols.forEach( function (col) {
          accum = aggregates[col['method']](col)(accum, val);
        })
        return accum;
      };
      
      var values = function (cols) {
        return function (data) {
          var obj = _.reduce(data, function (accum, val) { 
            return calc(cols, accum, val);
          }, {});
          for (prop in obj) {
            obj[prop] = obj[prop]['value'];
          }
          return _.assign(obj, data.$path);
        };
      };
	
      var data = _.chain(options.from)
        .join()
        .filterData(options.where);
	  //console.log(data.value());

      if (options.groupBy) {
        var result = data
          //.uniqueValues(options.groupBy)
          //.cartesianProductOf()
		  .uniqueGroups(options.groupBy)
          .createNestedObjects(options.groupBy, data
            .groupByMulti(options.groupBy)
            .value()
          )
          .traverseObject(values(options.select))
          .toArray()
          .sortByMulti(options.orderBy)
          .value();
      } else {
        var result = data
          .sortByMulti(options.orderBy)
          .picker(options.select)
          .value();
      }
      return result;
    };
	
	var memoFn = _.memoize(fn, function (options) { 
	  return JSON.stringify(options, function(key, value) {
		if (typeof value === 'function') {
		  return value.toString();
		} else {
		  return value;
		}
	  });
	});
	
	return function (options, memoize) {
		memoize = memoize | true;
		if (memoize) {
			return memoFn(options);
		} else {
			return fn(options);
		}
	};
}]);
services.factory("queryCSV", ["_", "parseCSV", "queryJSON", 
  function(_, parseCSV, queryJSON) {
    return function (options, memoize) {
      //var paths = _.map(options.from, 'path');
      var paths = options.from;
      return parseCSV(paths, memoize).then(function(data) {
        for (var i = 0; i < options.from.length; i++) {
          if(!options.from[i].data) options.from[i].data = data[options.from[i].path];
        }
        return queryJSON(options);
      });
    };
}]);