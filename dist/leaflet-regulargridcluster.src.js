'use strict';

L.RegularGridClusterCell = L.Polygon.extend({
  options: {
    weight: 1,
    fillOpacity: 0.6,
    clickable: false,
    color: 'grey',
    lineJoin: 'miter',
    fillRule: 'evenodd',
    strokeLocation: 'inside'
  },

  initialize: function initialize(path, options) {
    this.options = L.extend(this.options, options);
    L.Util.setOptions(this, this.options);

    L.Polygon.prototype.initialize.call(this, path, this.options);
  }
});

L.regularGridClusterCell = function (path, options) {
  return new L.RegularGridClusterCell(path, options);
};
"use strict";

L.RegularGridClusterGrid = L.FeatureGroup.extend({
  options: {},
  initialize: function initialize(options) {
    this.controller = options.controller;
    this.options = L.extend(this.options, options);
    L.Util.setOptions(this, options);

    L.FeatureGroup.prototype.initialize.call(this, {
      features: []
    }, options);
  },

  render: function render(cellSize, origin) {},

  addLayer: function addLayer(cell) {
    L.FeatureGroup.prototype.addLayer.call(this, cell);
  },

  truncate: function truncate() {
    this.clearLayers();
  }
});

L.regularGridClusterGrid = function (options) {
  return new L.RegularGridClusterGrid(options);
};
"use strict";

L.RegularGridClusterMarker = L.CircleMarker.extend({
  options: {
    radius: 10
  },
  initialize: function initialize(centroid, options) {
    this.options = L.extend(this.options, options);
    L.Util.setOptions(this, options);

    L.CircleMarker.prototype.initialize.call(this, centroid, options);
  }
});

L.regularGridClusterMarker = function (centroid, options) {
  return new L.RegularGridClusterMarker(centroid, options);
};
"use strict";

L.RegularGridClusterMarkersGroup = L.FeatureGroup.extend({
  options: {},
  initialize: function initialize(options) {
    this.controller = options.controller;
    this.options = L.extend(this.options, options);
    L.Util.setOptions(this, options);

    L.FeatureGroup.prototype.initialize.call(this, {
      features: []
    }, options);
  },

  render: function render(cellSize, origin) {},

  addLayer: function addLayer(marker) {
    L.FeatureGroup.prototype.addLayer.call(this, marker);
  },

  truncate: function truncate() {
    this.clearLayers();
  }
});

L.regularGridClusterMarkersGroup = function (options) {
  return new L.RegularGridClusterMarkersGroup(options);
};
'use strict';

