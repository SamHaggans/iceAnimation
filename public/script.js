let CONSTANTS;
const STATE = {
  stop: true,
  rate: 100,
  current: moment(),
  start: moment(),
  end: moment(),
  dataType: 'extent',
  hemi: 'n',
  temporality: 'daily',
  yearLoop: false,
  validDates: {},
};

const DEFAULTS = {
  daily: {
    start: moment().year(1978).month(9).date(26),
    end: moment().subtract(2, 'days'),
  },
  monthly: {
    start: moment().year(1978).month(10).startOf('month'),
    end: moment().subtract(1, 'months').subtract(2, 'days').startOf('month'),
  },
};

let map;
const validDates = [];
/** Main function run to start animation */
async function main() { // eslint-disable-line no-unused-vars
  CONSTANTS = await readJSON('constants.json');
  const gcr = CONSTANTS.getCapabilities;
  const requestHTTP = `${gcr.server}service=${gcr.service}&version=${gcr.version}&request=${gcr.request}`;
  const getCapabilities = await runXMLHTTPRequest(requestHTTP);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(getCapabilities, 'text/xml');
  // Get layer tags in GetCapabilities XML
  const layers = xmlDoc.getElementsByTagName('Layer');
  for (i = 0; i < layers.length; i++) { // Loop through all layer tags
    try {
      // Find the first (only) extent (dates) tag
      const datesArray = layers[i].getElementsByTagName('Extent')[0].textContent.split(',');
      // Add the extents to the state object
      validDates[layers[i].getElementsByTagName('Name')[0].textContent] = datesArray;
    } catch (error) {
      // Layer without extent tag, which means it is not relevant
    }
  }

  // Set default settings into the selectors and some other starting values
  init();
}
/** Method to load the wms with the current params
 * @return {array} - An array containing the map and projection objects
 * @param {map} map - The map to be used
 * @param {projection} projection - The projection to be used
*/
async function loadWMS(map, projection) {
  [map, projection] = await getState(map, projection);
  const wmsParams = getWMSParams();
  await updateWMSLayerParams(map.getLayers().getArray()[0], wmsParams);
}

/** Initiaties the input values and the map */
async function init() {
  $('input:radio[name=ext-con]').val(['extent']);// Default values
  $('input:radio[name=n-s]').val(['n']);
  $('input:radio[name=dates]').val(['daily']);
  $('#yearLoop').prop('checked', false);
  document.querySelector('input[name="sDate"]').value = DEFAULTS[STATE.temporality].start.format('YYYY-MM-DD');
  document.querySelector('input[name="eDate"]').value = DEFAULTS[STATE.temporality].end.format('YYYY-MM-DD');
  $('#map').html('');// Empty map when a new animation occurs

  const timeNow = moment();
  $('#startingText').html(`Starting Date (1978-${timeNow.year()}):`);
  $('#endingText').html(`Ending Date (1978-${timeNow.year()}):`);


  projection = getProjection();
  map = getMap(projection);
  map.addLayer(createLayer());

  const zoomToExtentControl = new ol.control.ZoomToExtent({
    extent: getLocationParams().extent,
    size: [5, 5],
  });
  map.addControl(zoomToExtentControl);// Add control to reset view
  $('.ol-zoom-extent button').html('');
  await updateState();

  STATE.current = moment(STATE.start);

  STATE.stop = true;
  $('#pauseAnimation').html('Start Animation');
  $('#date').html(STATE.current.format('YYYY-MM-DD'));
  $('#mapAlert').html('');

  $('#playButton').click(function() {// When animation button is clicked
    if (STATE.stop) {
      STATE.stop = false;// Start animation
      $('#playButton').addClass('fa-pause');
      $('#playButton').removeClass('fa-play');
    } else {
      STATE.stop = true;
      $('#playButton').addClass('fa-play');
      $('#playButton').removeClass('fa-pause');
    }
  });
  $('#prevFrame').click(function() {// When animation button is clicked
    if (!STATE.stop) {
      STATE.stop = true;
      $('#playButton').addClass('fa-play');
      $('#playButton').removeClass('fa-pause');
    }
    previousDate();
    loadWMS(map, projection);
  });
  $('#nextFrame').click(function() {// When animation button is clicked
    if (!STATE.stop) {
      STATE.stop = true;
      $('#playButton').addClass('fa-play');
      $('#playButton').removeClass('fa-pause');
    }
    nextDate();
    loadWMS(map, projection);
  });
  $('#firstFrame').click(function() {// When animation button is clicked
    if (!STATE.stop) {
      STATE.stop = true;
      $('#playButton').addClass('fa-play');
      $('#playButton').removeClass('fa-pause');
    }
    STATE.current = moment(STATE.start);
    loadWMS(map, projection);
  });
  $('#lastFrame').click(async function() {// When animation button is clicked
    if (!STATE.stop) {
      STATE.stop = true;
      $('#playButton').addClass('fa-play');
      $('#playButton').removeClass('fa-pause');
    }
    STATE.current = moment(STATE.end);
    loadWMS(map, projection);
  });

  animationLoop();
}

