// OMERO Extensions for leaflet.js

// Save vector layers as ROI JSON

L.Rectangle.include({
    saveAsROI: function () {
        var latlngs = this.getLatLngs();
        var maxZoom = this._map.getMaxZoom();
        var p1 = this._map.project(latlngs[0], maxZoom);
        var p2 = this._map.project(latlngs[2], maxZoom);
        return {
            type: 'Rectangle',
            x: p1.x,
            y: p1.y,
            width: p2.x - p1.x,
            height: p2.y - p1.y
        };
    }
});

L.Polyline.include({
    saveAsROI: function () {
        // TODO
        return {
            type: 'Polyline'
        };
    }
});

L.Polygon.include({
    saveAsROI: function () {
        var latlngs = this.getLatLngs();
        var path = "";
        for (var i = 0; i < latlngs.length; i++) {
            path += i > 0 ? ' L ' : 'M ';
            var p = this._map.project(latlngs[i], this._map.getMaxZoom());
            path += p.x + ' ' + p.y;
        }
        return {
            type: 'Polygon',
            points: path + ' z'
        };
    }
});

L.Circle.include({
    saveAsROI: function () {
        var maxZoom = this._map.getMaxZoom();
        var p = this._map.project(this.getLatLng(), maxZoom);
        // Circle does not use the correct projection when calculating
        // radius, so only use LngRadius and use for both x and y directions
        var r = this._map.project(
            new L.LatLng(0, this._getLngRadius()), maxZoom);
        return {
            type: 'Ellipse',
            cx: p.x,
            cy: p.y,
            rx: r.x,
            ry: r.x
        };
    }
});

L.Marker.include({
    saveAsROI: function () {
        var p = this._map.project(this.getLatLng(), this._map.getMaxZoom());
        return {
            type: 'Point',
            cx: p.x,
            cy: p.y
        };
    }
});

// add save and load methods to Draw control

(function () {

    var on_draw_created = null;

    var createShape = function (map, j) {
        var unproject = function (x, y) {
            return map.unproject([x, y], map.getMaxZoom());
        };
        if (j.type === "Rectangle") {
            return L.rectangle([unproject(j.x, j.y),
                unproject(j.x + j.width, j.y + j.height)]);
        }
        if (j.type === "Point") {
            return L.marker(unproject(j.cx, j.cy));
        }
        if (j.type === "Ellipse") {
            // TODO: only restores circle right now
            var r = unproject(j.rx, j.ry);
            console.log("Warning: restoring ellipse as circle");
            // radius needs to be in meters, so another dirty hack
            r = r.lng * 111319.9;
            return L.circle(unproject(j.cx, j.cy), r);
        }
        if (j.type === "Polygon") {
            var x = /[LM] ([\d.]+) ([\d.]+)/g;
            var points = [];
            while ((result = x.exec(j.points)) !== null) {
                points.push(unproject(parseFloat(result[1], 10),
                            parseFloat(result[2], 10)));
            }
            return L.polygon(points);
        }
        if (j.type === "Polyline") {
            // TODO
        }
        return null;
    };

    L.Control.Draw.include({

        saveAsROI: function () {
            var output = [];
            this.options.edit.featureGroup.eachLayer(function (layer) {
                output.push(layer.saveAsROI());
            });
            return JSON.stringify(output);
        },

        loadFromROI: function (json) {
            // remove self from map if currently attached
            if (!this._map) {
                throw "Must be attached to a map before loading";
            }
            var map = this._map;
            map.removeControl(this);
            if (on_draw_created) {
                map.off('draw:created', on_draw_created);
            }
            if (this.options.edit && this.options.edit.featureGroup) {
                map.removeLayer(this.options.edit.featureGroup);
            }

            var shapes = JSON.parse(json);
            var rois = $.map(shapes, function (j) {
                return createShape(map, j);
            });
            this.initialize({
                edit: {
                    featureGroup: L.featureGroup(rois)
                }
            });
            this.options.edit.featureGroup.addTo(map);
            map.addControl(this);
            var _this = this;
            on_draw_created = function (event) {
                event.layer.bindLabel('Sample Text', { noHide: true });
                _this.options.edit.featureGroup.addLayer(event.layer);
            };
            map.on('draw:created', on_draw_created);
        },

        initROI: function () {
            // shortcut function
            this.loadFromROI('[]');
        }
    });
})();
