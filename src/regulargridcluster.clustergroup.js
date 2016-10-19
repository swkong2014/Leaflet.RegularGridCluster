L.RegularGridClusterClusterGroup = L.FeatureGroup.extend({
  options: {

  },
  initialize: function (options) {
    this.controller = options.controller;
    this.options = L.extend(this.options, options);
    L.Util.setOptions(this, options);

    L.FeatureGroup.prototype.initialize.call(this, {
      features: []
    }, options);
  },

  addLayer: function (layer) {
    L.FeatureGroup.prototype.addLayer.call(this, layer);

  },

  truncate: function () {
    this.clearLayers();
  }
});

L.regularGridClusterClusterGroup = function(options) {
  return new L.RegularGridClusterClusterGroup(options);
};
