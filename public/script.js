function sleep(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}

async function animate() {   
    var monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
    var imageURL = '';
    var extent = [0,0,304,448];
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
            zoom: 1.6,
        }),
        controls: [],
    });
    imageURL = "blank.jpeg";
    map.addLayer(new ol.layer.Image({
        source: new ol.source.ImageStatic({
            url: imageURL,
            projection: projection,
            imageExtent: extent
        })
    }));
    for (year = 2000; year <= 2000; year++) {
        for (month = 1; month <= 1; month++) {
            for (day = 1; day <= monthDays[month-1]; day++) {
                var monthStr = ""+month;  
                if (month < 10) {
                    monthStr = "0"+month;
                }
                var dayStr = ""+day;  
                if (day < 10) {
                    dayStr = "0"+day;
                }
                var yearStr = ""+year;
                if (map.getLayers().getArray().length < 11) {
                    imageURL = "https://nsidc.org/api/mapservices/NSIDC/wms?service=WMS&version=1.1.0&request=GetMap&layers=NSIDC:g02135_extent_raster_daily_n&styles=NSIDC:g02135_extent_raster_basemap&bbox=-3850000.0,-5350000.0,3750000.0,5850000.0&width=304&height=448&srs=EPSG:3411&format=image/png&TIME="+yearStr+"-"+monthStr+"-"+dayStr;
                    await map.addLayer(new ol.layer.Image({
                        source: new ol.source.ImageStatic({
                            url: imageURL,
                            projection: projection,
                            imageExtent: extent
                        })
                    }));
                }
                else {
                    
                    var displayDate = getDisplayDate(year, month, day);
                    var monthStrDisp = ""+displayDate[1];  
                    if (displayDate[1] < 10) {
                        monthStrDisp = "0"+displayDate[1];
                    }
                    var dayStrDisp = ""+displayDate[2];  
                    if (displayDate[2] < 10) {
                        dayStrDisp = "0"+displayDate[2];
                    }
                    var yearStrDisp = ""+displayDate[0];
                    $("#date").html("Date: "+yearStrDisp+"-"+monthStrDisp+"-"+dayStrDisp);
                    imageURL = "https://nsidc.org/api/mapservices/NSIDC/wms?service=WMS&version=1.1.0&request=GetMap&layers=NSIDC:g02135_extent_raster_daily_n&styles=NSIDC:g02135_extent_raster_basemap&bbox=-3850000.0,-5350000.0,3750000.0,5850000.0&width=304&height=448&srs=EPSG:3411&format=image/png&TIME="+yearStr+"-"+monthStr+"-"+dayStr;
                    await map.addLayer(new ol.layer.Image({
                        source: new ol.source.ImageStatic({
                            url: imageURL,
                            projection: projection,
                            imageExtent: extent
                        })
                    }));
                    map.removeLayer(map.getLayers().getArray()[0]);
                    map.getLayers().getArray()[0].setZIndex(100);
                    await sleep(100);
                }
            }
        }
    }
    year--;
    month--;
    day--;
    var currentDisplay = getDisplayDate(year, month, day);
    year = currentDisplay[0];
    month = currentDisplay[1];
    day = currentDisplay[2];
    while (map.getLayers().getArray().length>1){
        var nextDay = addDay(year,month,day);
        year = nextDay[0];
        month = nextDay[1];
        day = nextDay[2];
        var monthStr = ""+month;  
        if (month < 10) {
            monthStr = "0"+month;
        }
        var dayStr = ""+day;  
        if (day < 10) {
            dayStr = "0"+day;
        }
        var yearStr = ""+year;
        $("#date").html("Date: "+yearStr+"-"+monthStr+"-"+dayStr);
        map.removeLayer(map.getLayers().getArray()[0]);
        map.getLayers().getArray()[0].setZIndex(100);
        await sleep(100);
    }
}



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getDisplayDate(y,m,d) {
    var monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
    if (d <= 10) {
        if (m <= 1) {
            return [y-1, 12-(m-1),monthDays[12-(m-1)-1]+d-10];
        }
        return [y, m-1, monthDays[m-2]+d-10];
    }
    return [y,m,d-10];
} 

function addDay(y,m,d) {
    var monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
    if (d >= monthDays[m-1]){
        if (m >= 12) {
            return [y+1, 1, 1];
        }
        return [y, m+1, 1];
    }
    return [y,m,d+1];
}
$("document").ready(function() {
            animate();

});
