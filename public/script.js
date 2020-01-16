var monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];//Days in each month
var CONSTANTS;
var STATE = {
    stop: true,
    rate: 100,
    current: {
        day: 1,
        month: 1,
        year: 1990
    },
    start: {
        day: 1,
        month: 1,
        year: 1990
    },
    end: {
        day: 28,
        month: 12,
        year: 2018
    },
    extCon: "extent",
    norSouth: "n",
    dateLoopStyle: "daily",
    monthLoop: 1

}

var map;

async function main() {
    CONSTANTS = await readJSON("constants.json");
    //Set default settings into the selectors and some other starting values
    init();
    
    $("#animate").click(function () {//When animation button is clicked 
        if (STATE.stop) {
            STATE.stop = false;//Start animation
            $("#animate").html("Stop Animation");
        }
        else {
            STATE.stop = true;
        $("#animate").html("Start Animation");
        }
    });


    $("#updateParams").click(async function () {
        updateState();
    });
}

async function init(){
    $('input:radio[name=ext-con]').val(['extent']);//Default values
    $('input:radio[name=n-s]').val(['n']);
    $('input:radio[name=dates]').val(['Daily']);
    $('input[name=sYear]').val(1990);
    $('input[name=eYear]').val(2018);
    $('input[name=sDay]').val(1);
    $('input[name=eDay]').val(28);
    $("#map").html("");//Empty map when a new animation occurs

    
    projection = getProjection();
    map = getMap(projection);

    map.addLayer(createLayer());
    await updateState();
    STATE.current = STATE.start;
    map.getLayers().getArray()[0].setZIndex(1000);//loading on top
    var zoomToExtentControl = new ol.control.ZoomToExtent({
        extent: getLocationParams().extent,
        size: [10, 10]
    });
    map.addControl(zoomToExtentControl);//Add control to reset view

    

    STATE.stop = true;
    $("#pauseAnimation").html("Start Animation");
    $("#date").html(getDateString([STATE.current.year, STATE.current.month, STATE.current.day]));
    animationLoop(map);
}


async function animationLoop(map){
    while (true) {
        if (!STATE.stop) {
            nextDate();
            var wmsParams = {
                LAYERS: "NSIDC:g02135_" + STATE.extCon + "_raster_daily_" + STATE.norSouth,
                SRS: getLocationParams().srs,
                BBOX: getLocationParams().locationVal,
                TILED: false,
                format:"image/png",
                TIME: STATE.current.year + "-" + STATE.current.month + "-" + STATE.current.day,
                STYLES: "NSIDC:g02135_" + STATE.extCon + "_raster_basemap"
            };
            await updateWMSLayerParams(map.getLayers().getArray()[0],wmsParams);
            await sleep(STATE.rate);
        }
        else {
            await sleep(50);
        }
    }
}

function nextDate(){
    if (STATE.dateLoopStyle == "Monthly") {
        if (STATE.current.month < 12) {
            STATE.current.month++;
        }
        else if (STATE.current.month = 12) {
            STATE.current.month = 1;
            STATE.current.year++;
        }
    }
    else if (STATE.dateLoopStyle == "SameMonth") {
        STATE.current.month = STATE.monthLoop;
        STATE.current.year++;
    }
    else {
        if (STATE.current.day < monthDays[STATE.current.month-1]) {
            STATE.current.day++;
        }
        else if (STATE.current.month < 12) {
            STATE.current.day = 1;
            STATE.current.month++;
        }
        else if (STATE.current.month = 12) {
            STATE.current.day = 1;
            STATE.current.month = 1;
            STATE.current.year++;
        }
    }
}