/** Actual animation loop
 * @param {map} map - The map object to animate
*/
async function animationLoop() {
  while (true) {
    if (!STATE.stop) {
      nextDate();
      [map, projection] = await getState(map, projection);
      const wmsParams = getWMSParams();
      STATE.rate = 2000 - $('#speedSlider').val();
      await updateWMSLayerParams(map.getLayers().getArray()[0], wmsParams);
      await sleep(STATE.rate);
    } else {
      [map, projection] = await getState(map, projection);
      const wmsParams = getWMSParams();
      STATE.rate = 2000 - $('#speedSlider').val();
      await updateWMSLayerParams(map.getLayers().getArray()[0], wmsParams);
      await sleep(50);
    }
  }
}

/** Method to get the state of the loop
 * @return {array} - An array containing the map and projection objects
 * @param {map} map - The map to be used
 * @param {projection} projection - The projection to be used
*/
function getState(map, projection) {
  const oldHemisphere = STATE.hemi;
  const oldMode = STATE.temporality;
  // Get value for extent or concentration
  STATE.dataType = $('input[name=ext-con]:checked').val();
  // Get value for North or South
  STATE.hemi = $('input[name=n-s]:checked').val();
  // Get value for the looping style
  STATE.temporality = $('input[name=dates]:checked').val();
  // Get the value for the yearLoop option
  STATE.yearLoop = $('#yearLoop').is(':checked');
  STATE.start = moment(document.querySelector('input[name="sDate"]').value);
  STATE.end = moment(document.querySelector('input[name="eDate"]').value);
  if (oldHemisphere != STATE.hemi) {
    const wmsParams = getWMSParams();
    $('#map').html('');// Empty map when a new animation occurs
    projection = getProjection();
    map = getMap(projection);
    map.addLayer(createLayer());
    const zoomToExtentControl = new ol.control.ZoomToExtent({
      extent: getLocationParams().extent,
      size: [5, 5],
    });
    map.addControl(zoomToExtentControl);// Add control to reset view
    $('.ol-zoom-extent button').html('');
    updateWMSLayerParams(map.getLayers().getArray()[0], wmsParams);
  }
  if (oldMode != STATE.temporality) {
    document.querySelector('input[name="sDate"]').value = DEFAULTS[STATE.temporality].start.format('YYYY-MM-DD');
    document.querySelector('input[name="eDate"]').value = DEFAULTS[STATE.temporality].end.format('YYYY-MM-DD');
    STATE.start = moment(document.querySelector('input[name="sDate"]').value);
    STATE.current = moment(STATE.start);
    STATE.end = moment(document.querySelector('input[name="eDate"]').value);
  }
  return [map, projection];
}

/** Method to go to the next date for the animation*/
function nextDate() {
  if (STATE.temporality == 'monthly') {
    if (STATE.yearLoop) {
      STATE.current.add(1, 'y');
    } else {
      STATE.current.add(1, 'M');
    }
    STATE.current.set({'date': 1});
  } else {
    if (STATE.yearLoop) {
      STATE.current.add(1, 'y');
    } else {
      STATE.current.add(1, 'd');
    }
  }
  if (!STATE.yearLoop) {
    if (STATE.current.isAfter(STATE.end)) {
      STATE.current = moment(STATE.start);
    }
    if (STATE.current.isBefore(STATE.start)) {
      STATE.current = moment(STATE.start);
    }
  } else {
    if (STATE.current.isAfter(STATE.end)) {
      STATE.current.set({'year': STATE.start.year()});
      while (STATE.current.isBefore(STATE.start)) {
        STATE.current.add(1, 'y');
      }
    }
    if (STATE.current.isBefore(STATE.start)) {
      STATE.current.set({'year': STATE.start.year()});
      while (STATE.current.isBefore(STATE.start)) {
        STATE.current.add(1, 'y');
      }
    }
  }
  if (!validDate()) {
    nextDate();
  }
}

