var pieChart = {
    colors: ["#f2686a", "#9beedb", "#1b4d57", "#33ccaa", "#f1715c", "#00ffff", "#1d365d"],

    initialized: false,

    filters: [],

    initialize: function(width, height, tags, data) {
        console.log('Initializing pie chart');
        this.width = width;
        this.height = height;
        this.radius = Math.min(width, height) / 2;
        this.pie = d3.layout.pie()
            .sort(null)
            .value(function(d) {
                return d.value;
            });

        this.arc = d3.svg.arc()
            .outerRadius(this.radius * 0.8)
            .innerRadius(this.radius * 0.4);

        this.outerArc = d3.svg.arc()
            .innerRadius(this.radius * 0.9)
            .outerRadius(this.radius * 0.9);

        this.svg = d3.select("#pie-chart")
            .append("svg")
            .append("g")

        this.svg.append("g")
            .attr("class", "slices");
        this.svg.append("g")
            .attr("class", "labels");
        this.svg.append("g")
            .attr("class", "lines");
        this.svg.attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");

        this.palette = d3.scale.ordinal()
            .domain(tags)
            .range(this.colors)

        this.initialized = true;
        if (!data)
            return;
        this.set(data);

    },

    key: function(d) {
        return d.data.label;
    },

    update: function(data) {
        data.forEach(function(item) {
            var label = item.label;
            if (this.data.hasOwnProperty(label)) {
                this.data[label] += item.value;
            } else {
                this.data[label] = item.value;
            }
        });
        this.set(this.data);
    },

    hideTag: function(tagName) {
        var index = this.filters.indexOf(tagName);
        if (index < 0) {
            this.filters.push(tagName);
        }
        this.set(null);
    },

    showTag: function(tagName) {
        var index = this.filters.indexOf(tagName);
        if (index > -1) {
            this.filters.splice(index, 1);
        }
        this.set(null);
    },

    filterCurrentData: function() {
        var filteredData = [];
        var that = this;
        this.data.forEach(function(item) {
            var index = that.filters.indexOf(item.label)
            if (index < 0) {
                // label is not in the filter list, keep it
                filteredData.push(item);
            }
        });

        return filteredData;
    },

    set: function(data) {
        that = this;
        console.log('changing data');

        if (!data) {
            // we're simply redrawing
            data = this.data;
        } else {
            // we have new data to set
            this.data = data;
        }

        data = this.filterCurrentData();

        /* ------- PIE SLICES -------*/
        var slice = this.svg.select(".slices").selectAll("path.slice")
            .data(this.pie(data), this.key);

        slice.enter()
            .insert("path")
            .style("fill", function(d) {
                return that.palette(d.data.label);
            })
            .attr("class", "slice");

        slice
            .transition().duration(1000)
            .attrTween("d", function(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    return that.arc(interpolate(t));
                };
            })

        slice.exit()
            .remove();

        /* ------- TEXT LABELS -------*/

        var text = this.svg.select(".labels").selectAll("text")
            .data(this.pie(data), this.key);

        text.enter()
            .append("text")
            .attr("dy", ".35em")
            .text(function(d) {
                return d.data.label;
            });

        function midAngle(d) {
            return d.startAngle + (d.endAngle - d.startAngle) / 2;
        }

        text.transition().duration(1000)
            .attrTween("transform", function(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    var d2 = interpolate(t);
                    var pos = that.outerArc.centroid(d2);
                    pos[0] = that.radius * (midAngle(d2) < Math.PI ? 1 : -1);
                    return "translate(" + pos + ")";
                };
            })
            .styleTween("text-anchor", function(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    var d2 = interpolate(t);
                    return midAngle(d2) < Math.PI ? "start" : "end";
                };
            });

        text.exit()
            .remove();

        /* ------- SLICE TO TEXT POLYLINES -------*/

        var polyline = this.svg.select(".lines").selectAll("polyline")
            .data(this.pie(data), this.key);

        polyline.enter()
            .append("polyline");

        polyline.transition().duration(1000)
            .attrTween("points", function(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    var d2 = interpolate(t);
                    var pos = that.outerArc.centroid(d2);
                    pos[0] = that.radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                    return [that.arc.centroid(d2), that.outerArc.centroid(d2), pos];
                };
            });

        polyline.exit()
            .remove();
    },

    randomData: function() {
        var labels = this.palette.domain();
        return labels.map(function(label) {
            return {
                label: label,
                value: Math.random()
            }
        });
    }
};