L.RegularGridClusterText = L.Marker.extend({
  options: {},

  initialize: function initialize(centroid, options) {
    this.options = L.extend(this.options, options);
    L.Util.setOptions(this, options);

    var iconOptions = JSON.stringify(options).substring(1, JSON.stringify(options).length - 2).replace(/,/g, ';').replace(/\"/g, "");

    options.icon = L.divIcon({
      html: '<span class="regular-grid-text-html" style="' + iconOptions + ' ; text-align: center">' + this.options.text + '</span>',
      iconSize: [0, 0],
      iconAnchor: [options.anchorOffsetX || -10, options.anchorOffsetY || -30],
      className: 'regular-grid-text-marker'
    });

    L.Marker.prototype.initialize.call(this, centroid, options);
  }

});

L.regularGridClusterText = function (centroid, options) {
  return new L.RegularGridClusterText(centroid, options);
};
"use strict";

L.RegularGridClusterTextsGroup = L.FeatureGroup.extend({
  options: {},
  initialize: function initialize(options) {
    this.controller = options.controller;
    this.options = L.extend(this.options, options);
    L.Util.setOptions(this, options);

    L.FeatureGroup.prototype.initialize.call(this, {
      features: []
    }, options);
  },

  render: function render(cellSize, origin) {},

  addLayer: function addLayer(marker) {
    L.FeatureGroup.prototype.addLayer.call(this, marker);
  },

  truncate: function truncate() {
    this.clearLayers();
  }
});

L.regularGridClusterTextsGroup = function (options) {
  return new L.RegularGridClusterTextsGroup(options);
};
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/*jshint esversion: 6 */
// main class, controller, ...

L.RegularGridCluster = L.GeoJSON.extend({
  options: {
    gridBoundsPadding: 0.1,
    gridMode: 'square',
    cellSize: 10000, // size of the cell at a scale of 10

    showGrid: true,
    showMarkers: true,
    showTexts: true,

    showElementsZoom: 19,

    indexSize: 12,

    rules: {},
    trackingTime: true // for developement purposes 
  },

  initialize: function initialize(options) {
    this.options = L.extend(this.options, options);
    this.lastelmid = 0;
    this.elementDisplayed = false;
    L.Util.setOptions(this, options);

    this._actions = [];
    this._elements = {};
    this._displayedElsGroup = L.featureGroup([]);
    this._cells = [];

    this._grid = new L.regularGridClusterGrid({ controller: this });
    this._markers = new L.regularGridClusterMarkersGroup({ controller: this });
    this._texts = new L.regularGridClusterTextsGroup({ controller: this });

    L.FeatureGroup.prototype.initialize.call(this, {
      features: []
    }, options);
  },
  onAdd: function onAdd(map) {
    var _this = this;

    this._map = map;
    //L.GeoJSON.prototype.onAdd.call(this, map);

    this._grid.addTo(this._map);
    this._markers.addTo(this._map);
    this._texts.addTo(this._map);

    this._addAction(this._map.on('zoomend', function () {
      _this.refresh();
    }));
    this._index();
    this.refresh();
  },
  _addAction: function _addAction(action) {
    this._actions.push(action);
  },
  _unregisterActions: function _unregisterActions() {
    this._actions.map(function (action) {
      action.off();
    });
  },
  addLayer: function addLayer(layer) {
    this.addLayers([layer]);
  },
  addLayers: function addLayers(layersArray) {
    var _this2 = this;

    layersArray.map(function (layer) {
      return _this2._addPoint(layer);
    });
  },
  unregister: function unregister() {
    this.clearLayers();
    this._unregisterActions();

    this._map.removeLayer(this._grid);
    this._map.removeLayer(this._markers);
    this._map.removeLayer(this._texts);
    this._map.removeLayer(this._displayedElsGroup);
  },
  _addPoint: function _addPoint(element) {
    // todo - filter non point and group data
    this._elements[this.lastelmid] = {
      "id": this.lastelmid,
      "geometry": element.geometry.coordinates,
      "properties": element.properties
    };

    this.lastelmid++;
    //L.GeoJSON.prototype.addData.call(this, element);

    if (this._map) {
      this._index();
      this.refresh();
    }
  },
  _index: function _index() {
    var times = [];
    times.push(new Date());
    this._indexCells();
    times.push(new Date());
    this._indexElements();
    times.push(new Date());

    if (this.options.trackingTime) {
      console.log('//////////////////////////////////');
      console.log('cells indexed in    ' + (times[1].valueOf() - times[0].valueOf()) + 'ms');
      console.log('elements indexed in ' + (times[2].valueOf() - times[1].valueOf()) + 'ms');
      console.log('indexing took       ' + (times[2].valueOf() - times[0].valueOf()) + 'ms');
      console.log('//////////////////////////////////');
    }
  },
  _getElementsCollection: function _getElementsCollection() {
    var _this3 = this;

    return Object.keys(this._elements).map(function (key) {
      return {
        id: _this3._elements[key].id,
        g: _this3._elements[key].geometry,
        i: _this3._elements[key].index
      };
    });
  },
  _displayElements: function _displayElements() {
    var _this4 = this;

    if (!this.elementDisplayed) {
      this._displayedElsGroup.clearLayers();
      this.elementDisplayed = true;

      this._getElementsCollection().map(function (element) {
        var newMarker = L.circleMarker([element.g[0], element.g[1]], 50, { fillColor: 'lightblue', stroke: false });

        _this4._displayedElsGroup.addLayer(newMarker);
      });

      this._displayedElsGroup.addTo(this._map);
    }
  },
  _hideElements: function _hideElements() {
    if (this.elementDisplayed) {
      this.elementDisplayed = false;
      this._displayedElsGroup.clearLayers();
    }
  },
  refresh: function refresh() {
    var zoom = this._map.getZoom();

    if (zoom > this.options.showElementsZoom) {
      console.log('elements will be displayed');
      this._displayElements();
    } else {
      console.log('elements will be hidden');
      this._hideElements();
      this._truncateLayers();

      var times = [];

      times.push(new Date());

      this._prepareCells();
      times.push(new Date());

      this._findElements();
      times.push(new Date());

      this._buildGrid();
      times.push(new Date());

      this._buildMarkers();
      times.push(new Date());

      this._buildTexts();
      times.push(new Date());

      if (this.options.trackingTime) {
        console.log('********************');
        console.log('cells prepared in ' + (times[1].valueOf() - times[0].valueOf()) + 'ms');
        console.log('elements found in ' + (times[2].valueOf() - times[1].valueOf()) + 'ms');
        console.log('grid built in     ' + (times[3].valueOf() - times[2].valueOf()) + 'ms');
        console.log('markers built in  ' + (times[4].valueOf() - times[3].valueOf()) + 'ms');
        console.log('texts built in    ' + (times[5].valueOf() - times[4].valueOf()) + 'ms');
        console.log(this._cells.length + ' cells refreshed in ' + (times[5].valueOf() - times[0].valueOf()) + 'ms');
        console.log('********************');
      }
    }
  },
  _truncateLayers: function _truncateLayers() {
    this._grid.truncate();
    this._markers.truncate();
    this._texts.truncate();
  },


  // Controlling grid
  _buildGrid: function _buildGrid() {
    if (this.options.rules.grid && this.options.showGrid) {
      this._visualise('grid');

      this._cells.forEach(function (cell) {
        if (this._cellIsNotEmpty(cell)) {
          var regularCell = new L.regularGridClusterCell(cell.path, cell.options.grid);
          this._grid.addLayer(regularCell);
        }
      }.bind(this));

      this._grid.addTo(this._map);
    }
  },
  _buildMarkers: function _buildMarkers() {
    var _this5 = this;

    if (this.options.rules.markers && this.options.showMarkers) {
      this._visualise('markers');

      this._cells.map(function (cell) {
        if (_this5._cellIsNotEmpty(cell)) {
          var cellCentroid = [cell.y + cell.h / 2, cell.x + cell.w / 2];
          var marker = new L.regularGridClusterMarker(cellCentroid, cell.options.markers);
          _this5._markers.addLayer(marker);
        }
      });

      this._markers.addTo(this._map);
    }
  },
  _buildTexts: function _buildTexts() {
    var _this6 = this;

    if (this.options.rules.texts && this.options.showTexts) {
      this._visualise('texts');

      this._cells.map(function (cell) {
        if (_this6._cellIsNotEmpty(cell)) {
          var cellCentroid = [cell.y + cell.h / 2, cell.x + cell.w / 2];
          var text = new L.regularGridClusterText(cellCentroid, cell.options.texts);
          _this6._texts.addLayer(text);
        }
      });

      this._texts.addTo(this._map);
    }
  },
  _indexCells: function _indexCells() {
    var origin = this._gridOrigin();
    var gridEnd = this._gridExtent().getNorthEast();
    var maxX = gridEnd.lng;
    var maxY = gridEnd.lat;

    var x = origin.lng;
    var y = origin.lat;

    var indexPortion = this.options.indexSize;
    var diffX = (maxX - x) / indexPortion;
    var diffY = (maxY - y) / indexPortion;
    this._indexedCells = {};

    var cellId = 0;

    for (var xi = x; xi < maxX; xi += diffX) {
      for (var yi = y; yi < maxY; yi += diffY) {
        var bounds = L.latLngBounds([yi, xi], [yi + diffY, xi + diffX]);
        this._indexedCells[cellId] = {
          b: bounds,
          cs: []
        };
        cellId = cellId + 1;
      }
    }
  },
  _indexElements: function _indexElements() {
    var _this7 = this;

    var elements = this._getElementsCollection();

    elements.map(function (element) {
      for (var ici in _this7._indexedCells) {
        var indexedCell = _this7._indexedCells[ici];
        if (indexedCell.b.contains(element.g)) {
          _this7._elements[element.id].index = ici;
          break;
        }
      }
    });
  },
  _indexedCellsCollection: function _indexedCellsCollection() {
    var _this8 = this;

    return Object.keys(this._indexedCells).map(function (key) {
      return _this8._indexedCells[key];
    });
  },
  _truncateIndexedCells: function _truncateIndexedCells() {
    this._indexedCellsCollection().map(function (indexedCell) {
      indexedCell.cs = [];
    });
  },
  _prepareCells: function _prepareCells() {
    this._cells = [];
    this._truncateIndexedCells();
    var cellId = 1;

    var cellSize = this._cellSize();

    var origin = this._gridOrigin();
    var gridEnd = this._gridExtent().getNorthEast();
    var maxX = gridEnd.lng;
    var maxY = gridEnd.lat;

    var x = origin.lng;
    var y = origin.lat;
    var cellW = cellSize / 111319;

    var indexedCellsCollection = this._indexedCellsCollection();
    var row = 1;

    var indexCellsInCollection = function indexCellsInCollection(cell, cellBounds) {
      indexedCellsCollection.map(function (indexedCell) {
        if (indexedCell.b.overlaps(cellBounds)) {
          indexedCell.cs.push(cell);
        }
      });
    };

    while (y < maxY) {
      var cellH = this._cellHeightAtY(y, cellSize);

      if (this.options.gridMode == 'hexagon') {
        if (row % 2) {
          x -= cellW / 2;
        }
      }

      while (x < maxX) {
        var cell = {
          id: cellId,
          x: x,
          y: y,
          h: cellH,
          w: cellW,

          options: {
            grid: {},
            markers: {},
            texts: {}
          },

          elms: []
        };
        var cellBounds = L.latLngBounds([y, x], [y + cellH, x + cellW]);

        cell.path = this._buildPathOperations[this.options.gridMode].call(this, cell);
        this._cells.push(cell);

        indexCellsInCollection(cell, cellBounds);
        cellId++;

        x += cellW;
      }

      x = origin.lng;
      //y += cellH;
      if (this.options.gridMode == 'hexagon') {
        y += 3 / 4 * cellH;
      } else {
        y += cellH;
      }
      row += 1;
    }
  },
  _findElements: function _findElements() {
    var _this9 = this;

    var elements = this._getElementsCollection();

    elements.map(function (element) {
      var ei = element.id;
      var ex = element.g[1];
      var ey = element.g[0];
      var cellsAtIndex = _this9._indexedCells[element.i].cs;

      cellsAtIndex.map(function (cell) {
        if (_this9._elmInsideOperations[_this9.options.gridMode].call(_this9, ex, ey, cell)) {
          cell.elms.push(ei);
        }
      });
    });
  },


  _cellIsNotEmpty: function _cellIsNotEmpty(cell) {
    return cell.elms.length !== 0;
  },

  _visualise: function _visualise(featureType) {
    var _this10 = this;

    var cj = void 0;
    var cell = void 0;

    if (this.options.rules[featureType]) {

      Object.keys(this.options.rules[featureType]).map(function (option) {
        var rule = _this10.options.rules[featureType][option];

        if (option == 'text') {
          _this10._cellsValues(rule.method, rule.attribute);
          _this10._cells.map(function (cell) {
            if (_this10._cellIsNotEmpty(cell)) {
              cell.options.texts.text = cell.value;
            }
          });
        } else if (_this10._isDynamicalRule(rule)) {
          _this10._cellsValues(rule.method, rule.attribute);
          _this10._applyOptions(featureType, rule.scale, rule.style, option);
        } else {
          _this10._cells.map(function (cell) {
            if (_this10._cellIsNotEmpty(cell)) {
              cell.options[featureType][option] = rule;
            }
          });
        }
      });
    }
  },
  _applyOptions: function _applyOptions(featureType, scale, style, option) {
    var _this11 = this;

    var values = this._cellValues(true).sort(function (a, b) {
      return a - b;
    });
    var noInts = style.length;

    if (scale === 'continuous') {
      noInts = noInts - 1;
    }
    var max = Math.max.apply(Math, _toConsumableArray(values));
    var min = Math.min.apply(Math, _toConsumableArray(values));

    var thresholds = [];

    if (scale != 'size') {
      var qLen = Math.floor(values.length / noInts);

      for (var i = 1; i != noInts; i++) {
        thresholds.push(values[qLen * i]);
      }
    }

    if (this._scaleOperations[scale]) {
      this._cells.map(function (cell) {
        if (_this11._isDefined(cell.value)) {
          cell.options[featureType][option] = _this11._scaleOperations[scale].call(_this11, cell.value, min, max, noInts, thresholds, style);
        }
      });
    }
  },
  _cellsValues: function _cellsValues(method, attr) {
    var _this12 = this;

    this._cells.map(function (cell) {
      if (_this12._cellIsNotEmpty(cell)) {
        var cellValues = void 0;

        if (method !== 'count') {
          cellValues = _this12._cellAttrValues(cell, attr);
        }
        cell.value = _this12._methodOperations[method].call(_this12, cell, cellValues);
      }
    });
  },
  _cellValues: function _cellValues(onlyDefined) {
    if (onlyDefined) {
      return this._cells.filter(function (cell) {
        return typeof cell.value !== 'undefined' && !isNaN(cell.value);
      }).map(function (cell) {
        return cell.value;
      });
    } else {
      return this._cells.map(function (cell) {
        return cell.value;
      });
    }
  },
  _cellAttrValues: function _cellAttrValues(cell, attr) {
    var _this13 = this;

    return cell.elms.map(function (elm) {
      return _this13._elements[elm].properties[attr];
    });
  },
  _isDynamicalRule: function _isDynamicalRule(rule) {
    return rule.method && rule.scale && rule.style;
  },


  // return size of the cell in meters
  _cellSize: function _cellSize() {
    return this.options.cellSize * Math.pow(2, 10 - this._mapZoom());
  },
  _gridOrigin: function _gridOrigin() {
    return this._gridExtent().getSouthWest();
  },
  _gridExtent: function _gridExtent() {
    return this._getBounds().pad(this.options.gridBoundsPadding);
  },
  _getBounds: function _getBounds() {
    return L.latLngBounds(this._getGeometries());
  },
  _getGeometries: function _getGeometries() {
    return this._getElementsCollection().map(function (element) {
      return element.g;
    });
  },
  _mapZoom: function _mapZoom() {
    if (this._map) {
      return this._map.getZoom();
    } else {
      return false;
    }
  },


  // BASE FUNCTIONS
  // longitude delta for given latitude
  _cellHeightAtY: function _cellHeightAtY(y, cellSize) {
    return cellSize / 111319;
    // return (cellSize/111319) * this._deltaHeightAtY(y);
  },


  // multiplier for y size at given latitude
  _deltaHeightAtY: function _deltaHeightAtY(lat) {
    return Math.abs(1 / Math.cos(lat * Math.PI / 180));
  },
  _isDefined: function _isDefined(value) {
    return !(!value && value !== 0);
  },
  _isNumber: function _isNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }
});

