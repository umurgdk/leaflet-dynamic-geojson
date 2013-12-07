define([
    "mapbox"
], function () {
    "use strict";

    function copyBounds(latLngBounds) {
        return L.latLngBounds(
            latLngBounds.getSouthWest(),
            latLngBounds.getNorthEast());
    }

    L.DynamicGeoJSON = L.FeatureGroup.extend({
        includes: L.Mixin.Events,

        options: {
            idField: 'id',
            latField: 'lat',
            lngField: 'lng'
        },

        initialize: function (options) {
            this._layers = {};

            // Data hash array, keys will be data's ids
            this._data = {};
            
            // New data to needs create markers
            this._newData = null;

            // Markers hash array, keys will be data's ids
            this._markers = {};

            // LatLngBounds holds the loaded area's bounds
            this._loadedBounds = null;

            if (!options.url) {
                throw new Error("L.DynamicGeoJSON needs url option!");
            }

            L.Util.setOptions(this, options);
        },

        onAdd: function (map) {
            L.FeatureGroup.prototype.onAdd.call(this, map); 

            // Bind pan/zoom event handlers
            map.on('moveend', this._update, this);
            map.on('zoomend', this._update, this);

            // Load first data
            this._update();
        },

        onRemove: function (map) {
            // Unbind pan/zoom event handlers
            map.off('moveend', this._update, this);
            map.off('zoomend', this._update, this);
        },

        // Decides to data to be loaded
        _update: function () {
            var that = this,
                boundsToLoad = null;

            // Set current visible bounds
            this._currentBounds = map.getBounds();

            // If the data has been already loaded return
            if (this._loadedBounds &&
                this._loadedBounds.contains(this._currentBounds)) {
                return;
            }

            // Calculates the bounds for loading new data
            if (this._loadedBounds) {
                boundsToLoad = copyBounds(this._loadedBounds)
                boundsToLoad.extend(that._currentBounds);
            } else {
                boundsToLoad = copyBounds(this._currentBounds);
            }

            // _loadData make an ajax calls
            this._loadData(boundsToLoad, function (err, newDataLength, newData) {
                if (!err) {
                    // Loaded data's bounds has bigger area
                    that._loadedBounds = copyBounds(boundsToLoad);
                    boundsToLoad = null;

                    // If there is new data create markers for them
                    if (newDataLength > 0 && newData) {
                        that._newData = newData;
                        that._updateMarkers();
                    }
                } else {
                    console.log("Data Load ERROR: ", err);
                }
            });
        },

        // Create a marker for given data
        _createMarkerFor: function (data) {
            var icon = null,
                lat = data[this.options.latField],
                lng = data[this.options.lngField];

            if (typeof this.options.icon === 'function') {
                icon = this.options.icon(data);
            } else if (this.options.icon) {
                icon = this.options.icon;
            } else {
                icon = new L.Icon.Default();
            }

            return L.marker([lat, lng], {
                icon: icon
            });
        },

        // Create and add new markers to layer
        _updateMarkers: function () {
            var marker = null;

            for (var id in this._newData) {
                if (this._newData.hasOwnProperty(id)) {
                    if (!this._markers[id]) {
                        marker = this._createMarkerFor(this._newData[id]);
                        this._markers[id] = marker;
                        L.FeatureGroup.prototype.addLayer.call(this, marker);
                    }
                }
            }

            this._newData = {};
        },

        // Makes an ajax call to load new data
        _loadData: function (bounds, cb) {
            var that = this,
                requestUrl = this.options.url;

            if (!bounds) {
                throw new Error("L.DynamicGeoJSON can't load data. Unkown bounds");
            }

            // Render the url with coordinates
            requestUrl = L.Util.template(requestUrl, {
                minlat: bounds.getSouth(),
                maxlat: bounds.getNorth(),
                minlng: bounds.getWest(),
                maxlng: bounds.getEast()
            });

            if (this.options.params) {
                requestUrl += L.Util.getParamString(this.options.params).replace('?', '&', 0);
            }

            $.getJSON(requestUrl, this.options.data, function (response) {
                that._updateData(response, cb);
            }).error(cb);
        },

        // Parse data comes from ajax request
        _updateData: function (response, cb) {
            var newData = {},
                newDataLength = 0,
                stamp = null,
                item = null,
                id = this.options.idField;

            if (!response) {
                return cb(null, 0);
            }

            for (var i = 0; i < response.length; i++) {
                item = response[i];

                if (!this._data[item[id]]) {
                    this._data[item[id]] = item;
                    newData[item[id]] = item;
                    newDataLength++;
                } else {   
                    this._data[item[id]] = item;
                }
            }

            cb(null, newDataLength, newData);
        }
    });

    L.dynamicGeoJSON = function (options) {
        return new L.DynamicGeoJSON(options);
    };
});
