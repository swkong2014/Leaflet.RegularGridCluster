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

  initialize (options) {
    this.options = L.extend(this.options, options);
    this.lastelmid = 0;
    this.elementDisplayed = false;
    L.Util.setOptions(this, options);

    this._actions = []; 
    this._elements = {};
    this._displayedElsGroup = L.featureGroup([]);
    this._cells = [];

    this._grid = new L.regularGridClusterGrid({controller: this});
    this._markers = new L.regularGridClusterMarkersGroup({controller: this});
    this._texts = new L.regularGridClusterTextsGroup({controller: this});

    L.FeatureGroup.prototype.initialize.call(this, {
      features: []
    }, options);
  },

  onAdd (map) {
    this._map = map;
    //L.GeoJSON.prototype.onAdd.call(this, map);

    this._grid.addTo(this._map);
    this._markers.addTo(this._map);
    this._texts.addTo(this._map);
  
    this._addAction(this._map.on('zoomend', () => { this.refresh();}));
    this._index();
    this.refresh();
  },

  _addAction (action) {
    this._actions.push(action);
  },

  _unregisterActions () {
    this._actions.map (action => {
      action.off();
    });
  },

  addLayer (layer) {
    this.addLayers([layer]);
  },

  addLayers (layersArray) {
    layersArray.map ( layer => this._addPoint (layer));
  },

  unregister () {
    this.clearLayers();
    this._unregisterActions();

    this._map.removeLayer(this._grid);
    this._map.removeLayer(this._markers);
    this._map.removeLayer(this._texts);
    this._map.removeLayer(this._displayedElsGroup);    
  },

  _addPoint (element) {
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

  _index () {
    const times = [];
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

  _getElementsCollection (){
    return Object.keys(this._elements).map( key => {
      return {
        id: this._elements[key].id,
        g: this._elements[key].geometry,
        i: this._elements[key].index
      };
    });
  },

  _displayElements () {
    if (!this.elementDisplayed) {
      this._displayedElsGroup.clearLayers();
      this.elementDisplayed = true;

      this._getElementsCollection().map( element => {
        const newMarker = L.circleMarker(
          [element.g[0], element.g[1]],
          50,
          {fillColor: 'lightblue', stroke: false}
        );

        this._displayedElsGroup.addLayer(newMarker);
      });

      this._displayedElsGroup.addTo(this._map);
    }
  },

  _hideElements () {
    if (this.elementDisplayed) {
      this.elementDisplayed = false;
      this._displayedElsGroup.clearLayers();
    }
  },

  refresh () {
    const zoom = this._map.getZoom();

    if (zoom > this.options.showElementsZoom) {
      console.log('elements will be displayed');
      this._displayElements();
    } else {
      console.log('elements will be hidden');
      this._hideElements();
      this._truncateLayers();

      const times = [];

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

  _truncateLayers () {
    this._grid.truncate();
    this._markers.truncate();
    this._texts.truncate();
  },

  // Controlling grid
  _buildGrid () {
    if (this.options.rules.grid && this.options.showGrid) {
      this._visualise('grid');

      this._cells.forEach(function (cell) {
        if (this._cellIsNotEmpty(cell)){
          const regularCell = new L.regularGridClusterCell(cell.path, cell.options.grid);
          this._grid.addLayer(regularCell);
        }
      }.bind(this));

      this._grid.addTo(this._map);
    }

  },

  _buildMarkers () {
    if (this.options.rules.markers && this.options.showMarkers) {
      this._visualise('markers');

      this._cells.map( cell => {
        if (this._cellIsNotEmpty(cell)){
          const cellCentroid = [cell.y + cell.h/2, cell.x + cell.w/2];
          const marker = new L.regularGridClusterMarker(cellCentroid, cell.options.markers);
          this._markers.addLayer(marker);
        }
      });

      this._markers.addTo(this._map);
    }

  },

  _buildTexts () {
    if (this.options.rules.texts && this.options.showTexts) {
      this._visualise('texts');

      this._cells.map ( cell => {
        if (this._cellIsNotEmpty(cell)){
          const cellCentroid = [cell.y + cell.h/2, cell.x + cell.w/2];
          const text = new L.regularGridClusterText(cellCentroid, cell.options.texts);
          this._texts.addLayer(text);
        }
      });

      this._texts.addTo(this._map);
    }
  },

  _indexCells () {
    const origin = this._gridOrigin();
    const gridEnd = this._gridExtent().getNorthEast();
    const maxX = gridEnd.lng;
    const maxY = gridEnd.lat;

    const x = origin.lng;
    const y = origin.lat;

    const indexPortion = this.options.indexSize;
    const diffX = (maxX - x) / indexPortion;
    const diffY = (maxY - y) / indexPortion;
    this._indexedCells = {};

    let cellId = 0;

    for (var xi = x; xi < maxX; xi += diffX){
      for (var yi = y; yi < maxY; yi += diffY){
        const bounds = L.latLngBounds([yi, xi], [yi + diffY, xi + diffX]);
        this._indexedCells[cellId] = {
          b: bounds,
          cs: []
        };
        cellId = cellId + 1;
      }
    }
  },

  _indexElements () {
    const elements = this._getElementsCollection();

    elements.map( element => {
      for (const ici in this._indexedCells) {
        const indexedCell = this._indexedCells[ici];
        if (indexedCell.b.contains(element.g)) {
          this._elements[element.id].index = ici;
          break;
        }
      }
    });
  },

  _indexedCellsCollection () {
    return Object.keys(this._indexedCells).map( key => this._indexedCells[key]);
  },

  _truncateIndexedCells () {
    this._indexedCellsCollection().map( indexedCell => {
      indexedCell.cs = [];
    });
  },

  _prepareCells () {
    this._cells = [];
    this._truncateIndexedCells();
    let cellId = 1;

    const cellSize = this._cellSize();

    const origin = this._gridOrigin();
    const gridEnd = this._gridExtent().getNorthEast();
    const maxX = gridEnd.lng;
    const maxY = gridEnd.lat;

    let x = origin.lng;
    let y = origin.lat;
    const cellW = cellSize/111319;

    const indexedCellsCollection = this._indexedCellsCollection();
    let row = 1;

    const indexCellsInCollection = (cell, cellBounds) => {
      indexedCellsCollection.map (indexedCell => {
        if (indexedCell.b.overlaps(cellBounds)){
          indexedCell.cs.push(cell);
        }
      });
    };

    while (y < maxY) {
      const cellH = this._cellHeightAtY(y, cellSize);

      if (this.options.gridMode == 'hexagon') {
        if (row%2) {
          x -= cellW/2;
        }
      }

      while (x < maxX) {
        const cell = {
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
        const cellBounds = L.latLngBounds([y, x], [y + cellH, x + cellW]);

        cell.path = this._buildPathOperations[this.options.gridMode].call(this, cell);
        this._cells.push(cell);

        indexCellsInCollection(cell, cellBounds);
        cellId++;

        x += cellW;
      }

      x = origin.lng;
      //y += cellH;
      if (this.options.gridMode == 'hexagon') {
        y += 3/4 * cellH;
      } else {
        y += cellH;
      }
      row += 1;
    }

  },

  _findElements () {
    const elements = this._getElementsCollection();

    elements.map( element => {
      const ei = element.id;
      const ex = element.g[1];
      const ey = element.g[0];
      const cellsAtIndex = this._indexedCells[element.i].cs;

      cellsAtIndex.map ( cell => {
        if (this._elmInsideOperations[this.options.gridMode].call(this, ex, ey, cell)) {
          cell.elms.push(ei);
        }
      });
    });
  },

  _cellIsNotEmpty:function (cell) {
    return cell.elms.length !== 0;
  },

  _visualise (featureType) {
    let cj; 
    let cell;
    
    if (this.options.rules[featureType]) {

      Object.keys(this.options.rules[featureType]).map( option => {
        const rule = this.options.rules[featureType][option];

        if (option == 'text') {
          this._cellsValues(rule.method, rule.attribute);
          this._cells.map ( cell => {
            if (this._cellIsNotEmpty(cell)) {
              cell.options.texts.text = cell.value;
            }
          });

        } else if (this._isDynamicalRule(rule)) {
          this._cellsValues(rule.method, rule.attribute);
          this._applyOptions(featureType, rule.scale, rule.style, option);
        
        } else {
          this._cells.map ( cell => {
            if (this._cellIsNotEmpty(cell)) {
              cell.options[featureType][option] = rule;
            }
          });
        }

      });
    }
  },

  _applyOptions (featureType, scale, style, option) {
    const values = this._cellValues(true).sort(function(a,b){return a-b;});
    let noInts = style.length;

    if (scale === 'continuous') { noInts = noInts - 1;}
    const max = Math.max(...values);
    const min = Math.min(...values);

    const thresholds = [];

    if (scale != 'size') {
      const qLen = Math.floor(values.length / noInts);

      for (var i = 1; i != noInts; i++ ) {
        thresholds.push(values[qLen * i]);
      }
    }

    if (this._scaleOperations[scale]){
      this._cells.map ( cell => {
        if (this._isDefined(cell.value)) {
          cell.options[featureType][option] = this._scaleOperations[scale].call(
            this, 
            cell.value, 
            min, max, noInts, 
            thresholds, style
          );
        }
      });
    }
  },

  _cellsValues (method, attr) {
    this._cells.map ( cell => {
      if (this._cellIsNotEmpty(cell)){
        let cellValues;

        if (method !== 'count') {
          cellValues = this._cellAttrValues(cell, attr);
        }
        cell.value = this._methodOperations[method].call(this, cell, cellValues);
      }
    });
  },

  _cellValues (onlyDefined) {
    if (onlyDefined) {
      return this._cells.filter(cell => typeof cell.value !== 'undefined' && !isNaN(cell.value)).map ( cell => cell.value);
    } else {
      return this._cells.map ( cell => cell.value);
    }
  },

  _cellAttrValues (cell, attr) {
    return cell.elms.map ( elm => this._elements[elm].properties[attr]);
  },

  _isDynamicalRule (rule) {
    return rule.method && rule.scale && rule.style;
  },

  // return size of the cell in meters
  _cellSize () {
    return this.options.cellSize * Math.pow(2, 10 - this._mapZoom());
  },

  _gridOrigin () {
    return this._gridExtent().getSouthWest();
  },

  _gridExtent () {
    return this._getBounds().pad(this.options.gridBoundsPadding);
  },

  _getBounds () {
    return L.latLngBounds(this._getGeometries());
  },

  _getGeometries () {
    return this._getElementsCollection().map ( element => element.g);
  },

  _mapZoom () {
    if (this._map) {
      return this._map.getZoom();
    } else {
      return false;
    }
  },

  // BASE FUNCTIONS
  // longitude delta for given latitude
  _cellHeightAtY (y, cellSize) {
    return cellSize/111319;
    // return (cellSize/111319) * this._deltaHeightAtY(y);
  },

  // multiplier for y size at given latitude
  _deltaHeightAtY (lat) {
    return Math.abs(1/Math.cos(lat * Math.PI / 180));
  },

  _isDefined (value) {
    return !(!value && value !== 0);
  },

  _isNumber (value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }
});

L.regularGridCluster = function(options) {
  return new L.RegularGridCluster(options);
};
