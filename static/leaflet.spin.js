L.SpinMapMixin = {
    spin: function (state, options) {
        if (!!state) {
            // start spinning !
            if (!this._spinner) {
                this._spinner = new Spinner(options).spin(this._container);
                this._spinning = 0;
            }
            this._spinning++;
        }
        else {
            this._spinning--;
            if (this._spinning <= 0) {
                // end spinning !
                if (this._spinner) {
                    this._spinner.stop();
                    this._spinner = null;
                }
            }
        }
    }
};

L.Map.include(L.SpinMapMixin);

L.Map.addInitHook(function () {
    this._layersSpinning = {};
    this._spinEvents = {};
    this._spinLayer = function (layerid, spin) {
        if (spin !== !!this._layersSpinning[layerid]) {
            this._layersSpinning[layerid] = spin;
            this.spin(spin);
        }
    };
    this.on('layeradd', function (e) {
        // If added layer is currently loading, spin !
        var layerid = L.stamp(e.layer);
        var _this = this;
        if (e.layer.loading) this._spinLayer(layerid, true);
        this._spinEvents[layerid] = {
            load: function () { _this._spinLayer(layerid, false); },
            loading: function () { _this._spinLayer(layerid, true); }
        };
        e.layer.on('loading', this._spinEvents[layerid].loading, this);
        e.layer.on('load', this._spinEvents[layerid].load, this);
    }, this);
    this.on('layerremove', function (e) {
        // Clean-up
        var layerid = L.stamp(e.layer);
        this._spinLayer(layerid, false);
        e.layer.off('load', this._spinEvents[layerid].load);
        e.layer.off('loading', this._spinEvents[layerid].loading);
    }, this);
});
