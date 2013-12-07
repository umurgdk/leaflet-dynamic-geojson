# Leaflet Dynamic GeoJSON

A leaflet plugin to load geojson data incrementally. It check the bounds on every pan/zoom event and trigger an ajax call to proper url with map bounds' parameters. And then it creates markers for it.

### Usage
```javascript
var dynamicLayer = new L.DynamicGeoJSON({
  url: 'http://somehost/within?minlat={minlat}&maxlat={maxlat}&minlng={minlng}&maxlng={maxlng}',

  // [Optional]
  // they will append to end of url 
  params: { 
    key1: 'value1',
    another: 'param'
  },

  // [Optional]
  // Default: 'id'
  idField: 'unique_id',

  // [Optional] 
  // It can be a Leaflet icon or a function returns Leaflet Icon
  // Function will be called with data belongs to this marker
  // Default: L.Icon.Default()
  icon: Icons.business,

  // [Optional]
  // Default: 'lat'
  latField: 'latitude',

  // [Optional]
  // Default: 'lng'
  lngField: 'longitude'
});

leafletMap.add(dynamicLayer);
```

### TODO
* Support for non-amd
* Use Leaflet.AJAX plugin instead of jQuery
* Ability to add event handlers
* Ability to bind popups on markers
* Ability to add geometry