L.regularGridCluster = function (options) {
  return new L.RegularGridCluster(options);
};
"use strict";

// COLORS FUNCTIONS

L.RegularGridCluster.include({
  // COLORS
  _colorNameToHex: function _colorNameToHex(color) {
    var colors = { "aliceblue": "#f0f8ff", "antiquewhite": "#faebd7", "aqua": "#00ffff", "aquamarine": "#7fffd4", "azure": "#f0ffff",
      "beige": "#f5f5dc", "bisque": "#ffe4c4", "black": "#000000", "blanchedalmond": "#ffebcd", "blue": "#0000ff", "blueviolet": "#8a2be2", "brown": "#a52a2a", "burlywood": "#deb887",
      "cadetblue": "#5f9ea0", "chartreuse": "#7fff00", "chocolate": "#d2691e", "coral": "#ff7f50", "cornflowerblue": "#6495ed", "cornsilk": "#fff8dc", "crimson": "#dc143c", "cyan": "#00ffff",
      "darkblue": "#00008b", "darkcyan": "#008b8b", "darkgoldenrod": "#b8860b", "darkgray": "#a9a9a9", "darkgreen": "#006400", "darkkhaki": "#bdb76b", "darkmagenta": "#8b008b", "darkolivegreen": "#556b2f",
      "darkorange": "#ff8c00", "darkorchid": "#9932cc", "darkred": "#8b0000", "darksalmon": "#e9967a", "darkseagreen": "#8fbc8f", "darkslateblue": "#483d8b", "darkslategray": "#2f4f4f", "darkturquoise": "#00ced1",
      "darkviolet": "#9400d3", "deeppink": "#ff1493", "deepskyblue": "#00bfff", "dimgray": "#696969", "dodgerblue": "#1e90ff",
      "firebrick": "#b22222", "floralwhite": "#fffaf0", "forestgreen": "#228b22", "fuchsia": "#ff00ff",
      "gainsboro": "#dcdcdc", "ghostwhite": "#f8f8ff", "gold": "#ffd700", "goldenrod": "#daa520", "gray": "#808080", "green": "#008000", "greenyellow": "#adff2f",
      "honeydew": "#f0fff0", "hotpink": "#ff69b4",
      "indianred ": "#cd5c5c", "indigo": "#4b0082", "ivory": "#fffff0", "khaki": "#f0e68c",
      "lavender": "#e6e6fa", "lavenderblush": "#fff0f5", "lawngreen": "#7cfc00", "lemonchiffon": "#fffacd", "lightblue": "#add8e6", "lightcoral": "#f08080", "lightcyan": "#e0ffff", "lightgoldenrodyellow": "#fafad2",
      "lightgrey": "#d3d3d3", "lightgreen": "#90ee90", "lightpink": "#ffb6c1", "lightsalmon": "#ffa07a", "lightseagreen": "#20b2aa", "lightskyblue": "#87cefa", "lightslategray": "#778899", "lightsteelblue": "#b0c4de",
      "lightyellow": "#ffffe0", "lime": "#00ff00", "limegreen": "#32cd32", "linen": "#faf0e6",
      "magenta": "#ff00ff", "maroon": "#800000", "mediumaquamarine": "#66cdaa", "mediumblue": "#0000cd", "mediumorchid": "#ba55d3", "mediumpurple": "#9370d8", "mediumseagreen": "#3cb371", "mediumslateblue": "#7b68ee",
      "mediumspringgreen": "#00fa9a", "mediumturquoise": "#48d1cc", "mediumvioletred": "#c71585", "midnightblue": "#191970", "mintcream": "#f5fffa", "mistyrose": "#ffe4e1", "moccasin": "#ffe4b5",
      "navajowhite": "#ffdead", "navy": "#000080",
      "oldlace": "#fdf5e6", "olive": "#808000", "olivedrab": "#6b8e23", "orange": "#ffa500", "orangered": "#ff4500", "orchid": "#da70d6",
      "palegoldenrod": "#eee8aa", "palegreen": "#98fb98", "paleturquoise": "#afeeee", "palevioletred": "#d87093", "papayawhip": "#ffefd5", "peachpuff": "#ffdab9", "peru": "#cd853f", "pink": "#ffc0cb", "plum": "#dda0dd", "powderblue": "#b0e0e6", "purple": "#800080",
      "red": "#ff0000", "rosybrown": "#bc8f8f", "royalblue": "#4169e1",
      "saddlebrown": "#8b4513", "salmon": "#fa8072", "sandybrown": "#f4a460", "seagreen": "#2e8b57", "seashell": "#fff5ee", "sienna": "#a0522d", "silver": "#c0c0c0", "skyblue": "#87ceeb", "slateblue": "#6a5acd", "slategray": "#708090", "snow": "#fffafa", "springgreen": "#00ff7f", "steelblue": "#4682b4",
      "tan": "#d2b48c", "teal": "#008080", "thistle": "#d8bfd8", "tomato": "#ff6347", "turquoise": "#40e0d0",
      "violet": "#ee82ee",
      "wheat": "#f5deb3", "white": "#ffffff", "whitesmoke": "#f5f5f5",
      "yellow": "#ffff00", "yellowgreen": "#9acd32" };

    if (typeof colors[color.toLowerCase()] != 'undefined') {
      return colors[color.toLowerCase()].substring(1);
    } else {
      return false;
    }
  },

  _hex: function _hex(x) {
    x = x.toString(16);
    return x.length == 1 ? '0' + x : x;
  },

  _validateColor: function _validateColor(color) {

    if (color.indexOf('#') == -1) {
      return this._colorNameToHex(color);
    } else {
      return color.substring(1);
    }
  },

  _colorMix: function _colorMix(color1, color2, ratio) {
    color1 = this._validateColor(color1);
    color2 = this._validateColor(color2);

    var r = Math.floor(parseInt(color1.substring(0, 2), 16) * ratio + parseInt(color2.substring(0, 2), 16) * (1 - ratio));
    var g = Math.floor(parseInt(color1.substring(2, 4), 16) * ratio + parseInt(color2.substring(2, 4), 16) * (1 - ratio));
    var b = Math.floor(parseInt(color1.substring(4, 6), 16) * ratio + parseInt(color2.substring(4, 6), 16) * (1 - ratio));

    return '#' + this._hex(r) + this._hex(g) + this._hex(b);
  }
});
"use strict";

