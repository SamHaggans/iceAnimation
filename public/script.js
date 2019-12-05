var stop = false; //Global variable to stop the animation
var pause = false;
var monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];//Days in each month
var displayDates = [];

function main() {
    //Set default settings into the selectors
    $('input:radio[name=ext-con]').val(['extent']);
    $('input:radio[name=n-s]').val(['n']);
    $('input:radio[name=dates]').val(['Daily']);
    $('input[name=sYear]').val(1990);
    $('input[name=eYear]').val(2018);
    $('input[name=sDay]').val(1);
    $('input[name=eDay]').val(28);
    
    $("#animate").click(function () {//When animation button is clicked 
        stop = false;//Don't stop animation
        var [extCon, norSouth, dates, monthLoop, starting, ending] = getParams();
        animate(extCon, norSouth, dates, monthLoop, starting, ending);//animate
    });

    $("#stopAnimation").click(function () {//Stop button
        stop = true;//stop the animation
        $("#customize :input").prop("disabled", false);//Reenable the form to allow the animation to be restarted
    });

    $("#pauseAnimation").click(function () {//Stop button
        if (pause) {
            pause = false;
            $("#customize :input").prop("disabled", true);//Reenable the form to allow the animation to be restarted
            $("#pauseAnimation").html("Pause Animation");
        }
        else {
            pause = true;
            $("#customize :input").prop("disabled", false);//Reenable the form to allow the animation to be restarted
            $("#pauseAnimation").html("Resume Animation");
        }
    });

    $("#updateParams").click(async function () {
        $("#updateParams:input").prop("disabled", true);//Don't allow user to click to update multiple times too fast
        pause = true;//pause the frames
        var [extCon, norSouth, dates, monthLoop, starting, ending] = getParams();
        var [extent, locationVal, fullZoom, imageURL] = getLocationParams(norSouth);
        $("#map").html("");//Empty map when a new animation occurs
        map = null;
    
        projection = getProjection(extent);
        map = getMap(projection,extent,fullZoom);
        var [yearStr, monthStr, dayStr] = getDateStrings(starting);
        map.addLayer(createLayer(norSouth, extCon, dayStr, monthStr, yearStr));
        map.getLayers().getArray()[0].setZIndex(1000);//loading on top
        displayDates = [];//dates to be displayed
        await loadFrames(map, extent, projection, displayDates, starting, ending, locationVal);
        pause = false;//unpause
        $("#updateParams:input").prop("disabled", false);//Allow updating again  
    });
}

async function animate(extCon, norSouth, dates, monthLoop, starting, ending) {//Main animation function
    $("#pauseAnimation").html("Pause Animation");
    
    displayDates = [];
    var currentYear = 0;
    var currentDay = 0;
    var currentMonth = 0;
    var monthVal = "daily";

    if (dates == "Monthly" || dates == "SameMonth") {
        monthVal = "monthly";
    }

    $("#customize :input").prop("disabled", true);//Disable form entering while animation is running
    $("#map").html("");//Empty map when a new animation occurs
    var imageURL = '';//Variable to hold the url to fetch from the server
    var [extent, locationVal, width, height, srs, fullZoom, imageURL] = getLocationParams(norSouth);

    projection = getProjection(extent);
    map = getMap(projection,extent,fullZoom);
    var [yearStr, monthStr, dayStr] = getDateStrings(starting);
    map.addLayer(createLayer(norSouth, extCon, dayStr, monthStr, yearStr));
    map.getLayers().getArray()[0].setZIndex(1000);//loading on top
    var zoomToExtentControl = new ol.control.ZoomToExtent({
        extent: extent,
        size: [10, 10]
    });

    map.addControl(zoomToExtentControl);//Add control to reset view
    // map.on('moveend', restrictCenter);//When map is moved, restrict the center's location
    displayDates.push("placeholder");//Placeholder in the dates array, also gets deleted by the program for the first run
    
    $(".ol-zoom-extent").find("button").html("");
    await loadFrames(map, extent, projection, displayDates, starting, ending, locationVal);
    

    $("#customize :input").prop("disabled", false);//reenable the form when everything is done
}

