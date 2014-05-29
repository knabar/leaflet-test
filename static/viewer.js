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
        zoomReverse: false,
        maxT: 1,
        maxZ: 1,
        T: 0,
        Z: 0
    };
    var opts = L.extend({}, defaults, options);
    console.log('Viewer', options, opts);
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
    
    map = new L.ROIMap(id, {
        minZoom: opts.minZoom,
        maxZoom: opts.maxZoom, 
        tileSize: opts.tileSize,
        center: bounds.getCenter(),
        zoom: opts.minZoom,
        zoomReverse: opts.zoomReverse,
        zoomOffset: opts.zoomOffset,
        zoomControl: false,
        fullscreenControl: true,
        fullscreenControlOptions: {
            position: 'topleft'
        },
        crs: L.CRS.Direct,
        T: opts.T,
        Z: opts.Z,
        maxT: opts.maxT,
        maxZ: opts.maxZ,
        url: opts.url
    });
    map.addControl(new L.Control.ZoomMin())

    if (opts.minZoom !== opts.maxZoom) {
        var minilayer = L.tileLayer('http://v.jcb-dataviewer.glencoesoftware.com/webclient/render_birds_eye_view/201/256/', {
            maxZoom: 0,
            minZoom: 0,
            zoomOffset: 0,
            zoomReverse: false,
            continuousWorld: false,
            noWrap: true,
            tileSize: 256,
            bounds: bounds,
            center: bounds.getCenter()
        });
        minilayer.on('tileload', function(e) {
            // console.log(e.tile);
            // should refer to _getTileSize to see if we need to scale
            // also not old IE compatible
            $(e.tile).css('width', e.tile.naturalWidth + 'px');
            $(e.tile).css('height', e.tile.naturalHeight + 'px');
        });
        L.CRS.DirectMiniMap = L.Util.extend({}, L.CRS, {
            code: 'Direct',
            projection: L.Projection.NoWrap,
            transformation: new L.Transformation(1, 0, 1 / ratio, 0)
        });
        var miniMap = new L.Control.MiniMap(minilayer, {
            zoomLevelFixed: opts.zoomReverse ? opts.minZoom : opts.maxZoom,
            toggleDisplay: true,
            width: 256,
            height: 256 * 376 / 900,
            aimingRectOptions: {
                weight: 5
            },
            dragging: false,
            crs: L.CRS.DirectMiniMap
        }).addTo(map);
    }
//    map.on('click', function(e) {
//        console.log('map', e.latlng);
//    });



    return map;
};