/** Method to go to the previous date for the animation*/
function previousDate() {
  if (STATE.temporality == 'monthly') {
    if (STATE.yearLoop) {
      STATE.current.subtract(1, 'y');
    } else {
      STATE.current.subtract(1, 'M');
    }
    STATE.current.set({'date': 1});
  } else {
    if (STATE.yearLoop) {
      STATE.current.subtract(1, 'y');
    } else {
      STATE.current.subtract(1, 'd');
    }
  }
  if (!STATE.yearLoop) {
    if (STATE.current.isBefore(STATE.start)) {
      STATE.current = moment(STATE.end);
    }
  } else {
    if (STATE.current.isBefore(STATE.start)) {
      STATE.current.set({'year': STATE.end.year()});
      while (STATE.current.isAfter(STATE.end)) {
        STATE.current.subtract(1, 'y');
      }
    }
  }
  if (!validDate()) {
    previousDate();
  }
}

/** Method to update the state of the loop*/
function updateState() {
  STATE.dataType = $('input[name=ext-con]:checked').val();
  // Get value for extent or concentration
  STATE.hemi = $('input[name=n-s]:checked').val();
  // Get value for North or South
  STATE.temporality = $('input[name=dates]:checked').val();
  // Get value for the looping style
  STATE.start = moment(document.querySelector('input[name="sDate"]').value);
  STATE.end = moment(document.querySelector('input[name="eDate"]').value);
  STATE.current = moment(STATE.start);
  const wmsParams = getWMSParams();
  $('#map').html('');// Empty map when a new animation occurs
  projection = getProjection();
  map = getMap(projection);
  const zoomToExtentControl = new ol.control.ZoomToExtent({
    extent: getLocationParams().extent,
    size: [5, 5],
  });
  map.addControl(zoomToExtentControl);// Add control to reset view
  $('.ol-zoom-extent button').html('');
  map.addLayer(createLayer());
  updateWMSLayerParams(map.getLayers().getArray()[0], wmsParams);
}

/** Method to create a projection for a map
 * @return {projection} projection
 */
function getProjection() {
  const projection = new ol.proj.Projection({// Map projection
    code: CONSTANTS[STATE.hemi].srs,
    extent: CONSTANTS[STATE.hemi].extent,
  });
  return projection;
}

/** Method to create a layer for a map
 * @return {layer} layer
 */
function createLayer() {
  const wmsParams = getWMSParams();
  const source = new ol.source.ImageWMS({
    url: 'https://nsidc.org/api/mapservices/NSIDC/wms',
    params: wmsParams,
    serverType: 'geoserver',
  });

  const layer = new ol.layer.Image({source});
  return layer;
}

/** Method to create a map
 * @return {map} Map
 * @param {projection} projection - The Projection to create the map with
 */
function getMap(projection) {
  const extent = getLocationParams().extent;
  const map = new ol.Map({ // New map
    target: 'map', // Div in which the map is displayed
    view: new ol.View({
      projection: projection,
      center: ol.extent.getCenter(extent), // Start in the center of the image
      zoom: 0,
      minZoom: 0,
      extent: extent,
    }),
    controls: ol.control.PanZoom,
  });
  return map;
}

/** Method to create a map
 * @return {object} The parameters
 */
function getLocationParams() {
  const extent = CONSTANTS[STATE.hemi].extent;// Map size
  // var extent = [0,0,0,0];

  $('#map').css('width', CONSTANTS[STATE.hemi].css.width);
  $('#map').css('height', CONSTANTS[STATE.hemi].css.height);
  $('#mapContainer').css('width', CONSTANTS[STATE.hemi].css.width);
  $('#mapContainer').css('height', CONSTANTS[STATE.hemi].css.height);
  $('#legendContainer').css('width', CONSTANTS[STATE.hemi].css.width);
  $('#mapAlert').css('left', CONSTANTS[STATE.hemi].css.width*0.30);
  $('#mapAlert').css('top', CONSTANTS[STATE.hemi].css.height*0.7);
  const locationVal = CONSTANTS[STATE.hemi].locationVal;
  const width = CONSTANTS[STATE.hemi].width;
  const height = CONSTANTS[STATE.hemi].height;
  const srs = CONSTANTS[STATE.hemi].srs;// Location for request url

  return {extent: extent, locationVal: locationVal, width: width, height: height, srs: srs};
}

