L.Control.SliderControl = L.Control.extend({
    options: {
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

        // Create a control sliderContainer with a jquery ui slider
        var sliderContainer = L.DomUtil.create('div', 'slider', this._container);
        $(sliderContainer).append('<div id="leaflet-slider' + this.sliderid + '" style="width:200px"><div class="ui-slider-handle"></div><div id="slider-timestamp" style="width:200px; margin-top:10px;background-color:#FFFFFF"></div></div>');
        //Prevent map panning/zooming while using the slider
        $(sliderContainer).mousedown(function () {
            map.dragging.disable();
        });
        $(document).mouseup(function () {
            map.dragging.enable();
            //Only show the slider timestamp while using the slider
            $('#slider-timestamp').html('');
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
        _this = this;
        $("#leaflet-slider" + this.sliderid).slider({
            range: _options.range,
            value: _options.minValue,
            min: _options.minValue,
            max: _options.maxValue,
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
