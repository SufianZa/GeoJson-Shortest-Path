let path = require('path');
let express = require('express');
let router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    let path_file = path.resolve('public\\geoData\\muenster.geojson');
    res.sendFile(path_file, function (err) {
        if (err) {
            next(err);
        } else {
            console.log('Sent:', path_file);
        }
    });

});


module.exports = router;
