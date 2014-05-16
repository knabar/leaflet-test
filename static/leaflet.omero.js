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

