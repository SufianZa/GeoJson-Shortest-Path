let path = require('path');
let express = require('express');
let router = express.Router();
let Graph = require('@dagrejs/graphlib').Graph;
let alg = require('@dagrejs/graphlib').alg;
const fs = require('fs');

let result = [];
let mapping={};
let trail = [];
let dist = 0;
let calculate_distance = function (point1, point2) {
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
};

function init(a,b) {
    result=[];
    let file_path = path.resolve('public\\geoData\\Gievenbeck.geojson');

    //read json file
    let data = fs.readFileSync(file_path);

    //parse to json
    data = JSON.parse(data);

    // get streets only
    data.features = data.features.filter(street => street.geometry.type === 'LineString');

    // create undirected Graph
    let undirected = new Graph({directed: true});

    let inc = 0;
    for (let i = 0; i < data.features.length; i++) {
        let points = data.features[i].geometry.coordinates;
        let lastNode = null;
        for (let j = 0; j < points.length; j++) {
            let node = points[j];
            if (mapping['x'+node + ''] === undefined) {
                mapping['x'+node + ''] = 'x'+inc;
                inc++;
            }

            undirected.setNode(mapping['x'+node + ''], {'coordinates': node});
            if (lastNode && lastNode != node) {
                undirected.setEdge(mapping['x'+node + ''], mapping['x'+lastNode + ''], calculate_distance(lastNode, node));
                undirected.setEdge(mapping['x'+lastNode + ''], mapping['x'+node + ''],calculate_distance(lastNode, node));
            }
            lastNode = node;
        }
    }

    let x = alg.dijkstra(undirected, mapping['x'+a+''], e => {
        return undirected.edge(e);
    });
    trail = [];
    dist = 0;
    let t = traversalTrail(x, mapping['x'+b+'']);
    let obj = Object.keys(mapping);
    for (let i = 0; i < t.length; i++) {
        let index = parseInt(t[i].replace('x',''));
        if(obj[index]){
            let [long,lat] = obj[index].split(',');
            result.push([parseFloat(long.replace('x','')),parseFloat(lat)]);
        }
    }
}


function traversalTrail(graph,point){
    trail.push(point);
    dist += graph[point+''].distance;
    if(graph[point+''].distance===0||graph[point+''].predecessor===undefined){
        return trail;
    }
    return traversalTrail(graph,graph[point+''].predecessor);
}

router.get('/get_map', function (req, res, next) {
    let path_file = path.resolve('public\\geoData\\Gievenbeck.geojson');
    res.sendFile(path_file, function (err) {
        if (err) {
            next(err);
        } else {
            console.log('Sent:', path_file);
        }
    });

});

router.get('/find_route', function (req, res, next) {

    let a = req.query.a;
    let b = req.query.b;
    init(a,b);
    res.send({result, dist});
});

// test graph
function blah(){
    let gra1 = ['a','b','c','d'];
    let gra2 = ['c','b','e','d'];
    let gra3 = ['a','m','n','e'];
    let g = new Graph({directed: true});
    g.setDefaultEdgeLabel(1)
    let lastNode=null;
    gra1.forEach((node,i)=>{
        g.setNode(node);
        if(lastNode){
            g.setEdge(lastNode,node);
            g.setEdge(node,lastNode);
        }

        lastNode = node;
    })
    lastNode=null;
    gra2.forEach((node,i)=>{
        g.setNode(node);
        if(lastNode){
            g.setEdge(node,lastNode);
            g.setEdge(lastNode,node);
        }
        lastNode = node;
    })
    lastNode=null;
    gra3.forEach((node,i)=>{
        g.setNode(node);
        if(lastNode){
            g.setEdge(node,lastNode);
            g.setEdge(lastNode,node);
        }
        lastNode = node;
    })
    let x = alg.dijkstraAll(g,  e => {
        return g.edge(e);
    });
    console.log(g);
    console.log(x);
}


module.exports = router;
