var stop = false; //Global variable to stop the animation
var pause = false;
async function animate(extCon, norSouth, dates, monthLoop, starting, ending) {//Main animation function
    var monthVal = "daily";
    if (dates == "Monthly" || dates == "SameMonth") {
        monthVal = "monthly";
    }

    function restrictCenter() {//Function to ensure map does not go outside of bounds
        var view = map.getView();
        var zoom = map.getView().getZoom();
        var center = map.getView().getCenter();
        var xVal = extent[2];//Max x extent
        var yVal = extent[3];//Max y extent
        if (center[0]<xVal/(2**zoom)){//prevents panning too far left
            view.setCenter([xVal/(2**zoom),center[1]]);
        }
        center = map.getView().getCenter();
        if (xVal-center[0]<xVal/(2**zoom)){//prevents panning too far right
            view.setCenter([xVal-xVal/(2**zoom),center[1]]);
        }
        center = map.getView().getCenter();
        if (center[1]<yVal/(2**zoom)){//prevents panning too far up
            view.setCenter([center[0],yVal/(2**zoom)]);
        }
        center = map.getView().getCenter();
        if (yVal-center[1]<yVal/(2**zoom)){//prevents panning too far down
            view.setCenter([center[0],yVal-yVal/(2**zoom)]);
        }
    }

    $("#updateParams").click( async function() {
        $( "#updateParams:input").prop( "disabled", true );//Don't allow user to click to update multiple times too fast
        pause = true;//pause the frames
        extCon = $('input[name=ext-con]:checked').val();//Get value for extent or concentration
        dates = $('input[name=dates]:checked').val();//Get value for the looping style
        monthLoop = $('select[name=monthsLoop]').val();//Month to be repeated if that option is chosen
        ending = [Number($('input[name=eYear]').val()), Number($('select[name=eMonth]').val()), Number($('input[name=eDay]').val())]//year, month, day ending values
        if (norSouth == "n") {//Northern hemisphere values, including the size of the map and the information for the server request
            var extent = [0,0,304,448];//Size of map
            $("#map").css("width","340");
            $("#map").css("height","502");
            var locationVal = "-3850000.0,-5350000.0,3750000.0,5850000.0&width=304&height=448&srs=EPSG:3411";//Location data for request url
            var fullZoom = 1;
            imageURL = "nLoad.jpg";//Placeholder image to add the first frame, as there needs to be one frame that is deleted before any displays happen
        }
        else {//Information for southern hemisphere
            var extent = [0,0,730,768];//Map size
            $("#map").css("width","480");
            $("#map").css("height","504");
            var locationVal = "-3950000.0,-3950000.0,3950000.0,4350000.0&width=730&height=768&srs=EPSG:3412";//Location for request url
            var fullZoom = 1;
            imageURL = "sLoad.jpg";
        }
        
        var i = 0;
        var layers = await map.getLayers().getArray();
        await layers.forEach((layer) => map.removeLayer(layer));//remove all layers, for some reason it needed to be run multiple times
        await layers.forEach((layer) => map.removeLayer(layer));
        await layers.forEach((layer) => map.removeLayer(layer));
        await layers.forEach((layer) => map.removeLayer(layer));
        await layers.forEach((layer) => map.removeLayer(layer));
        await layers.forEach((layer) => map.removeLayer(layer));
        await map.addLayer(new ol.layer.Image({//add loading layer
            source: new ol.source.ImageStatic({
                url: imageURL,
                projection: projection,
                imageExtent: extent
            })
        }));

        await map.getLayers().getArray()[0].setZIndex(10000);//add the new layer to top
        await sleep(1000);//sleep so that loading screen appears for long enough to not be confusing
        while (map.getLayers().getArray().length < 29) {//until there are 29 layers, load in layers
            imageURL = "https://nsidc.org/api/mapservices/NSIDC/wms?service=WMS&version=1.1.0&request=GetMap&layers=NSIDC:g02135_"+extCon+"_raster_"+monthVal+"_"+norSouth+"&styles=NSIDC:g02135_"+extCon+"_raster_basemap&bbox="+locationVal+"&format=image/png&TIME="+displayDates[i].split(" ")[1];
            await map.addLayer(new ol.layer.Image({
                source: new ol.source.ImageStatic({
                    url: imageURL,
                    projection: projection,
                    imageExtent: extent
                })
            }));    
            map.getLayers().getArray()[0].setZIndex(100);//add the new layer  
            i++;
        }

        pause = false;//unpause
        $( "#updateParams:input").prop( "disabled", false );//Allow updating again
        map.removeLayer(map.getLayers().getArray()[0]);//Disable the loading layer
        map.getLayers().getArray()[0].setZIndex(100);//Set next layer to be on top
    });

    var displayDates = [];//dates to be displayed
    $( "#customize :input").prop( "disabled", true );//Disable form entering while animation is running
    $("#map").html("");//Empty map when a new animation occurs
    var monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];//Days in each month
    var imageURL = '';//Variable to hold the url to fetch from the server
    if (norSouth == "n") {//Northern hemisphere values, including the size of the map and the information for the server request
        var extent = [0,0,304,448];//Size of map
        $("#map").css("width","340");
        $("#map").css("height","502");
        var locationVal = "-3850000.0,-5350000.0,3750000.0,5850000.0&width=304&height=448&srs=EPSG:3411";//Location data for request url
        var fullZoom = 1;
        imageURL = "nLoad.jpg";//Placeholder image to add the first frame, as there needs to be one frame that is deleted before any displays happen
    }
    else {//Information for southern hemisphere
        var extent = [0,0,730,768];//Map size
        $("#map").css("width","480");
        $("#map").css("height","504");
        var locationVal = "-3950000.0,-3950000.0,3950000.0,4350000.0&width=730&height=768&srs=EPSG:3412";//Location for request url
        var fullZoom = 1;
        imageURL = "sLoad.jpg";
    }
    var projection = new ol.proj.Projection({//Map projection
        code: 'local_image',
        units: 'pixels',
        extent: extent
    });
    var zoomToExtentControl = new ol.control.ZoomToExtent({
        extent: extent,
        size: [10,10]
      });
    var map = new ol.Map({//New map
        target: 'map',//Div in which the map is displayed
        view: new ol.View({
            projection: projection,
            center: ol.extent.getCenter(extent),//Start in the center of the image
            zoom: fullZoom,//Good start for zoom,
            minZoom: fullZoom,
        }),
        controls: ol.control.PanZoom
        
    });
    map.addControl(zoomToExtentControl);//Add control to reset view
    map.on('moveend', restrictCenter);//When map is moved, restrict the center's location
    map.addLayer(new ol.layer.Image({//add a loading layer for the first frame
        source: new ol.source.ImageStatic({
            url: imageURL,
            projection: projection,
            imageExtent: extent
        })
    }));
    map.getLayers().getArray()[0].setZIndex(1000);//loading on top
    displayDates.push("placeholder");//Placeholder in the dates array, also gets deleted by the program for the first run
    for (year = starting[0]; year <= ending[0]; year++) {//loop through all years
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
        for (month = monthStart; month <= monthEnd; month++) {//Loop months
            var dayStart = 1;//default starting day
            var dayEnd = monthDays[month-1];//default ending day, month -1 because index starts at 0
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
            for (day = dayStart; day <= dayEnd; day++) {//loop days
                if (year >=1989 || day %2 ==1){
                    
                    if (stop) return;//Catch to stop animation
                    while (pause) {
                        await sleep (100);
                    }
                    var monthStr = ""+month;//create the string for month, ensuring it is 2 digits
                    if (month < 10) {
                        monthStr = "0"+month;
                    }
                    var dayStr = ""+day;//string for the day, ensuring 2 digits
                    if (day < 10) {
                        dayStr = "0"+day;
                    }
                    var yearStr = ""+year;//String for year
                    await displayDates.push("Date: "+yearStr+"-"+monthStr+"-"+dayStr);
                    imageURL = "https://nsidc.org/api/mapservices/NSIDC/wms?service=WMS&version=1.1.0&request=GetMap&layers=NSIDC:g02135_"+extCon+"_raster_daily_"+norSouth+"&styles=NSIDC:g02135_"+extCon+"_raster_basemap&bbox="+locationVal+"&format=image/png&TIME="+yearStr+"-"+monthStr+"-"+dayStr;
                    await map.addLayer(new ol.layer.Image({
                        source: new ol.source.ImageStatic({
                            url: imageURL,
                            projection: projection,
                            imageExtent: extent
                        })
                    }));
                    await sleep(20);
                    if (map.getLayers().getArray().length >= 30) {//If there are 30 layers already loaded, display them. Otherwise, just load the layers but do not display.
                        //await alert("Loaded layers");
                        map.removeLayer(map.getLayers().getArray()[0]);//remove the current top layer
                        map.getLayers().getArray()[0].setZIndex(100);//set the next layer to be on top
                        displayDates.splice(0,1);//remove the current date value
                        $("#date").html(displayDates[0]);//set the date to be the next day, what is displayed by the layer
                        await sleep(2000-Number($("input[name=speed]").val()));//sleep for the time specified by the slider bar
                    }
                }
            }
        }
    }
    while (map.getLayers().getArray().length>1){//While there are unrendered layers remaining, loop through them
        displayDates.splice(0,1);//remove the date
        $("#date").html(displayDates[0]);//update the date to current
        map.removeLayer(map.getLayers().getArray()[0]);//remove current layer
        map.getLayers().getArray()[0].setZIndex(100);//add the new layer
        await sleep(2000-Number($("input[name=speed]").val()));//sleep for the correct time
    }
    $( "#customize :input").prop( "disabled", false );//reenable the form when everything is done
}

