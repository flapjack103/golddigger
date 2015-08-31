// data = [{
//     'tagName': 'coffee',
//     'purchases': [[day, amount]],
//     'total': purchases.length
// }]

var weekChart = {
    initialized: false,

    initialize: function(data) {
        var margin = {
                top: 20,
                right: 200,
                bottom: 0,
                left: 20
            },
            width = 300,
            height = 650;

        var dayStrings = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        var dayRange = [0, 6];

        var c = d3.scale.category20c();

        var x = d3.scale.linear()
            .range([0, width]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("top")
            .tickFormat(function(d, i) {
                return dayStrings[d];
            });

        // xAxis.tickFormat('mon');
        //xAxis.tickFormat(d3.format(", s"))
        var svg = d3.select("#week-chart")
            .append("svg")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x.domain(dayRange);
        var xScale = d3.scale.linear()
            .domain(dayRange)
            .range([0, width]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + 0 + ")")
            .call(xAxis);

        for (var j = 0; j < data.length; j++) {
            var g = svg.append("g").attr("class", "tag");

            var circles = g.selectAll("circle")
                .data(data[j]['purchases'])
                .enter()
                .append("circle");

            var text = g.selectAll("text")
                .data(data[j]['purchases'])
                .enter()
                .append("text");

            var rScale = d3.scale.linear()
                .domain([0, d3.max(data[j]['purchases'], function(d) {
                    return d[1];
                })])
                .range([2, 9]);

            circles
                .attr("cx", function(d, i) {
                    return xScale(d[0]);
                })
                .attr("cy", j * 20 + 20)
                .attr("r", function(d) {
                    return rScale(d[1]);
                })
                .style("fill", function(d) {
                    return c(j);
                });

            text
                .attr("y", j * 20 + 25)
                .attr("x", function(d, i) {
                    return xScale(d[0]) - 5;
                })
                .attr("class", "value")
                .text(function(d) {
                    return d[1];
                })
                .style("fill", function(d) {
                    return c(j);
                })
                .style("display", "none");

            g.append("text")
                .attr("y", j * 20 + 25)
                .attr("x", width + 20)
                .attr("class", "label")
                .text(this.truncate(data[j]['tagName'], 30, "..."))
                .style("fill", function(d) {
                    return c(j);
                })
                .on("mouseover", this.mouseover)
                .on("mouseout", this.mouseout);
        }
        this.initialized = true;
    },

    truncate: function(str, maxLength, suffix) {
        if (str.length > maxLength) {
            str = str.substring(0, maxLength + 1);
            str = str.substring(0, Math.min(str.length, str.lastIndexOf(" ")));
            str = str + suffix;
        }
        return str;
    },

    mouseover: function(p) {
        var g = d3.select(this).node().parentNode;
        d3.select(g).selectAll("circle").style("display", "none");
        d3.select(g).selectAll("text.value").style("display", "block");
    },

    mouseout: function(p) {
        var g = d3.select(this).node().parentNode;
        d3.select(g).selectAll("circle").style("display", "block");
        d3.select(g).selectAll("text.value").style("display", "none");
    }
};
