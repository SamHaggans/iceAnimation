var stop = false;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async function animate(extCon, norSouth, dates, monthLoop, starting, ending) {
        var displayDates = [];
        $( "#customize :input").prop( "disabled", true );
        $("#map").html("");
        var monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
        var imageURL = '';
        if (norSouth == "n") {
            var extent = [0,0,304,448];
            var locationVal = "-3850000.0,-5350000.0,3750000.0,5850000.0&width=304&height=448&srs=EPSG:3411";
        }
        else {
            var extent = [0,0,730,768];
            var locationVal = "-3950000.0,-3950000.0,3950000.0,4350000.0&width=730&height=768&srs=EPSG:3412";
        }
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
            controls: []
        });
        imageURL = "blank.jpeg";
        map.addLayer(new ol.layer.Image({
            source: new ol.source.ImageStatic({
                url: imageURL,
                projection: projection,
                imageExtent: extent
            })
        }));
        displayDates.push("placeholder");
        for (year = starting[0]; year <= ending[0]; year++) {
            var monthStart = 1;
            var monthEnd = 12;
            if (year == starting[0]) {
                monthStart = starting[1];
            }
            if (year == ending[0]) {
                monthEnd = ending[1];
            }
            if (dates == "SameMonth") {
                monthStart = monthLoop;
                monthEnd = monthLoop;
            }
            for (month = monthStart; month <= monthEnd; month++) {
                var dayStart = 1;
                var dayEnd = monthDays[month-1];
                if (month == starting[1] && year == starting[0]) {
                    dayStart = starting[2];
                }
                if (month == ending[1] && year == ending[0]) {
                    dayEnd = ending[2];
                }
                if (dates == "Monthly" || dates == "SameMonth") {
                   dayEnd = 1;
                   dayStart = 1;
                }
                for (day = dayStart; day <= dayEnd; day++) {
                    if (stop) return;
                    var monthStr = ""+month;  
                    if (month < 10) {
                        monthStr = "0"+month;
                    }
                    var dayStr = ""+day;  
                    if (day < 10) {
                        dayStr = "0"+day;
                    }
                    var yearStr = ""+year;
                    if (map.getLayers().getArray().length < 30) {
                        imageURL = "https://nsidc.org/api/mapservices/NSIDC/wms?service=WMS&version=1.1.0&request=GetMap&layers=NSIDC:g02135_"+extCon+"_raster_daily_"+norSouth+"&styles=NSIDC:g02135_"+extCon+"_raster_basemap&bbox="+locationVal+"&format=image/png&TIME="+yearStr+"-"+monthStr+"-"+dayStr;
                        await map.addLayer(new ol.layer.Image({
                            source: new ol.source.ImageStatic({
                                url: imageURL,
                                projection: projection,
                                imageExtent: extent
                            })
                        }));
                        await displayDates.push("Date: "+yearStr+"-"+monthStr+"-"+dayStr);
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
                        await displayDates.push("Date: "+yearStr+"-"+monthStr+"-"+dayStr);
                        
                        imageURL = "https://nsidc.org/api/mapservices/NSIDC/wms?service=WMS&version=1.1.0&request=GetMap&layers=NSIDC:g02135_"+extCon+"_raster_daily_"+norSouth+"&styles=NSIDC:g02135_"+extCon+"_raster_basemap&bbox="+locationVal+"&format=image/png&TIME="+yearStr+"-"+monthStr+"-"+dayStr;
                        await map.addLayer(new ol.layer.Image({
                            source: new ol.source.ImageStatic({
                                url: imageURL,
                                projection: projection,
                                imageExtent: extent
                            })
                        }));
                        map.removeLayer(map.getLayers().getArray()[0]);
                        map.getLayers().getArray()[0].setZIndex(100);
                        displayDates.splice(0,1);
                        $("#date").html(displayDates[0]);
                        await sleep(2000-Number($("input[name=speed]").val()));
                    }
                }
            }
        }
        while (map.getLayers().getArray().length>1){
            displayDates.splice(0,1);
            $("#date").html(displayDates[0]);
            map.removeLayer(map.getLayers().getArray()[0]);
            map.getLayers().getArray()[0].setZIndex(100);
            await sleep(2000-Number($("input[name=speed]").val()));
        }
        $( "#customize :input").prop( "disabled", false );
    }
    
    
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    function getDisplayDate(y,m,d) {
        var monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
        if (d <= 20) {
            if (m <= 1) {
                return [y-1, 12-(m-1),monthDays[12-(m-1)-1]+d-20];
            }
            return [y, m-1, monthDays[m-2]+d-20];
        }
        return [y,m,d-20];
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
    $("document").ready(async function() {
        $("#animate").click( function() {
            stop = false;
            var extCon = $('input[name=ext-con]:checked').val();
            var norSouth = $('input[name=n-s]:checked').val();
            var dates = $('input[name=dates]:checked').val();
            var monthLoop = $('select[name=monthsLoop]').val();
            var starting = [Number($('input[name=sYear]').val()), Number($('select[name=sMonth]').val()), Number($('input[name=sDay]').val())];
            var ending = [Number($('input[name=eYear]').val()), Number($('select[name=eMonth]').val()), Number($('input[name=eDay]').val())]
            animate(extCon,norSouth,dates,monthLoop,starting,ending);
        });
        $("#stopAnimation").click( function() {
            stop = true;
            $( "#customize :input").prop( "disabled", false );
        });
    });
    