function sleep(ms) { //Sleep function for pauses between frames
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getMonth(year,starting,ending, dates,monthLoop) {
    var monthStart = 1;//default starting month
    var monthEnd = 12;//default ending month
    if (year == starting[0]) {//If on the starting year, start on the specified month. Otherwise it just starts at 1 (January)
        monthStart = starting[1];
    }
    if (year == ending[0]) {//If on the last year, end on the specified month. Otherwise it ends on 12 (December)
        monthEnd = ending[1];
    }
    if (dates == "SameMonth") {//If it is looping the same month, just loop through that one month
        monthStart = monthLoop;
        monthEnd = monthLoop;
    }
    return [monthStart, monthEnd];
}

function getDay(year,month,starting,ending, dates) {
    var dayStart = 1;//default starting day
    var dayEnd = monthDays[month - 1];//default ending day, month -1 because index starts at 0
    if (month == starting[1] && year == starting[0]) {//if on first month and year, start at the specified date
        dayStart = starting[2];
    }
    if (month == ending[1] && year == ending[0]) {//if on the last month and year, end at the last date
        dayEnd = ending[2];
    }
    if (dates == "Monthly" || dates == "SameMonth") {//If it is looping only months or the same month, just use the first day of the month
        dayEnd = 1;
        dayStart = 1;
    }
    return [dayStart, dayEnd];
}

async function loadFrames(map, extent, projection, displayDates, starting, ending, locationVal) {
    var dates = $('input[name=dates]:checked').val();//Get value for the looping style
    var monthLoop = $('select[name=monthsLoop]').val();//Month to be repeated if that option is chosen
    var extCon = $('input[name=ext-con]:checked').val();//Get value for extent or concentration
    var numFrames = 0;
    for (year = starting[0]; year <= ending[0]; year++) {//loop through all years
        var monthVals = getMonth(year,starting,ending, dates,monthLoop);
        var monthStart = monthVals[0];
        var monthEnd = monthVals[1];
        for (month = monthStart; month <= monthEnd; month++) {//Loop months
            var dayVals = getDay(year,month,starting,ending, dates);
            var dayStart = dayVals[0];
            var dayEnd = dayVals[1];
            for (day = dayStart; day <= dayEnd; day++) {//loop days
                if (!stop){
                    while (pause) {
                        await sleep(50);
                    }
                    
                        //TODO: LayerLoad event before updating date string
                        await updateWMSLayerParams(map.getLayers().getArray()[0], {TIME: getDateString([year, month, day])});
                        console.log("here");
                        $("#date").html(getDateString([year, month, day]));//set the date to be the next day, what is displayed by the layer
                        await sleep(2000 - parseInt($("input[name=speed]").val()));//sleep for the time specified by the slider bar
                    
                }
            }
        }
    }
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

function getDateStrings(year, month, day) {
    var monthStr = "" + month;//create the string for month, ensuring it is 2 digits
    if (month < 10) {
        monthStr = "0" + month;
    }
    var dayStr = "" + day;//string for the day, ensuring 2 digits
    if (day < 10) {
        dayStr = "0" + day;
    }
    var yearStr = "" + year;//String for year
    return [yearStr, monthStr, dayStr];
}

function getProjection(extent) {
    var projection = new ol.proj.Projection({//Map projection
        code: "EPSG:3411",
        units: 'meters',
        extent: extent
    });
    return projection;
}

function createLayer(norSouth, extCon, dayStr, monthStr, yearStr) {
    var [extent, locationVal, width, height, srs, fullZoom, imageURL] = getLocationParams(norSouth);
    let wmsParams = {
        LAYERS: "NSIDC:g02135_" + extCon + "_raster_daily_" + norSouth,
        SRS: srs,
        BBOX: locationVal,
        TILED: false,
        format:"image/png",
        TIME: yearStr + "-" + monthStr + "-" + dayStr,
        STYLES: "NSIDC:g02135_" + extCon + "_raster_basemap"
    };
    let source = new ol.source.ImageWMS({
        url: 'https://nsidc.org/api/mapservices/NSIDC/wms',
        params: wmsParams,
        serverType: 'geoserver'
    });
    
    var layer = new ol.layer.Image({source});
    return layer;
}
function getMap (projection, extent, fullZoom) {
    var map = new ol.Map({//New map
        target: 'map',//Div in which the map is displayed
        view: new ol.View({
            projection: projection,
            center: ol.extent.getCenter(extent),//Start in the center of the image
            zoom: fullZoom,//Good start for zoom,
            minZoom: fullZoom,
            extent: extent
        }),
        controls: ol.control.PanZoom
    });
    return map;
}

async function removeLayers (map) {
    var layers = await map.getLayers().getArray();
    await layers.forEach((layer) => map.removeLayer(layer));//remove all layers, for some reason it needed to be run multiple times
    await layers.forEach((layer) => map.removeLayer(layer));
    await layers.forEach((layer) => map.removeLayer(layer));
    await layers.forEach((layer) => map.removeLayer(layer));
    await layers.forEach((layer) => map.removeLayer(layer));
    await layers.forEach((layer) => map.removeLayer(layer));
}

async function nextLoop (map, displayDates) {
    while (map.getLayers().getArray().length > 1) {//While there are unrendered layers remaining, loop through them
        displayDates.splice(0, 1);//remove the date
        $("#date").html(displayDates[0]);//update the date to current
        map.removeLayer(map.getLayers().getArray()[0]);//remove current layer
        map.getLayers().getArray()[0].setZIndex(100);//add the new layer
        await sleep(2000 - parseInt($("input[name=speed]").val()));//sleep for the correct time
    }
}

function getLocationParams(hemisphere) {
    if (hemisphere == "n") {//Northern hemisphere values, including the size of the map and the information for the server request
        var extent = [-3850000.0,-5350000.0,3750000.0,5850000.0];//Map size
        //var extent = [0,0,0,0];
        $("#map").css("width", "340");
        $("#map").css("height", "502");
        var locationVal = "-3850000.0,-5350000.0,3750000.0,5850000.0";
        var width = "304";
        var height = "448";
        var srs = "EPSG:3411";//Location for request url
        //var locationVal = "-3850000.0,-5350000.0,3750000.0,5850000.0&width=304&height=448&srs=EPSG:3411";//Location data for request url
        var fullZoom = 1;
        imageURL = "nLoad.jpg";//Placeholder image to add the first frame, as there needs to be one frame that is deleted before any displays happen
    }
    else {//Information for southern hemisphere
        var extent = [-3950000.0,-3950000.0,3950000.0,4350000.0];//Map size
        $("#map").css("width", "480");
        $("#map").css("height", "504");
        var locationVal = "-3950000.0,-3950000.0,3950000.0,4350000.0";
        var width = "730";
        var height = "768";
        var srs = "EPSG:3412";//Location for request url
        var fullZoom = 1;
        imageURL = "sLoad.jpg";
    }
    return [extent, locationVal, width, height, srs, fullZoom, imageURL];
}
function getParams() {
    var extCon = $('input[name=ext-con]:checked').val();//Get value for extent or concentration
    var norSouth = $('input[name=n-s]:checked').val();//Get value for North or South
    var dates = $('input[name=dates]:checked').val();//Get value for the looping style
    var monthLoop = $('select[name=monthsLoop]').val();//Month to be repeated if that option is chosen
    var starting = [parseInt($('input[name=sYear]').val()), parseInt($('select[name=sMonth]').val()), parseInt($('input[name=sDay]').val())];//year, month, day starting values
    var ending = [parseInt($('input[name=eYear]').val()), parseInt($('select[name=eMonth]').val()), parseInt($('input[name=eDay]').val())]//year, month, day ending values
    return [extCon, norSouth, dates, monthLoop, starting, ending];
}


function updateWMSLayerParams (layer, params) {
    const source = layer.getSource();
    source.updateParams(params);
    source.refresh();
};