function updateState() {
    STATE.extCon = $('input[name=ext-con]:checked').val();//Get value for extent or concentration
    STATE.norSouth = $('input[name=n-s]:checked').val();//Get value for North or South
    STATE.dateLoopStyle = $('input[name=dates]:checked').val();//Get value for the looping style
    STATE.monthLoop = $('select[name=monthsLoop]').val();//Month to be repeated if that option is chosen
    STATE.start = {year: parseInt($('input[name=sYear]').val()), month: parseInt($('select[name=sMonth]').val()), day: parseInt($('select[name=sMonth]').val())};

    STATE.end.year = parseInt($('input[name=eYear]').val());
    STATE.end.month =  parseInt($('select[name=eMonth]').val());
    STATE.end.day =  parseInt($('input[name=eDay]').val());
    console.log(STATE.norSouth);
    var wmsParams = {
        LAYERS: "NSIDC:g02135_" + STATE.extCon + "_raster_daily_" + STATE.norSouth,
        SRS: getLocationParams().srs,
        BBOX: getLocationParams().locationVal,
        TILED: false,
        format:"image/png",
        TIME: STATE.current.year + "-" + STATE.current.month + "-" + STATE.current.day,
        STYLES: "NSIDC:g02135_" + STATE.extCon + "_raster_basemap"
    };
    updateWMSLayerParams(map.getLayers().getArray()[0],wmsParams);
}

function getDateString(dateArray) {
    var year = dateArray[0];
    var month = dateArray[1];
    var day = dateArray[2];
    var monthStr = "" + month;//create the string for month, ensuring it is 2 digits
    if (month < 10) {
        monthStr = "0" + month;
    }
    var dayStr = "" + day;//string for the day, ensuring 2 digits
    if (day < 10) {
        dayStr = "0" + day;
    }
    var yearStr = "" + year;//String for year
    return `${yearStr}-${monthStr}-${dayStr}`;
}

function getProjection() {
    var projection = new ol.proj.Projection({//Map projection
        code: CONSTANTS[STATE.norSouth].srs,
        units: 'meters',
        extent: CONSTANTS[STATE.norSouth].extent
    });
    return projection;
}

function createLayer() {
    var wmsParams = {
        LAYERS: "NSIDC:g02135_" + STATE.extCon + "_raster_daily_" + STATE.norSouth,
        SRS: getLocationParams().srs,
        BBOX: getLocationParams().locationVal,
        TILED: false,
        format:"image/png",
        TIME: STATE.current.year + "-" + STATE.current.month + "-" + STATE.current.day,
        STYLES: "NSIDC:g02135_" + STATE.extCon + "_raster_basemap"
    };
    var source = new ol.source.ImageWMS({
        url: 'https://nsidc.org/api/mapservices/NSIDC/wms',
        params: wmsParams,
        serverType: 'geoserver'
    });
    
    var layer = new ol.layer.Image({source});
    return layer;
}

function getMap(projection) {
    var extent = getLocationParams().extent;
    var map = new ol.Map({//New map
        target: 'map',//Div in which the map is displayed
        view: new ol.View({
            projection: projection,
            center: ol.extent.getCenter(extent),//Start in the center of the image
            zoom: 1,
            minZoom: 1,
            extent: extent
        }),
        controls: ol.control.PanZoom
    });
    return map;
}

function getLocationParams() {
    var extent = CONSTANTS[STATE.norSouth].extent;//Map size
    //var extent = [0,0,0,0];
    $("#map").css("width",CONSTANTS[STATE.norSouth].css.width);
    $("#map").css("height", CONSTANTS[STATE.norSouth].css.height);
    var locationVal = CONSTANTS[STATE.norSouth].locationVal;
    var width = CONSTANTS[STATE.norSouth].width;
    var height = CONSTANTS[STATE.norSouth].height;
    var srs = CONSTANTS[STATE.norSouth].srs;//Location for request url
    return {extent: extent, locationVal: locationVal, width: width, height: height, srs: srs};
}

function updateWMSLayerParams(layer, params) {
    return new Promise(function(resolve, reject) {
        const source = layer.getSource();
        source.updateParams(params);
        source.refresh();
        map.once('rendercomplete', function(event) {
            $("#date").html(getDateString([STATE.current.year, STATE.current.month, STATE.current.day]));//Wait for map to be ready to change the date tag
            resolve();
            
        });
    });
    
};

function readJSON(filename) {   
    return new Promise(function(resolve, reject) {
        var request = new XMLHttpRequest();
        request.overrideMimeType("application/json");
        request.open('GET', filename, true);
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == "200") {
                resolve(JSON.parse(request.responseText));
            }
        }
        request.send(null);
    });
}

function sleep(ms) { //Sleep function for pauses between frames
    return new Promise(resolve => setTimeout(resolve, ms));
}