// MATH FUNCTIONS

L.RegularGridCluster.include({
  _math_max: function _math_max(arr) {
    if (arr.length) {
      return Math.max.apply(null, arr.map(function (o) {
        if (o) {
          return o;
        } else {
          return 0;
        }
      }));
    } else {
      return undefined;
    }
  },

  _math_min: function _math_min(arr) {
    if (arr.length) {
      return Math.min.apply(null, arr.map(function (o) {
        if (o) {
          return o;
        } else {
          return 99999;
        }
      }));
    } else {
      return undefined;
    }
  },

  _math_mode: function _math_mode(arr) {
    if (arr.length === 0) {
      return null;
    }
    var modeMap = {};
    var maxEl = arr[0],
        maxCount = 1;

    for (var i = 0; i < arr.length; i++) {
      var el = arr[i];
      if (el) {
        if (modeMap[el] === null) {
          modeMap[el] = 1;
        } else {
          modeMap[el]++;
        }
        if (modeMap[el] > maxCount) {
          maxEl = el;
          maxCount = modeMap[el];
        }
        // extendable to solve ties
      }
    }
    return maxEl;
  },

  _math_mean: function _math_mean(arr) {
    var state = arr.reduce(function (state, a) {
      if (a) {
        state.sum += a;
        state.count += 1;
      }
      return state;
    }, { sum: 0, count: 0 });
    return state.sum / state.count;
  },

  _math_sum: function _math_sum(arr) {
    if (arr.length === 0) {
      return 0;
    }
    return arr.reduce(function (a, b) {
      if (b) {
        return a + b;
      } else {
        return 0;
      }
    }, 0);
  },

  _math_median: function _math_median(arr) {
    arr.sort(function (a, b) {
      return a - b;
    });
    var half = Math.floor(arr.length / 2);

    if (arr.length % 2) {
      return arr[half];
    } else {
      return (arr[half - 1] + arr[half]) / 2.0;
    }
  }
});
"use strict";

