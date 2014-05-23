// OMERO Extensions for leaflet.js

// Save vector layers as ROI JSON

L.Path.include({
    saveFormattingAsROI: function () {
        console.log(this.options);
        return {
            textValue: "",
            fontStyle: "Normal",
            fontFamily: "sans-serif",
            fontSize: 12,
            strokeWidth: this.options.weight,
            strokeColor: this.options.color,
            strokeAlpha: this.options.opacity,
            fillColor: this.options.fillColor || this.options.color,
            fillAlpha: this.options.fillOpacity,
            transform: "none",
            theZ: null,
            theT: null,
            id: null
        };
    }
});

L.Rectangle.include({
    saveAsROI: function () {
        var latlngs = this.getLatLngs();
        var maxZoom = this._map.getMaxZoom();
        var p1 = this._map.project(latlngs[0], maxZoom);
        var p2 = this._map.project(latlngs[2], maxZoom);
        return L.extend({
            type: 'Rectangle',
            x: p1.x,
            y: p1.y,
            width: p2.x - p1.x,
            height: p2.y - p1.y
        }, this.saveFormattingAsROI());
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

L.Control.ROIDraw = L.Control.Draw.extend({

    initialize: function (options) {
        L.Control.Draw.prototype.initialize.call(this, options);

        var toolbar = new L.ColorToolbar();
        this._toolbars[L.ColorToolbar.TYPE] = toolbar;
        this._toolbars[L.ColorToolbar.TYPE].on('enable', this._toolbarEnabled, this);

        var _this = this;
        toolbar.on('color:line', function (e) {
            _this._setDrawingOption('linecolor', 'color', e.color);
        });
        toolbar.on('color:fill', function (e) {
            _this._setDrawingOption('fillcolor', 'fillColor', e.color);
        });
    },

    onAdd: function (map) {
        var container = L.Control.Draw.prototype.onAdd.call(this, map);
        this._setDrawingOption('linecolor', 'color', 'blue');
        this._setDrawingOption('fillcolor', 'fillcolor', 'blue');
        return container;
    },

    _setDrawingOption: function (button, option, value) {
        for (var toolbarId in this._toolbars) {
            if (this._toolbars[toolbarId] instanceof L.DrawToolbar) {
                var dt = this._toolbars[toolbarId];
                for (var type in dt._modes) {
                    if (dt._modes.hasOwnProperty(type)) {
                        var options = dt._modes[type].handler.options;
                        options.shapeOptions = options.shapeOptions || {};
                        options.shapeOptions[option] = value;
                    }
                }
            }
        }
        // TODO: introduction jQuery dependency
        $("a.leaflet-draw-color-" + button).css("background-color", value);
    },

    _createShape: function (map, j) {
        var unproject = function (x, y) {
            return map.unproject([x, y], map.getMaxZoom());
        };
        var shape = null;
        if (j.type === "Rectangle") {
            shape = L.rectangle([unproject(j.x, j.y),
                unproject(j.x + j.width, j.y + j.height)]);
        }
        if (j.type === "Point") {
            shape = L.marker(unproject(j.cx, j.cy));
        }
        if (j.type === "Ellipse") {
            // TODO: only restores circle right now
            var r = unproject(j.rx, j.ry);
            console.log("Warning: restoring ellipse as circle");
            // radius needs to be in meters, so another dirty hack
            r = r.lng * 111319.9;
            shape = L.circle(unproject(j.cx, j.cy), r);
        }
        if (j.type === "Polygon") {
            var x = /[LM] ([\d.]+) ([\d.]+)/g;
            var points = [];
            while ((result = x.exec(j.points)) !== null) {
                points.push(unproject(parseFloat(result[1], 10),
                            parseFloat(result[2], 10)));
            }
            shape = L.polygon(points);
        }
        if (j.type === "Polyline") {
            // TODO
        }
        if (shape) {
            // TODO: load shape formatting here
        }
        return shape;
    },

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
        if (this.on_draw_created) {
            map.off('draw:created', this.on_draw_created);
        }
        if (this.options.edit && this.options.edit.featureGroup) {
            map.removeLayer(this.options.edit.featureGroup);
        }

        var shapes = JSON.parse(json);
        var rois = $.map(shapes, function (j) {
            return this._createShape(map, j);
        });
        this.initialize({
            edit: {
                featureGroup: L.featureGroup(rois)
            }
        });
        this.options.edit.featureGroup.addTo(map);
        map.addControl(this);
        var _this = this;
        this.on_draw_created = function (event) {
            event.layer.bindLabel('Sample Text', { noHide: true });
            _this.options.edit.featureGroup.addLayer(event.layer);
        };
        map.on('draw:created', this.on_draw_created);
    },

    initROI: function () {
        // shortcut function
        this.loadFromROI('[]');
    }
});


L.LineColor = L.Draw.Feature.extend({
    statics: {
        TYPE: 'linecolor'
    },

    initialize: function (map, options) {
        this.type = L.LineColor.TYPE;
        L.Draw.Feature.prototype.initialize.call(this, map, options);
    },

    eventName: 'color:line'
});


L.FillColor = L.Draw.Feature.extend({
    statics: {
        TYPE: 'fillcolor'
    },

    initialize: function (map, options) {
        this.type = L.FillColor.TYPE;
        L.Draw.Feature.prototype.initialize.call(this, map, options);
    },

    eventName: 'color:fill'
});


L.ColorToolbar = L.Toolbar.extend({

    statics: {
        TYPE: 'color'
    },

    initialize: function (options) {
        this._toolbarClass = 'leaflet-draw-color';
        L.Toolbar.prototype.initialize.call(this, options);
    },

    getModeHandlers: function (map) {
        return [
            {
                enabled: true,
                handler: new L.LineColor(map, this.options.line),
                title: 'Line color'
            },
            {
                enabled: true,
                handler: new L.FillColor(map, this.options.fill),
                title: 'Fill color'
            },
        ];
    },

    getActions: function (handler) {
        var colorSetter = function (color) {
            return function () {
                this.fire(handler.eventName, { color: color });
                this._activeMode.handler.disable();
            };
        };
        return [
            {
                title: 'Red',
                text: 'Red',
                callback: colorSetter('red'),
                context: this
            },
            {
                title: 'Green',
                text: 'Green',
                callback: colorSetter('green'),
                context: this
            },
            {
                title: 'Blue',
                text: 'Blue',
                callback: colorSetter('blue'),
                context: this
            }
        ];
    },

});


L.ROIMap = L.Map.extend({

    initialize: function(id, options) {
        var opts = L.extend({}, {
            maxZ: 1,
            maxT: 1,
            Z: 0,
            T: 0
        }, options);
        L.Map.prototype.initialize.call(this, id, opts);

        this.roilayer = L.tileLayer(this._getROIUrl(), {
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
        this.addLayer(this.roilayer);
        this.roilayer.on('tileload', function(e) {
            // console.log(e.tile);
            // should refer to _getTileSize to see if we need to scale
            // also not old IE compatible
            $(e.tile).css('width', e.tile.naturalWidth + 'px');
            $(e.tile).css('height', e.tile.naturalHeight + 'px');
        });

        var zslider, tslider;
        if (opts.maxZ > 1) {
            zslider = L.control.sliderControl({
                minValue: 0,
                maxValue: opts.maxZ - 1
            });
            this.addControl(zslider);
            zslider.setPosition('topright');
        }
        if (opts.maxT > 1) {
            tslider = L.control.sliderControl({
                minValue: 0,
                maxValue: opts.maxT - 1
            });
            this.addControl(tslider);
            tslider.setPosition('topright');
        }
        this.on('slider:change', function (e) {
            if (zslider && zslider.sliderid === e.slider.sliderid) {
                this.setZ(e.value);
            }
            if (tslider && tslider.sliderid === e.slider.sliderid) {
                this.setT(e.value);
            }
        });
    },

    _getROIUrl: function () {
        return this.options.url.replace('{thez}', this.options.Z).replace('{thet}', this.options.T);
    },

    setT: function (index) {
        this.options.T = index;
        this.roilayer.setUrl(this._getROIUrl());
    },

    setZ: function (index) {
        this.options.Z = index;
        this.roilayer.setUrl(this._getROIUrl());
    },
});
