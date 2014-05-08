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

$(document).ready(function() {

    L.Projection.NoWrap = {
            project: function (latlng) {
                var point = new L.Point(latlng.lng, latlng.lat);
                  return point;
            },

            unproject: function (point, unbounded) {
                    var latlng = new L.LatLng(point.y, point.x, unbounded);
                    return latlng;
            }
    };

    var ratio = width / height;
    var zoomrange = 10;
    // calculate correction in x and y direction, since image does not
    // exactly fit in 256x256 tile
    var xfactor = width / Math.pow(2, zoomrange) / 256;
    xfactor = xfactor / Math.ceil(xfactor)

    L.CRS.Direct = L.Util.extend({}, L.CRS, {
            code: 'Direct',
            projection: L.Projection.NoWrap,
            transformation: new L.Transformation(xfactor, 0, xfactor/ratio, 0)
    });
    
    // bounding box
    var ne = new L.LatLng(0, 1);
    var sw = new L.LatLng(1, 0);
    bounds = new L.LatLngBounds(ne, sw);
    
    map = L.map('map', {
        maxZoom: 12, 
        minZoom: 2,
        tileSize: 256,
        center: bounds.getCenter(),
        zoom: 2,
        crs: L.CRS.Direct
    });

    layer = L.tileLayer(
        'http://v.jcb-dataviewer.glencoesoftware.com/webclient/' +
        'render_image_region/201/0/0/?c=1|0:255$FF0000&m=g&p=normal&ia=0&' +
        'q=0.9&zm=100&x=0&y=0&tile={z},{x},{y},256,256',
        {
            attribution: 'fish',
            maxZoom: 12,
            minZoom: 2,
            zoomOffset: 0,
            zoomReverse: true,
            continuousWorld: false,
            noWrap: true,
            tileSize: 256,
            bounds: bounds
        }
    );
    map.addLayer(layer);
    layer.on('tileload', function(e) {
        console.log(e.tile);
        // should refer to _getTileSize to see if we need to scale
        $(e.tile).css('width',e.tile.naturalWidth + 'px');
        $(e.tile).css('height',e.tile.naturalHeight + 'px');

    });

    L.marker(map.unproject([0, 0], map.getMaxZoom())).addTo(map);
    L.marker(map.unproject([256 * 1024, 256 * 1024],
        map.getMaxZoom())).addTo(map);
    L.marker(map.unproject([512 * 1024, 256 * 1024], 
        map.getMaxZoom())).addTo(map);
    L.marker(new L.LatLng(1, 1)).addTo(map);
    
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
});
