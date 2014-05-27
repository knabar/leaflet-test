L.Control.SliderControl = L.Control.extend({
    options: {
        orientation: 'horizontal',
        label: '',
        position: 'topright',
        maxValue: -1,
        minValue: -1,
        range: false
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
        this.sliderid = L.stamp(this);
    },

    setPosition: function (position) {
        var map = this._map;

        if (map) {
            map.removeControl(this);
        }

        this.options.position = position;

        if (map) {
            map.addControl(this);
        }
        this.startSlider();
        return this;
    },

    onAdd: function (map) {
        this.options.map = map;
        var style;
        if (this.options.orientation === 'vertical') {
            style = 'height:200px';
        } else {
            style = 'width:200px';
        }

        // Create a control sliderContainer with a jquery ui slider
        var sliderContainer = L.DomUtil.create('div', 'slider', this._container);
        $(sliderContainer).append('<div id="leaflet-slider' + this.sliderid + '" style="' + style + '"><div style="text-align: center;" class="ui-slider-handle">' + this.options.label + '</div></div>');
        //Prevent map panning/zooming while using the slider
        $(sliderContainer).mousedown(function () {
            map.dragging.disable();
        });
        $(document).mouseup(function () {
            map.dragging.enable();
        });

        var options = this.options;
        this.options.markers = [];

        return sliderContainer;
    },

    onRemove: function (map) {
        $('#leaflet-slider' + this.sliderid).remove();
    },

    startSlider: function () {
        _options = this.options;
        var _this = this;
        console.log('starting slider', this.sliderid);
        $("#leaflet-slider" + this.sliderid).slider({
            range: _options.range,
            value: _options.minValue,
            min: _options.minValue,
            max: _options.maxValue,
            orientation: _options.orientation,
            step: 1,
            slide: function (e, ui) {
                var map = _options.map;
                map.fire('slider:change', { slider: _this, value: ui.value, values: ui.values });
            }
        });
    }
});

L.control.sliderControl = function (options) {
    return new L.Control.SliderControl(options);
};
