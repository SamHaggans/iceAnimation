var extent = [0,0,128,128]  // image size is 128x128 px
var projection = new ol.proj.Projection({
    code: 'local_image',
    units: 'pixels',
    extent: extent
});

var map = new ol.Map({
    target: 'map',
    view: new ol.View({
        projection: projection,
        center: ol.extent.getCenter(extent),
        resolution: 1,        // important for 100% image size!
      	maxResolution: 2,     // must be >= 1
      	//minResolution: .5,  // also set-able
        //zoom: 0,            // don't use this
    }),
    controls: [],
});

var im_layer = new ol.layer.Image({
    source: new ol.source.ImageStatic({
        url: 'http://img4.wikia.nocookie.net/__cb20071014061100/freeciv/images/1/1c/Crystal_128_penguin.png',  // image size is 128x128 px
        projection: projection,
        imageExtent: extent
    })
})
map.addLayer(im_layer)