/*jshint browser: true, jquery: true, curly: true, maxlen: 80,
  eqeqeq: true, immed: true, indent: 4, latedef: true,
  newcap: true, noarg: true, noempty: true,
  nonew: true, undef: true, unused: true, trailing: true */
/*global $, L, console */
/*exported map, layer */
var map;
var layer;
var bounds;

var fabricCanvas;

var drawControl;


L.Projection.NoWrap = {
        project: function (latlng) {
            return new L.Point(latlng.lng, latlng.lat);
        },
        unproject: function (point, unbounded) {
            return new L.LatLng(point.y, point.x, unbounded);
        }
};


var Viewer = {};

Viewer.initialize = function (id, options) {
    var defaults = {
        width: null,
        height: null,
        tileSize: 256,
        minZoom: 0,
        maxZoom: 0,
        zoomOffset: 0,
        zoomReverse: false
    };
    var opts = $.extend({}, defaults, options);

    var zoomrange = opts.maxZoom - opts.minZoom;
    var ratio = opts.width / opts.height;
    // calculate correction in x and y direction, since image does not
    // exactly fit in 256x256 tile
    var xfactor = opts.width / Math.pow(2, zoomrange) / opts.tileSize;
    xfactor = xfactor / Math.ceil(xfactor);

    L.CRS.Direct = L.Util.extend({}, L.CRS, {
        code: 'Direct',
        projection: L.Projection.NoWrap,
        transformation: new L.Transformation(xfactor, 0, xfactor / ratio, 0)
    });
    
    // bounding box
    var ne = new L.LatLng(0, 1);
    var sw = new L.LatLng(1, 0);
    bounds = new L.LatLngBounds(ne, sw);
    
    map = L.map(id, {
        minZoom: opts.minZoom,
        maxZoom: opts.maxZoom, 
        tileSize: opts.tileSize,
        center: bounds.getCenter(),
        zoom: opts.minZoom,
        zoomControl: false,
        fullscreenControl: true,
        fullscreenControlOptions: {
            position: 'topleft'
        },
        crs: L.CRS.Direct
    });
    map.addControl(new L.Control.ZoomMin())

    layer = L.tileLayer(opts.url, {
        attribution: opts.attribution,
        maxZoom: opts.maxZoom,
        minZoom: opts.minZoom,
        zoomOffset: opts.zoomOffset,
        zoomReverse: opts.zoomReverse,
        continuousWorld: false,
        noWrap: true,
        tileSize: opts.tileSize,
        bounds: bounds
    });
    map.addLayer(layer);
    layer.on('tileload', function(e) {
        // console.log(e.tile);
        // should refer to _getTileSize to see if we need to scale
        // also not old IE compatible
        $(e.tile).css('width', e.tile.naturalWidth + 'px');
        $(e.tile).css('height', e.tile.naturalHeight + 'px');

    });

    var minilayer = L.tileLayer(opts.url, {
        maxZoom: opts.maxZoom,
        minZoom: opts.minZoom,
        zoomOffset: opts.zoomOffset,
        zoomReverse: opts.zoomReverse,
        continuousWorld: false,
        noWrap: true,
        tileSize: opts.tileSize,
        bounds: bounds
    });
    var miniMap = new L.Control.MiniMap(minilayer).addTo(map);
    return map;
};
