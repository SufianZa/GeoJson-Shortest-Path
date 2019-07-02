class Index {

    init() {
        this.initBtns();
    }

    initBtns() {
        let lat = parseFloat($('#latitudeInput').val());
        let lat2 = parseFloat($('#latitudeInput2').val());
        let long = parseFloat($('#longitudeInput').val());
        let long2 = parseFloat($('#longitudeInput2').val());
        $('#submitForm').click(() => {
            $.ajax({
                url: window.location + 'test',
                dataType: 'json',
                data: {
                    lat, long, lat2, long2
                },
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

        $('#findRoute').click(this.findRoute.bind(this));
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

    showPoint(point, color = 'green', width = 4) {
        this.svg.append('circle')
            .attr('cx', this.projection(point)[0])
            .attr('cy', this.projection(point)[1])
            .attr('r', width + 'px')
            .attr('fill', color);
    }

    findRoute() {
        let lat = parseFloat($('#latitudeInput').val());
        let lat2 = parseFloat($('#latitudeInput2').val());
        let long = parseFloat($('#longitudeInput').val());
        let long2 = parseFloat($('#longitudeInput2').val());
        let start_point = [long, lat];
        let end_point = [long2, lat2];
        let routes_coordinates = [];
        for (let i = 0; i < this.data.features.length; i++) {
            routes_coordinates = routes_coordinates.concat(this.data.features[i].geometry.coordinates);
        }

        let best_route = [];
        best_route.push(start_point);
        while (true) {
            let distToStart = -1;
            let distToEnd = -1;

            let best_point;
            // find next coordinates
            for (let i = 0; i < routes_coordinates.length; i++) {
                let curToStart = this.calculate_distance(routes_coordinates[i], best_route.slice(-1)[0]);
                let curToEnd = this.calculate_distance(routes_coordinates[i], end_point);

                if ((curToStart < distToStart || distToStart === -1)) {
                    distToStart = curToStart;
                    if ((curToEnd <= distToEnd || distToEnd === -1)) {
                        distToEnd = curToEnd;
                        best_point = routes_coordinates[i];
                    }
                }
            }
            //this.showPoint(best_point);
            routes_coordinates = routes_coordinates.filter(point => point[0] !== best_point[0] && point[1] !== best_point[1]);
            best_route.push(best_point);
            if (distToEnd < 50) {
                break;
            }
        }

        let rout_obj = {
            'geometry': {
                'type': 'LineString',
                'coordinates': best_route,
                'id': 'best_route'
            }, properties: {id: 'best_route'}, type: 'Feature'
        };
        this.showStreet(rout_obj, 'green', 0.3, false);

    }

    calculate_distance(point1, point2) {
        let toRad = function (Value) {
            return Value * Math.PI / 180;
        };
        let R = 6371e3; // metres
        let alpha1 = toRad(point1[1]);
        let alpha2 = toRad(point2[1]);
        let delta_alpha = toRad(point2[1] - point1[1]);
        let delta_lambda = toRad(point2[0] - point1[0]);

        let a = Math.sin(delta_alpha / 2) * Math.sin(delta_alpha / 2) +
            Math.cos(alpha1) * Math.cos(alpha2) *
            Math.sin(delta_lambda / 2) * Math.sin(delta_lambda / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

window.index = new Index();