/** Method to update the map layers
 * @param {layer} layer - The layer to be updated
 * @param {object} params - The parameters to be updated
 * @return {promise} - A promise of updating the layer
 */
function updateWMSLayerParams(layer, params) {
  toggleLegend();
  return new Promise(function(resolve, reject) {
    const source = layer.getSource();
    source.updateParams(params);
    source.refresh();
    map.once('rendercomplete', function(event) {
      if (STATE.temporality == 'daily') {
        $('#date').html(STATE.current.format('YYYY-MM-DD'));
      } else {
        $('#date').html(STATE.current.format('YYYY-MM'));
      }
      // Wait for map to be ready to change the date tag
      resolve();
    });
  });
}

/** Method to read a json file
 * @param {string} filename - The file to be read
 * @return {string} - The json read from the file
 */
function readJSON(filename) {
  return new Promise(function(resolve, reject) {
    const request = new XMLHttpRequest();
    request.overrideMimeType('application/json');
    request.open('GET', filename, true);
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == '200') {
        resolve(JSON.parse(request.responseText));
      }
    };
    request.send(null);
  });
}

/** Method to read a json file
 * @param {string} url - Request url
 * @return {string} - The returned information
*/
function runXMLHTTPRequest(url) {
  return new Promise(function(resolve, reject) {
    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == '200') {
        resolve(request.responseText);
      }
    };
    request.send(null);
  });
}

/** Method to sleep for a set time in ms
    return new Promise(resolve => setTimeout(resolve, ms));
 * @param {int} ms - Milliseconds to sleep for
}
 * @return {promise} - A promise that can be awaited for the specified time
 */
function sleep(ms) { // Sleep function for pauses between frames
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Method to set the wms parameters
 * @return {object} wmsParameters
 */
function getWMSParams() {
  let sourceType = 'monthly';
  if (STATE.temporality == 'daily') {
    sourceType = 'daily';
  }
  const basemap = 'NSIDC:g02135_' + STATE.dataType+ '_raster_basemap';
  const withMissing = 'NSIDC:g02135_' + STATE.dataType+ '_raster_with_missing';

  return {
    LAYERS: 'NSIDC:g02135_' + STATE.dataType + `_raster_${sourceType}_` + STATE.hemi,
    SRS: getLocationParams().srs,
    BBOX: getLocationParams().locationVal,
    TILED: false,
    format: 'image/png',
    TIME: STATE.current.format('YYYY-MM-DD'),
    STYLES: [basemap, withMissing],
  };
}

/** Method to set the visibility of the legend
 * @param {string} dataType - Sets the extent or concentration setting
 */
function toggleLegend() {
  if (STATE.dataType == 'extent') {
    $('#legend').attr('src', 'extent_legend.png');
  }
  if (STATE.dataType == 'concentration') {
    $('#legend').attr('src', 'concentration_legend.png');
  }
}


/** Method to clear the text covering the map */
function clearMapOverlay() {
  map.removeLayer(map.getLayers().getArray()[1]);
}

/** Method to set the text covering the map
 * @param {string} text - Text to put over map
*/
function setNoDataOverlay(text) {
  const source = new ol.source.ImageStatic({
    url: `${STATE.hemi}_nodata.png`,
    serverType: 'geoserver',
    projection: map.getView().getProjection(),
    imageExtent: CONSTANTS[STATE.hemi].extent,
  });

  const layer = new ol.layer.Image({source});
  map.addLayer(layer);
}

/** Method to set the text covering the map
 * @return {booleab} - Valid date or not
*/
function validDate() {
  // Get the key (layername) for searching the valid layers object
  const objectKey = `g02135_${STATE.dataType}_raster_${STATE.temporality}_${STATE.hemi}`;
  // Return whether or not the current date is in the queried layer
  return (validDates[objectKey].includes(STATE.current.utc().startOf('day').toISOString()));
}
