import $ from "jquery";
import 'ol/ol.css';
import Map from 'ol/Map';
import View from "ol/View";
import * as olControl from 'ol/control';
import * as olProj from "ol/proj";
import * as olSource from "ol/source";
import * as olExtent from "ol/extent";
import * as olLayer from "ol/layer";
import * as moment from 'moment';

window.CONSTANTS;
window.STATE = {
    stop: true,
    rate: 100,
    current: new Date(1990, 0, 1),
    start: new Date(1990, 0, 1),
    end: new Date(2018, 11, 28),
    extCon: "extent",
    norSouth: "n",
    dateLoopStyle: "daily",
    monthLoop: 0
}

async function main() {
    window.CONSTANTS = await readJSON("./public/constants.json");
    console.log(window.CONSTANTS);
    //Set default settings into the selectors and some other starting values
    var map;
    init(map);
    
    $("#animate").click(function () {//When animation button is clicked 
        if (window.STATE.stop) {
            window.STATE.stop = false;//Start animation
            $("#animate").html("Stop Animation");
        }
        else {
            window.STATE.stop = true;
        $("#animate").html("Start Animation");
        }
    });


    $("#updateParams").click(async function () {
        updateSTATE(map);
    });
}

async function init(map){
    $('input:radio[name=ext-con]').val(['extent']);//Default values
    $('input:radio[name=n-s]').val(['n']);
    $('input:radio[name=dates]').val(['Daily']);
    $('input[name=sYear]').val(1990);
    $('input[name=eYear]').val(2018);
    $('input[name=sDay]').val(1);
    $('input[name=eDay]').val(28);
    $("#map").html("");//Empty map when a new animation occurs

    
    var projection = getProjection();
    map = getMap(projection);

    map.addLayer(createLayer());
    await updateSTATE(map);
    window.STATE.current = window.STATE.start;
    map.getLayers().getArray()[0].setZIndex(1000);//loading on top
    var zoomToExtentControl = new olControl.ZoomToExtent({
        extent: getLocationParams().extent,
        size: [10, 10]
    });
    map.addControl(zoomToExtentControl);//Add control to reset view

    

    window.STATE.stop = true;
    $("#pauseAnimation").html("Start Animation");
    $("#date").html(getDateString([window.STATE.current.getFullYear(), window.STATE.current.getMonth()+1, window.STATE.current.getDate()]));
    animationLoop(map);
}


async function animationLoop(map){
    while (true) {
        if (!window.STATE.stop) {
            nextDate();
            var wmsParams = {
                LAYERS: "NSIDC:g02135_" + window.STATE.extCon + "_raster_daily_" + window.STATE.norSouth,
                SRS: getLocationParams().srs,
                BBOX: getLocationParams().locationVal,
                TILED: false,
                format:"image/png",
                TIME: window.STATE.current.getFullYear() + "-" + window.STATE.current.getMonth()+1 + "-" + window.STATE.current.getDate(),
                STYLES: "NSIDC:g02135_" + window.STATE.extCon + "_raster_basemap"
            };
            await updateWMSLayerParams(map.getLayers().getArray()[0],wmsParams);
            await sleep(window.STATE.rate);
        }
        else {
            await sleep(0);
        }
    }
}

function nextDate(){
    if (window.STATE.dateLoopStyle == "Monthly") {
        if (window.STATE.current.month < 11) {
            window.STATE.current = new Date(window.STATE.current.getFullYear(), window.STATE.current.getMonth()+1, 1);
        }
        else if (window.STATE.current.month == 11) {
            window.STATE.current = new Date(window.STATE.current.getFullYear()+1, 0, 1);
        }
    }
    else if (window.STATE.dateLoopStyle == "SameMonth") {
        window.STATE.current = new Date(window.STATE.current.getFullYear()+1, window.STATE.monthLoop, 1);
    }
    else {
        window.STATE.current.setDate(window.STATE.current.getDate()+1);
    }
}