$("document").ready(async function() {//When DOM is loaded
    $('input:radio[name=ext-con]').val(['extent']);
    $('input:radio[name=n-s]').val(['n']);
    $('input:radio[name=dates]').val(['Daily']);
    $('input[name=sYear]').val(1990);
    $('input[name=eYear]').val(2018);
    $('input[name=sDay]').val(1);
    $('input[name=eDay]').val(28);
    $("#animate").click( function() {//When animation button is clicked
        stop = false;//Don't stop animation
        var extCon = $('input[name=ext-con]:checked').val();//Get value for extent or concentration
        var norSouth = $('input[name=n-s]:checked').val();//Get value for North or South
        var dates = $('input[name=dates]:checked').val();//Get value for the looping style
        var monthLoop = $('select[name=monthsLoop]').val();//Month to be repeated if that option is chosen
        var starting = [Number($('input[name=sYear]').val()), Number($('select[name=sMonth]').val()), Number($('input[name=sDay]').val())];//year, month, day starting values
        var ending = [Number($('input[name=eYear]').val()), Number($('select[name=eMonth]').val()), Number($('input[name=eDay]').val())]//year, month, day ending values
        animate(extCon,norSouth,dates,monthLoop,starting,ending);//animate
    });
    $("#stopAnimation").click( function() {//Stop button
        stop = true;//stop the animation
        $( "#customize :input").prop( "disabled", false );//Reenable the form to allow the animation to be restarted
    });
    
    
});

function sleep(ms) { //Sleep function for pauses between frames
    return new Promise(resolve => setTimeout(resolve, ms));
}
