 /* Adam Mertel|UNIVIE */

(function(exports, global) {
    L.RegularGridClusterCell = L.Polygon.extend({
        options: {
            weight: 1,
            fillOpacity: .6,
            clickable: false,
            color: "grey",
            lineJoin: "miter",
            fillRule: "evenodd",
            strokeLocation: "inside"
        },
        initialize: function(path, options) {
            this.options = L.extend(this.options, options);
            L.Util.setOptions(this, this.options);
            L.Polygon.prototype.initialize.call(this, path, this.options);
        }
    });
    L.regularGridClusterCell = function(path, options) {
        return new L.RegularGridClusterCell(path, options);
    };
    L.RegularGridClusterGrid = L.FeatureGroup.extend({
        options: {},
        initialize: function(options) {
            this.controller = options.controller;
            this.options = L.extend(this.options, options);
            L.Util.setOptions(this, options);
            L.FeatureGroup.prototype.initialize.call(this, {
                features: []
            }, options);
        },
        render: function(cellSize, origin) {},
        addLayer: function(cell) {
            L.FeatureGroup.prototype.addLayer.call(this, cell);
        },
        truncate: function() {
            this.clearLayers();
        }
    });
    L.regularGridClusterGrid = function(options) {
        return new L.RegularGridClusterGrid(options);
    };
    L.RegularGridClusterMarker = L.CircleMarker.extend({
        options: {
            radius: 10
        },
        initialize: function(centroid, options) {
            this.options = L.extend(this.options, options);
            L.Util.setOptions(this, options);
            L.CircleMarker.prototype.initialize.call(this, centroid, options);
        }
    });
    L.regularGridClusterMarker = function(centroid, options) {
        return new L.RegularGridClusterMarker(centroid, options);
    };
    L.RegularGridClusterMarkersGroup = L.FeatureGroup.extend({
        options: {},
        initialize: function(options) {
            this.controller = options.controller;
            this.options = L.extend(this.options, options);
            L.Util.setOptions(this, options);
            L.FeatureGroup.prototype.initialize.call(this, {
                features: []
            }, options);
        },
        render: function(cellSize, origin) {},
        addLayer: function(marker) {
            L.FeatureGroup.prototype.addLayer.call(this, marker);
        },
        truncate: function() {
            this.clearLayers();
        }
    });
    L.regularGridClusterMarkersGroup = function(options) {
        return new L.RegularGridClusterMarkersGroup(options);
    };
    L.RegularGridClusterText = L.Marker.extend({
        options: {
            style: {
                border: "0px !important"
            }
        },
        initialize: function(centroid, options) {
            this.options = L.extend(this.options, options);
            L.Util.setOptions(this, options);
            var iconOptions = JSON.stringify(options).substring(1, JSON.stringify(options).length - 2).replace(/,/g, ";").replace(/\"/g, "");
            options.icon = L.divIcon({
                html: '<span style="' + iconOptions + ' ; text-align: center">' + this.options.text + "</span>",
                iconSize: [ 0, 0 ],
                iconAnchor: [ options.anchorOffsetX || -10, options.anchorOffsetY || -30 ]
            });
            options.border = "3px solid black";
            L.Marker.prototype.initialize.call(this, centroid, options);
        }
    });
    L.regularGridClusterText = function(centroid, options) {
        return new L.RegularGridClusterText(centroid, options);
    };
    L.RegularGridClusterTextsGroup = L.FeatureGroup.extend({
        options: {},
        initialize: function(options) {
            this.controller = options.controller;
            this.options = L.extend(this.options, options);
            L.Util.setOptions(this, options);
            L.FeatureGroup.prototype.initialize.call(this, {
                features: []
            }, options);
        },
        render: function(cellSize, origin) {},
        addLayer: function(marker) {
            L.FeatureGroup.prototype.addLayer.call(this, marker);
        },
        truncate: function() {
            this.clearLayers();
        }
    });
    L.regularGridClusterTextsGroup = function(options) {
        return new L.RegularGridClusterTextsGroup(options);
    };
    L.RegularGridCluster = L.GeoJSON.extend({
        options: {
            gridBoundsPadding: .1,
            gridMode: "square",
            cellSize: 1e4,
            showGrid: true,
            showMarkers: true,
            showTexts: true,
            showElementsZoom: 19,
            indexSize: 12,
            rules: {}
        },
        initialize: function(options) {
            this.options = L.extend(this.options, options);
            this.lastelmid = 0;
            L.Util.setOptions(this, options);
            this._elements = {};
            this._cells = [];
            this._grid = new L.regularGridClusterGrid({
                controller: this
            });
            this._markers = new L.regularGridClusterMarkersGroup({
                controller: this
            });
            this._texts = new L.regularGridClusterTextsGroup({
                controller: this
            });
            L.FeatureGroup.prototype.initialize.call(this, {
                features: []
            }, options);
        },
        onAdd: function(map) {
            var that = this;
            this._map = map;
            this._grid.addTo(this._map);
            this._markers.addTo(this._map);
            this._texts.addTo(this._map);
            this._map.on("zoomend", function() {
                that.refresh();
            });
            this._index();
            this.refresh();
        },
        addElement: function(element) {
            this._elements[this.lastelmid] = {
                id: this.lastelmid,
                geometry: element.geometry.coordinates,
                properties: element.properties
            };
            this.lastelmid++;
            if (this._map) {
                this._index();
                this.refresh();
            }
        },
        _index: function() {
            var time1 = new Date();
            this._indexCells();
            var time2 = new Date();
            this._indexElements();
            var time3 = new Date();
            console.log("//////////////////////////////////");
            console.log("cells indexed in " + (time2.valueOf() - time1.valueOf()) + "ms");
            console.log("elements indexed in " + (time3.valueOf() - time2.valueOf()) + "ms");
            console.log("indexing took " + (time3.valueOf() - time1.valueOf()) + "ms");
            console.log("//////////////////////////////////");
        },
        addData: function(element) {},
        refresh: function() {
            this._truncateLayers();
            var time1 = new Date();
            this._prepareCells();
            var time2 = new Date();
            this._findElements();
            var time3 = new Date();
            this._buildGrid();
            var time4 = new Date();
            this._buildMarkers();
            var time5 = new Date();
            this._buildTexts();
            var time6 = new Date();
            console.log("********************");
            console.log("cells prepared in " + (time2.valueOf() - time1.valueOf()) + "ms");
            console.log("elements found in " + (time3.valueOf() - time2.valueOf()) + "ms");
            console.log("grid built in " + (time4.valueOf() - time3.valueOf()) + "ms");
            console.log("markers built in " + (time5.valueOf() - time4.valueOf()) + "ms");
            console.log("texts built in " + (time6.valueOf() - time5.valueOf()) + "ms");
            console.log(this._cells.length + " cells refreshed in " + (time6.valueOf() - time1.valueOf()) + "ms");
            console.log("********************");
        },
        _truncateLayers: function() {
            this._grid.truncate();
            this._markers.truncate();
            this._texts.truncate();
        },
        _buildGrid: function() {
            if (this.options.rules.grid && this.options.showGrid) {
                this._visualise("grid");
                this._cells.forEach(function(cell) {
                    if (this._cellIsNotEmpty(cell)) {
                        var regularCell = new L.regularGridClusterCell(cell.path, cell.options.grid);
                        this._grid.addLayer(regularCell);
                    }
                }.bind(this));
                this._grid.addTo(this._map);
            }
        },
        _buildMarkers: function() {
            if (this.options.rules.markers && this.options.showMarkers) {
                this._visualise("markers");
                this._cells.forEach(function(cell) {
                    if (this._cellIsNotEmpty(cell)) {
                        var cellCentroid = [ cell.y + cell.h / 2, cell.x + cell.w / 2 ];
                        var marker = new L.regularGridClusterMarker(cellCentroid, cell.options.markers);
                        this._markers.addLayer(marker);
                    }
                }.bind(this));
                this._markers.addTo(this._map);
            }
        },
        _buildTexts: function() {
            if (this.options.rules.texts && this.options.showTexts) {
                this._visualise("texts");
                this._cells.forEach(function(cell) {
                    if (this._cellIsNotEmpty(cell)) {
                        var cellCentroid = [ cell.y + cell.h / 2, cell.x + cell.w / 2 ];
                        var text = new L.regularGridClusterText(cellCentroid, cell.options.texts);
                        this._texts.addLayer(text);
                    }
                }.bind(this));
                this._texts.addTo(this._map);
            }
        },
        _indexCells: function() {
            var origin = this._gridOrigin();
            var gridEnd = this._gridExtent().getNorthEast();
            var maxX = gridEnd.lng, maxY = gridEnd.lat;
            var x = origin.lng, y = origin.lat;
            var indexPortion = this.options.indexSize;
            var diffX = (maxX - x) / indexPortion;
            var diffY = (maxY - y) / indexPortion;
            this._indexedCells = {};
            var cellId = 0;
            for (var xi = x; xi < maxX; xi += diffX) {
                for (var yi = y; yi < maxY; yi += diffY) {
                    var bounds = L.latLngBounds([ yi, xi ], [ yi + diffY, xi + diffX ]);
                    this._indexedCells[cellId] = {
                        b: bounds,
                        cs: []
                    };
                    cellId = cellId + 1;
                }
            }
        },
        _indexElements: function() {
            var elements = this._getElementsCollection();
            elements.forEach(function(element) {
                for (var ici in this._indexedCells) {
                    var indexedCell = this._indexedCells[ici];
                    if (indexedCell.b.contains(element.g)) {
                        this._elements[element.id].index = ici;
                        break;
                    }
                }
            }.bind(this));
        },
        _indexedCellsCollection: function() {
            var that = this;
            return Object.keys(this._indexedCells).map(function(key) {
                return that._indexedCells[key];
            });
        },
        _truncateIndexedCells: function() {
            var indexedCellsCollection = this._indexedCellsCollection();
            indexedCellsCollection.forEach(function(indexedCell) {
                indexedCell.cs = [];
            });
        },
        _prepareCells: function() {
            this._cells = [];
            this._truncateIndexedCells();
            var cellId = 1;
            var cellSize = this._cellSize();
            var origin = this._gridOrigin();
            var gridEnd = this._gridExtent().getNorthEast();
            var maxX = gridEnd.lng, maxY = gridEnd.lat;
            var x = origin.lng, y = origin.lat;
            var cellW = cellSize / 111319;
            var indexedCellsCollection = this._indexedCellsCollection();
            while (y < maxY) {
                var cellH = this._cellHeightAtY(y, cellSize);
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
                    var cellBounds = L.latLngBounds([ y, x ], [ y + cellH, x + cellW ]);
                    cell.path = this._cellPath(cell);
                    this._cells.push(cell);
                    for (var icci in indexedCellsCollection) {
                        indexedCell = indexedCellsCollection[icci];
                        if (indexedCell.b.overlaps(cellBounds)) {
                            indexedCell.cs.push(cell);
                        }
                    }
                    cellId++;
                    x += cellW;
                }
                x = origin.lng;
                y += cellH;
            }
        },
        _findElements: function() {
            var elements = this._getElementsCollection();
            elements.forEach(function(element) {
                var ei = element.id, ex = element.g[1], ey = element.g[0];
                var cellsAtIndex = this._indexedCells[element.i].cs;
                for (var ci in cellsAtIndex) {
                    var cell = cellsAtIndex[ci];
                    var x1 = cell.x, x2 = cell.x + cell.w, y1 = cell.y, y2 = cell.y + cell.h;
                    if (ex > x1) {
                        if (ey > y1) {
                            if (ex < x2) {
                                if (ey < y2) {
                                    cell.elms.push(ei);
                                    break;
                                }
                            }
                        }
                    }
                }
            }.bind(this));
        },
        _cellIsNotEmpty: function(cell) {
            return cell.elms.length !== 0;
        },
        _cellPath: function(cell) {
            var c = cell;
            switch (this.options.gridMode) {
              case "square":
                return [ [ c.y, c.x ], [ c.y, c.x + c.w ], [ c.y + c.h, c.x + c.w ], [ c.y + c.h, c.x ], [ c.y, c.x ] ];

              default:
                return [ [ c.y, c.x ], [ c.y, c.x + c.w ], [ c.y + c.h, c.x + c.w ], [ c.y + c.h, c.x ], [ c.y, c.x ] ];
            }
        },
        _cellElmsInside: function(cell, elements) {
            return this._cellsInsideOperations[this.options.gridMode].call(this, cell, elements);
        },
        _elmsInsideSquare: function(cell, elements) {
            var elsInside = [];
            var x1 = cell.x, x2 = cell.x + cell.w, y1 = cell.y, y2 = cell.y + cell.h;
            for (var id in elements) {
                var element = elements[id];
                var ex = element[1], ey = element[0];
                if (ex > x1) {
                    if (ey > y1) {
                        if (ex < x2) {
                            if (ey < y2) {
                                elsInside.push(id);
                                delete elements[id];
                            }
                        }
                    }
                }
            }
            return elsInside;
        },
        _getElementsCollection: function() {
            var that = this;
            return Object.keys(this._elements).map(function(key) {
                return {
                    id: that._elements[key].id,
                    g: that._elements[key].geometry,
                    i: that._elements[key].index
                };
            });
        },
        _visualise: function(featureType) {
            var that = this;
            if (this.options.rules[featureType]) {
                Object.keys(this.options.rules[featureType]).map(function(option) {
                    var rule = that.options.rules[featureType][option];
                    if (that._isDynamicalRule(rule)) {
                        that._cellsValues(rule.method, rule.attribute);
                        that._applyOptions(featureType, rule.scale, rule.style, option);
                    } else {
                        for (var cj in that._cells) {
                            var cell = that._cells[cj];
                            if (that._cellIsNotEmpty(cell)) {
                                cell.options[featureType][option] = rule;
                            }
                        }
                    }
                });
            }
        },
        _applyOptions: function(featureType, scale, style, option) {
            var values = this._cellValues(true).sort(function(a, b) {
                return a - b;
            });
            var noInts = style.length;
            if (scale === "continuous") {
                noInts = noInts - 1;
            }
            var max = Math.max.apply(null, values);
            var min = Math.min.apply(null, values);
            var thresholds = [];
            if (scale != "size") {
                var qLen = Math.floor(values.length / noInts);
                for (var i = 1; i != noInts; i++) {
                    thresholds.push(values[qLen * i]);
                }
            }
            if (this._scaleOperations[scale]) {
                for (var c in this._cells) {
                    var cell = this._cells[c];
                    if (this._isDefined(cell.value)) {
                        cell.options[featureType][option] = this._scaleOperations[scale].call(this, cell.value, min, max, noInts, thresholds, style);
                    }
                }
            }
        },
        _cellsValues: function(method, attr) {
            for (var c in this._cells) {
                var cell = this._cells[c];
                if (this._cellIsNotEmpty(cell)) {
                    var cellValues;
                    if (method !== "count") {
                        cellValues = this._cellAttrValues(cell, attr);
                    }
                    cell.value = this._methodOperations[method].call(this, cell, cellValues);
                }
            }
        },
        _cellValues: function(onlyDefined) {
            var values = [];
            for (var c in this._cells) {
                if (onlyDefined) {
                    if (typeof this._cells[c].value !== "undefined" && !isNaN(this._cells[c].value)) {
                        values.push(this._cells[c].value);
                    }
                } else {
                    values.push(this._cells[c].value);
                }
            }
            return values;
        },
        _cellAttrValues: function(cell, attr) {
            var values = [];
            for (var e in cell.elms) {
                values.push(this._elements[cell.elms[e]].properties[attr]);
            }
            return values;
        },
        _isDynamicalRule: function(rule) {
            return rule.method && rule.scale && rule.style;
        },
        _cellSize: function() {
            return this.options.cellSize * Math.pow(2, 10 - this._mapZoom());
        },
        _gridOrigin: function() {
            return this._gridExtent().getSouthWest();
        },
        _gridExtent: function() {
            return this._getBounds().pad(this.options.gridBoundsPadding);
        },
        _getBounds: function() {
            var coordinates = this._getGeometries();
            return L.latLngBounds(coordinates);
        },
        _getGeometries: function() {
            var geometries = [];
            var elements = this._getElementsCollection();
            for (var e in elements) {
                geometries.push(elements[e].g);
            }
            return geometries;
        },
        _mapZoom: function() {
            if (this._map) {
                return this._map.getZoom();
            } else {
                return false;
            }
        },
        _cellHeightAtY: function(y, cellSize) {
            return cellSize / 111319 * this._deltaHeightAtY(y);
        },
        _deltaHeightAtY: function(lat) {
            return Math.abs(1 / Math.cos(lat * Math.PI / 180));
        },
        _isDefined: function(value) {
            if (!value && value !== 0) {
                return false;
            } else {
                return true;
            }
        },
        _isNumber: function(value) {
            return !isNaN(parseFloat(value)) && isFinite(value);
        }
    });
    L.regularGridCluster = function(options) {
        return new L.RegularGridCluster(options);
    };
    L.RegularGridCluster.include({
        _colorNameToHex: function(color) {
            var colors = {
                aliceblue: "#f0f8ff",
                antiquewhite: "#faebd7",
                aqua: "#00ffff",
                aquamarine: "#7fffd4",
                azure: "#f0ffff",
                beige: "#f5f5dc",
                bisque: "#ffe4c4",
                black: "#000000",
                blanchedalmond: "#ffebcd",
                blue: "#0000ff",
                blueviolet: "#8a2be2",
                brown: "#a52a2a",
                burlywood: "#deb887",
                cadetblue: "#5f9ea0",
                chartreuse: "#7fff00",
                chocolate: "#d2691e",
                coral: "#ff7f50",
                cornflowerblue: "#6495ed",
                cornsilk: "#fff8dc",
                crimson: "#dc143c",
                cyan: "#00ffff",
                darkblue: "#00008b",
                darkcyan: "#008b8b",
                darkgoldenrod: "#b8860b",
                darkgray: "#a9a9a9",
                darkgreen: "#006400",
                darkkhaki: "#bdb76b",
                darkmagenta: "#8b008b",
                darkolivegreen: "#556b2f",
                darkorange: "#ff8c00",
                darkorchid: "#9932cc",
                darkred: "#8b0000",
                darksalmon: "#e9967a",
                darkseagreen: "#8fbc8f",
                darkslateblue: "#483d8b",
                darkslategray: "#2f4f4f",
                darkturquoise: "#00ced1",
                darkviolet: "#9400d3",
                deeppink: "#ff1493",
                deepskyblue: "#00bfff",
                dimgray: "#696969",
                dodgerblue: "#1e90ff",
                firebrick: "#b22222",
                floralwhite: "#fffaf0",
                forestgreen: "#228b22",
                fuchsia: "#ff00ff",
                gainsboro: "#dcdcdc",
                ghostwhite: "#f8f8ff",
                gold: "#ffd700",
                goldenrod: "#daa520",
                gray: "#808080",
                green: "#008000",
                greenyellow: "#adff2f",
                honeydew: "#f0fff0",
                hotpink: "#ff69b4",
                "indianred ": "#cd5c5c",
                indigo: "#4b0082",
                ivory: "#fffff0",
                khaki: "#f0e68c",
                lavender: "#e6e6fa",
                lavenderblush: "#fff0f5",
                lawngreen: "#7cfc00",
                lemonchiffon: "#fffacd",
                lightblue: "#add8e6",
                lightcoral: "#f08080",
                lightcyan: "#e0ffff",
                lightgoldenrodyellow: "#fafad2",
                lightgrey: "#d3d3d3",
                lightgreen: "#90ee90",
                lightpink: "#ffb6c1",
                lightsalmon: "#ffa07a",
                lightseagreen: "#20b2aa",
                lightskyblue: "#87cefa",
                lightslategray: "#778899",
                lightsteelblue: "#b0c4de",
                lightyellow: "#ffffe0",
                lime: "#00ff00",
                limegreen: "#32cd32",
                linen: "#faf0e6",
                magenta: "#ff00ff",
                maroon: "#800000",
                mediumaquamarine: "#66cdaa",
                mediumblue: "#0000cd",
                mediumorchid: "#ba55d3",
                mediumpurple: "#9370d8",
                mediumseagreen: "#3cb371",
                mediumslateblue: "#7b68ee",
                mediumspringgreen: "#00fa9a",
                mediumturquoise: "#48d1cc",
                mediumvioletred: "#c71585",
                midnightblue: "#191970",
                mintcream: "#f5fffa",
                mistyrose: "#ffe4e1",
                moccasin: "#ffe4b5",
                navajowhite: "#ffdead",
                navy: "#000080",
                oldlace: "#fdf5e6",
                olive: "#808000",
                olivedrab: "#6b8e23",
                orange: "#ffa500",
                orangered: "#ff4500",
                orchid: "#da70d6",
                palegoldenrod: "#eee8aa",
                palegreen: "#98fb98",
                paleturquoise: "#afeeee",
                palevioletred: "#d87093",
                papayawhip: "#ffefd5",
                peachpuff: "#ffdab9",
                peru: "#cd853f",
                pink: "#ffc0cb",
                plum: "#dda0dd",
                powderblue: "#b0e0e6",
                purple: "#800080",
                red: "#ff0000",
                rosybrown: "#bc8f8f",
                royalblue: "#4169e1",
                saddlebrown: "#8b4513",
                salmon: "#fa8072",
                sandybrown: "#f4a460",
                seagreen: "#2e8b57",
                seashell: "#fff5ee",
                sienna: "#a0522d",
                silver: "#c0c0c0",
                skyblue: "#87ceeb",
                slateblue: "#6a5acd",
                slategray: "#708090",
                snow: "#fffafa",
                springgreen: "#00ff7f",
                steelblue: "#4682b4",
                tan: "#d2b48c",
                teal: "#008080",
                thistle: "#d8bfd8",
                tomato: "#ff6347",
                turquoise: "#40e0d0",
                violet: "#ee82ee",
                wheat: "#f5deb3",
                white: "#ffffff",
                whitesmoke: "#f5f5f5",
                yellow: "#ffff00",
                yellowgreen: "#9acd32"
            };
            if (typeof colors[color.toLowerCase()] != "undefined") {
                return colors[color.toLowerCase()].substring(1);
            } else {
                return false;
            }
        },
        _hex: function(x) {
            x = x.toString(16);
            return x.length == 1 ? "0" + x : x;
        },
        _validateColor: function(color) {
            if (color.indexOf("#") == -1) {
                return this._colorNameToHex(color);
            } else {
                return color.substring(1);
            }
        },
        _colorMix: function(color1, color2, ratio) {
            color1 = this._validateColor(color1);
            color2 = this._validateColor(color2);
            var r = Math.floor(parseInt(color1.substring(0, 2), 16) * ratio + parseInt(color2.substring(0, 2), 16) * (1 - ratio));
            var g = Math.floor(parseInt(color1.substring(2, 4), 16) * ratio + parseInt(color2.substring(2, 4), 16) * (1 - ratio));
            var b = Math.floor(parseInt(color1.substring(4, 6), 16) * ratio + parseInt(color2.substring(4, 6), 16) * (1 - ratio));
            return "#" + this._hex(r) + this._hex(g) + this._hex(b);
        }
    });
    L.RegularGridCluster.include({
        _math_max: function(arr) {
            if (arr.length) {
                return Math.max.apply(null, arr.map(function(o) {
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
        _math_min: function(arr) {
            if (arr.length) {
                return Math.min.apply(null, arr.map(function(o) {
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
        _math_mode: function(arr) {
            if (arr.length === 0) {
                return null;
            }
            var modeMap = {};
            var maxEl = arr[0], maxCount = 1;
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
                }
            }
            return maxEl;
        },
        _math_mean: function(arr) {
            var state = arr.reduce(function(state, a) {
                if (a) {
                    state.sum += a;
                    state.count += 1;
                }
                return state;
            }, {
                sum: 0,
                count: 0
            });
            return state.sum / state.count;
        },
        _math_sum: function(arr) {
            if (arr.length === 0) {
                return 0;
            }
            return arr.reduce(function(a, b) {
                if (b) {
                    return a + b;
                } else {
                    return 0;
                }
            }, 0);
        },
        _math_median: function(arr) {
            arr.sort(function(a, b) {
                return a - b;
            });
            var half = Math.floor(arr.length / 2);
            if (arr.length % 2) {
                return arr[half];
            } else {
                return (arr[half - 1] + arr[half]) / 2;
            }
        }
    });
    L.RegularGridCluster.include({
        _scaleOperations: {
            size: function(value, min, max, noInts, thresholds, style) {
                var diff = max - min;
                interval = noInts - 1;
                if (value < max) {
                    interval = Math.floor((value - min) / diff * noInts);
                }
                return style[interval];
            },
            quantile: function(value, min, max, noInts, thresholds, style) {
                interval = 0;
                for (var ti in thresholds) {
                    if (value > thresholds[ti]) {
                        interval = parseInt(ti) + 1;
                    }
                }
                return style[interval];
            },
            continuous: function(value, min, max, noInts, thresholds, style) {
                interval = 0;
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
            count: function(cell, values) {
                return cell.elms.length;
            },
            mean: function(cell, values) {
                return this._math_mean(values);
            },
            median: function(cell, values) {
                return this._math_median(values);
            },
            mode: function(cell, values) {
                return this._math_mode(values);
            },
            max: function(cell, values) {
                return this._math_max(values);
            },
            min: function(cell, values) {
                return this._math_min(values);
            },
            sum: function(cell, values) {
                return this._math_sum(values);
            }
        },
        _cellsInsideOperations: {
            square: function(cell, elements) {
                return this._elmsInsideSquare(cell, elements);
            }
        }
    });
    global[""] = exports;
})({}, function() {
    return this;
}());