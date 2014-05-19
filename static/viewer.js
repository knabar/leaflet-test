/*jshint browser: true, jquery: true, curly: true, maxlen: 80,
  eqeqeq: true, immed: true, indent: 4, latedef: true,
  newcap: true, noarg: true, noempty: true,
  nonew: true, undef: true, unused: true, trailing: true */
/*global $, L, console */
/*exported map, layer */
var map;
var layer;
var bounds;
var width = 921600;
var height = 380928;

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
    return map;
};


$(document).ready(function() {

    map = Viewer.initialize('map', {
        width: 921600,
        height: 380928,
        minZoom: 2,
        maxZoom: 12,
        zoomReverse: true,
        url: 'http://v.jcb-dataviewer.glencoesoftware.com/webclient/' +
        'render_image_region/201/0/0/?c=1|0:255$FF0000&m=g&p=normal&ia=0&' +
        'q=0.9&zm=100&x=0&y=0&tile={z},{x},{y},256,256'
    });
    /* 
    // add popup to get coordinates
    var popup = L.popup();

    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent(
                "You clicked the map at " + 
                e.latlng.toString() + 
                " which equals " + 
                map.project(e.latlng, map.getMaxZoom()))
            .openOn(map);
    }

    map.on('click', onMapClick);
    */
    drawControl = new L.Control.Draw();
    map.addControl(drawControl);
    drawControl.initROI('[]');

    $("#list-shapes").on('click', function () {
        $("#shapes").text(drawControl.saveAsROI());
    });

    $("#load-shapes").on('click', function () {
        drawControl.loadFromROI($("#shapes").text());
        return;
    });
});
