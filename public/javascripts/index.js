class Index {

    init() {
        this.initBtns();
        this.div = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute');
    }

    initBtns() {
        $('#submitForm').click(() => {
            $.ajax({
                url: window.location + 'maps/get_map',
                dataType: 'json',
                success: function (data) {
                    this.data = data;
                    this.showMap(data);
                }.bind(this),
                error: function (res) {
                    alert('error');
                    console.log(res);
                }
            });
        });

        $('#findRoute').click(() => {
            let lat = parseFloat($('#latitudeInput').val());
            let lat2 = parseFloat($('#latitudeInput2').val());
            let long = parseFloat($('#longitudeInput').val());
            let long2 = parseFloat($('#longitudeInput2').val());
            let b = lat + ',' + long;
            let a = lat2 + ',' + long2;
            $.ajax({
                url: window.location + 'maps/find_route',
                dataType: 'json',
                data: {
                    a, b
                },
                success:  function (data) {
                    this.showMap(this.data);
                    this.showPoint(data.result[0]);
                    this.showPoint(data.result[data.result.length - 1]);
                     this.animate_path(data.result);
                }.bind(this),
                error: function (res) {
                    alert('error');
                    console.log(res);
                }
            });
        });
        $('#clearRoute').click(function () {
            $('#latitudeInput').val('');
            $('#latitudeInput2').val('');
            $('#longitudeInput').val('');
            $('#longitudeInput2').val('');
        });
    };

    showMap(data) {
        $('#map').empty();
        let width = 1200,
            height = 700,
            margin = 15;

        this.svg = d3.select('#map').append('svg')
            .attr('width', width)
            .attr('height', height);

        data.features = data.features.filter(street => street.geometry.type === 'LineString');

        // set projection
        this.projection = d3.geoMercator().fitExtent([[margin, margin], [width - margin, height - margin]], data);

        this.pathGenerator = d3.geoPath(this.projection);

        this.showStreet(data, 'black', 0.5, false);

        let string_search = $('#search_name').val();

        if (string_search) {
            this.street_search = data.features.filter(street => street.properties.name === string_search);
            for (let i = 0; i < this.street_search.length; i++) {
                this.showStreet(this.street_search[i], 'red', 3, true, this.street_search[i].properties.name);
            }
        }

        if ($('#firstPoint').is(':checked')) this.showPoint([parseFloat($('#longitudeInput').val()), parseFloat($('#latitudeInput').val())], 'red', 5);
        if ($('#secondPoint').is(':checked')) this.showPoint([parseFloat($('#longitudeInput2').val()), parseFloat($('#latitudeInput2').val())], 'blue', 5);

    };

    showStreet(street, color, width, clickable, name) {
        let path = this.svg.append('path')
            .datum(street)
            .attr('d', this.pathGenerator)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', width);
        if (street.features) {
            for (let j = 0; j < street.features.length; j++) {
                let feature = street.features[j];
                for (let i = 0; i < feature.geometry.coordinates.length; i++) {
                    let p = feature.geometry.coordinates[i];
                    this.showPoint(p, 'black', 2, true);
                }
            }
        }

        if (clickable) {
            path.on('click', function (e) {
                let item = $(e.currentTarget);
                item.attr('stroke-width', 6);
                this.data.features = this.data.features.filter(street => street.properties.name === name);
                console.log(this.data.features);
                this.showMap(this.data);
                d3.event.stopPropagation();
            }.bind(this));
        }

    }

    showPoint(point, color = 'green', width = 4, clickable) {
        this.clicked = false;
        this.svg.append('circle')
            .attr('cx', this.projection(point)[0])
            .attr('cy', this.projection(point)[1])
            .attr('r', width + 'px')
            .attr('fill', color)
            .on('mouseover', (d, i) => {
                d3.select(d3.event.target).attr('r', 6).attr('fill', 'orange');
            })
            .on('click', (d, i) => {
                if ($('#latitudeInput').val() === '') {
                    $('#latitudeInput').val(point[0]);
                    $('#longitudeInput').val(point[1]);
                    this.clicked = false;
                }
                if (this.clicked && $('#latitudeInput2').val() === '') {
                    $('#latitudeInput2').val(point[0]);
                    $('#longitudeInput2').val(point[1]);
                    this.clicked = false;
                }
                this.clicked = true;
            })
            .on('mouseout', (d, i) => {
                d3.select(d3.event.target).attr('r', width + 'px').attr('fill', color);
            });
    }

    animate_path(street) {
        let line = d3.line()
            .x(function (d, i) {return this.projection(d)[0];}.bind(this))
            .y(function (d) {return this.projection(d)[1];}.bind(this));

        let path = this.svg.append('path')
            .attr('d', line(street))
            .attr('stroke', '#3f88ff')
            .attr('stroke-width', '3')
            .attr('fill', 'none');
        let totalLength = path.node().getTotalLength();
        path.attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(1200).ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);

    }
}

window.index = new Index();