function updateSTATE(map) {
    window.STATE.extCon = $('input[name=ext-con]:checked').val();//Get value for extent or concentration
    window.STATE.norSouth = $('input[name=n-s]:checked').val();//Get value for North or South
    window.STATE.dateLoopStyle = $('input[name=dates]:checked').val();//Get value for the looping style
    window.STATE.monthLoop = $('select[name=monthsLoop]').val();//Month to be repeated if that option is chosen
    window.STATE.start = new Date(parseInt($('input[name=sYear]').val()), parseInt($('select[name=sMonth]').val()), parseInt($('input[name=sDay]').val()));
    window.STATE.end = new Date(parseInt($('input[name=eYear]').val()), parseInt($('select[name=eMonth]').val()), parseInt($('input[name=eDay]').val()));

    var wmsParams = {
        LAYERS: "NSIDC:g02135_" + window.STATE.extCon + "_raster_daily_" + window.STATE.norSouth,
        SRS: getLocationParams().srs,
        BBOX: getLocationParams().locationVal,
        TILED: false,
        format:"image/png",
        TIME: window.STATE.current.getFullYear() + "-" + window.STATE.current.getMonth()+1 + "-" + window.STATE.current.getDate(),
        STYLES: "NSIDC:g02135_" + window.STATE.extCon + "_raster_basemap"
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
    var projection = new olProj.Projection({//Map projection
        code: window.CONSTANTS[window.STATE.norSouth].srs,
        units: 'meters',
        extent: window.CONSTANTS[window.STATE.norSouth].extent
    });
    return projection;
}

function createLayer() {
    var wmsParams = {
        LAYERS: "NSIDC:g02135_" + window.STATE.extCon + "_raster_daily_" + window.STATE.norSouth,
        SRS: getLocationParams().srs,
        BBOX: getLocationParams().locationVal,
        TILED: false,
        format:"image/png",
        TIME: window.STATE.current.year + "-" + window.STATE.current.month + "-" + window.STATE.current.day,
        STYLES: "NSIDC:g02135_" + window.STATE.extCon + "_raster_basemap"
    };
    var source = new olSource.ImageWMS({
        url: 'https://nsidc.org/api/mapservices/NSIDC/wms',
        params: wmsParams,
        serverType: 'geoserver'
    });
    
    var layer = new olLayer.Image({source});
    return layer;
}

function getMap(projection) {
    var extent = getLocationParams().extent;
    var map = new Map({//New map
        target: 'map',//Div in which the map is displayed
        view: new View({
            projection: projection,
            center: olExtent.getCenter(extent),//Start in the center of the image
            zoom: 1,
            minZoom: 1,
            extent: extent
        }),
        controls: olControl.Zoom
    });
    return map;
}

function getLocationParams() {
    var extent = window.CONSTANTS[window.STATE.norSouth].extent;//Map size
    //var extent = [0,0,0,0];
    $("#map").css("width",window.CONSTANTS[window.STATE.norSouth].css.width);
    $("#map").css("height", window.CONSTANTS[window.STATE.norSouth].css.height);
    var locationVal = window.CONSTANTS[window.STATE.norSouth].locationVal;
    var width = window.CONSTANTS[window.STATE.norSouth].width;
    var height = window.CONSTANTS[window.STATE.norSouth].height;
    var srs = window.CONSTANTS[window.STATE.norSouth].srs;//Location for request url
    return {extent: extent, locationVal: locationVal, width: width, height: height, srs: srs};
}

function updateWMSLayerParams(layer, params) {
    return new Promise(function(resolve, reject) {
        const source = layer.getSource();
        source.updateParams(params);
        source.refresh();
        map.once('rendercomplete', function(event) {
            $("#date").html(getDateString([window.STATE.current.getFullYear(), window.STATE.current.getMonth()+1, window.STATE.current.getDate()]));//Wait for map to be ready to change the date tag
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
            if (request.readystate == 4 && request.status == "200") {
                resolve(JSON.parse(request.responseText));
            }
        }
        request.send(null);
    });
}

function sleep(ms) { //Sleep function for pauses between frames
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function resolvePromise() {
    return new Promise(resolve => setTimeout(resolve, 0));
}


main();