/*jshint esversion: 6 */

L.RegularGridCluster.include({
  _scaleOperations: {
    size: function size(value, min, max, noInts, thresholds, style) {
      var diff = max - min;
      var interval = noInts - 1;
      if (value < max) {
        interval = Math.floor((value - min) / diff * noInts);
      }
      return style[interval];
    },

    quantile: function quantile(value, min, max, noInts, thresholds, style) {
      var interval = 0;
      for (var ti in thresholds) {
        if (value > thresholds[ti]) {
          interval = parseInt(ti) + 1;
        }
      }
      return style[interval];
    },

    continuous: function continuous(value, min, max, noInts, thresholds, style) {
      var interval = 0;

      for (var tj in thresholds) {
        if (value > thresholds[tj]) {
          interval = parseInt(tj) + 1;
        }
      }

      var edgeValues = thresholds.slice(0);
      edgeValues.push(max);
      edgeValues.unshift(min);

      var ratioDif = (value - edgeValues[interval]) / (edgeValues[interval + 1] - edgeValues[interval]);
      var bottomValue = style[interval];
      var upperValue = style[interval + 1];
      var styleValue;

      if (this._isNumber(bottomValue)) {
        styleValue = bottomValue + ratioDif * (upperValue - bottomValue);
      } else {
        styleValue = this._colorMix(upperValue, bottomValue, ratioDif);
      }

      return styleValue;
    }
  },

  _methodOperations: {
    count: function count(cell, values) {
      return cell.elms.length;
    },
    mean: function mean(cell, values) {
      return this._math_mean(values);
    },
    median: function median(cell, values) {
      return this._math_median(values);
    },
    mode: function mode(cell, values) {
      return this._math_mode(values);
    },
    max: function max(cell, values) {
      return this._math_max(values);
    },
    min: function min(cell, values) {
      return this._math_min(values);
    },
    sum: function sum(cell, values) {
      return this._math_sum(values);
    }
  },

  _elmInsideOperations: {
    square: function square(ex, ey, cell) {
      var x1 = cell.x,
          x2 = cell.x + cell.w,
          y1 = cell.y,
          y2 = cell.y + cell.h;
      if (ex > x1) {
        if (ey > y1) {
          if (ex < x2) {
            if (ey < y2) {
              return true;
            }
          }
        }
      }
      return false;
    },
    hexagon: function hexagon(ex, ey, cell) {
      var x1 = cell.x,
          x2 = cell.x + cell.w,
          y1 = cell.y,
          y2 = cell.y + cell.h;
      if (ex > x1) {
        if (ey > y1) {
          if (ex < x2) {
            if (ey < y2) {
              var yh1 = y1 + cell.h * 1 / 4,
                  yh2 = y1 + cell.h * 3 / 4;
              if (ey > yh1 && ey < yh2) {
                return true;
              } else {
                var tx = ex - x1,
                    ty = ey - y1;
                if (ty > cell.h / 4 * 3) {
                  ty = cell.h - ty;
                }
                if (tx > cell.w / 2) {
                  tx = cell.w - tx;
                }
                return ty / (cell.h / 4) + tx / (cell.w / 2) > 1;
              }
            }
          }
        }
      }
      return false;
    }
  },

  _buildPathOperations: {
    square: function square(c) {
      return [[c.y, c.x], [c.y, c.x + c.w], [c.y + c.h, c.x + c.w], [c.y + c.h, c.x], [c.y, c.x]];
    },
    hexagon: function hexagon(c) {
      return [[c.y + c.h / 4, c.x], [c.y, c.x + c.w / 2], [c.y + c.h / 4, c.x + c.w], [c.y + 3 * (c.h / 4), c.x + c.w], [c.y + c.h, c.x + c.w / 2], [c.y + 3 * (c.h / 4), c.x], [c.y + c.h / 4, c.x]];
    }
  }
});
