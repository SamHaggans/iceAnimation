let CONSTANTS;
const STATE = {
  stop: true,
  rate: 100,
  current: moment(),
  start: moment(),
  end: moment(),
  extCon: 'extent',
  norSouth: 'n',
  dateLoopStyle: 'daily',
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
async function main() {
  CONSTANTS = await readJSON('constants.json');
  const gcr = CONSTANTS.getCapabilities;
  const getCapabilities = await runXMLHTTPRequest(`${gcr.server}?service=${gcr.service}&version=${gcr.version}&request=${gcr.request}`);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(getCapabilities, 'text/xml');
  const layers = xmlDoc.getElementsByTagName('Layer'); // Get layer tags in GetCapabilities XML
  for (i = 0; i < layers.length; i++) { // Loop through all layer tags
    try {
      const datesArray = layers[i].getElementsByTagName('Extent')[0].textContent.split(',');// Find the first (only) extent (dates) tag
      validDates[layers[i].getElementsByTagName('Name')[0].textContent] = datesArray;// Add the extents to the state object
    } catch (error) {
      // Layer without extent tag, which means it is not relevant
    }
  }

  // Set default settings into the selectors and some other starting values
  init();

  $('#animate').click(function() {// When animation button is clicked
    if (STATE.stop) {
      STATE.stop = false;// Start animation
      $('#animate').html('Stop Animation');
    } else {
      STATE.stop = true;
      $('#animate').html('Start Animation');
    }
  });
}
/** Initiaties the input values and the map */
async function init() {
  $('input:radio[name=ext-con]').val(['extent']);// Default values
  $('input:radio[name=n-s]').val(['n']);
  $('input:radio[name=dates]').val(['daily']);
  document.querySelector('input[name="sDate"]').value = DEFAULTS[STATE.dateLoopStyle].start.format('YYYY-MM-DD');
  document.querySelector('input[name="eDate"]').value = DEFAULTS[STATE.dateLoopStyle].end.format('YYYY-MM-DD');
  $('#map').html('');// Empty map when a new animation occurs
  const timeNow = moment();
  $('#startingText').html(`Starting Date (1978-${timeNow.year()}):`);
  $('#endingText').html(`Ending Date (1978-${timeNow.year()}):`);

  projection = getProjection();
  map = getMap(projection);
  map.addLayer(createLayer());
  await updateState();

  STATE.current = moment(STATE.start);
  map.getLayers().getArray()[0].setZIndex(1000);// loading on top
  const zoomToExtentControl = new ol.control.ZoomToExtent({
    extent: getLocationParams().extent,
    size: [10, 10],
  });
  map.addControl(zoomToExtentControl);// Add control to reset view


  STATE.stop = true;
  $('#pauseAnimation').html('Start Animation');
  $('#date').html(STATE.current.format('YYYY-MM-DD'));
  clearMapText();
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
      if (!validDate()) {
        setMapText('No Data');
      } else {
        clearMapText();
      }
      await sleep(STATE.rate);
    } else {
      await sleep(50);
    }
  }
}

/** Method to update the state of the loop
 * @return {array} - An array containing the map and projection objects
 * @param {map} map - The map to be used
 * @param {projection} projection - The projection to be used
*/
function getState(map, projection) {
  const oldHemisphere = STATE.norSouth;
  const oldMode = STATE.dateLoopStyle;
  STATE.extCon = $('input[name=ext-con]:checked').val();
  // Get value for extent or concentration
  STATE.norSouth = $('input[name=n-s]:checked').val();
  // Get value for North or South
  STATE.dateLoopStyle = $('input[name=dates]:checked').val();
  // Get value for the looping style
  STATE.start = moment(document.querySelector('input[name="sDate"]').value);
  STATE.end = moment(document.querySelector('input[name="eDate"]').value);
  if (oldHemisphere != STATE.norSouth) {
    const wmsParams = getWMSParams();
    $('#map').html('');// Empty map when a new animation occurs
    projection = getProjection();
    map = getMap(projection);
    map.addLayer(createLayer());
    updateWMSLayerParams(map.getLayers().getArray()[0], wmsParams);
  }
  if (oldMode != STATE.dateLoopStyle) {
    document.querySelector('input[name="sDate"]').value = DEFAULTS[STATE.dateLoopStyle].start.format('YYYY-MM-DD');
    document.querySelector('input[name="eDate"]').value = DEFAULTS[STATE.dateLoopStyle].end.format('YYYY-MM-DD');
    STATE.start = moment(document.querySelector('input[name="sDate"]').value);
    STATE.current = moment(STATE.start);
    STATE.end = moment(document.querySelector('input[name="eDate"]').value);
  }
  return [map, projection];
}

/** Method to go to the next date for the animation*/
function nextDate() {
  if (STATE.dateLoopStyle == 'monthly') {
    STATE.current.add(1, 'M');
    STATE.current.set({'date': 1});
  } else {
    STATE.current.add(1, 'd');
  }
  if (STATE.current.isAfter(STATE.end)) {
    STATE.current= moment(STATE.start);
  }
  if (STATE.current.isBefore(STATE.start)) {
    STATE.current= moment(STATE.start);
  }
}
/** Method to update the state of the loop*/
function updateState() {
  STATE.extCon = $('input[name=ext-con]:checked').val();
  // Get value for extent or concentration
  STATE.norSouth = $('input[name=n-s]:checked').val();
  // Get value for North or South
  STATE.dateLoopStyle = $('input[name=dates]:checked').val();
  // Get value for the looping style
  STATE.start = moment(document.querySelector('input[name="sDate"]').value);
  STATE.end = moment(document.querySelector('input[name="eDate"]').value);
  STATE.current = moment(STATE.start);
  const wmsParams = getWMSParams();
  $('#map').html('');// Empty map when a new animation occurs
  projection = getProjection();
  map = getMap(projection);
  map.addLayer(createLayer());
  updateWMSLayerParams(map.getLayers().getArray()[0], wmsParams);
}

/** Method to create a projection for a map
 * @return {projection} projection
 */
function getProjection() {
  const projection = new ol.proj.Projection({// Map projection
    code: CONSTANTS[STATE.norSouth].srs,
    extent: CONSTANTS[STATE.norSouth].extent,
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
  const extent = CONSTANTS[STATE.norSouth].extent;// Map size
  // var extent = [0,0,0,0];
  $('#map').css('width', CONSTANTS[STATE.norSouth].css.width);
  $('#map').css('height', CONSTANTS[STATE.norSouth].css.height);
  $('#mapContainer').css('width', CONSTANTS[STATE.norSouth].css.width);
  $('#mapContainer').css('height', CONSTANTS[STATE.norSouth].css.height);
  $('#mapAlert').css('left', CONSTANTS[STATE.norSouth].css.width*0.30);
  $('#mapAlert').css('top', CONSTANTS[STATE.norSouth].css.height*0.7);
  const locationVal = CONSTANTS[STATE.norSouth].locationVal;
  const width = CONSTANTS[STATE.norSouth].width;
  const height = CONSTANTS[STATE.norSouth].height;
  const srs = CONSTANTS[STATE.norSouth].srs;// Location for request url
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
      $('#date').html(STATE.current.format('YYYY-MM-DD'));
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
  if (STATE.dateLoopStyle == 'daily') {
    sourceType = 'daily';
  }
  return {
    LAYERS: 'NSIDC:g02135_' + STATE.extCon + `_raster_${sourceType}_` + STATE.norSouth,
    SRS: getLocationParams().srs,
    BBOX: getLocationParams().locationVal,
    TILED: false,
    format: 'image/png',
    TIME: STATE.current.format('YYYY-MM-DD'),
    STYLES: 'NSIDC:g02135_' + STATE.extCon + '_raster_basemap',
  };
}

/** Method to set the visibility of the legend
 * @param {string} extCon - Sets the extent or concentration setting
 */
function toggleLegend() {
  if (STATE.extCon == 'extent') {
    $('#legend').addClass('hidden');
  }
  if (STATE.extCon == 'concentration') {
    $('#legend').removeClass('hidden');
  }
}


/** Method to clear the text covering the map */
function clearMapText() {
  $('#mapAlert').html('');
}

/** Method to set the text covering the map
 * @param {string} text - Text to put over map
*/
function setMapText(text) {
  $('#mapAlert').html(text);
}

/** Method to set the text covering the map
 * @return {booleab} - Valid date or not
*/
function validDate() {
  // Get the key (layername) for searching the valid layers object
  const objectKey = `g02135_${STATE.extCon}_raster_${STATE.dateLoopStyle}_${STATE.norSouth}`;
  // Return whether or not the current date is in the queried layer
  return (validDates[objectKey].includes(STATE.current.utc().startOf('day').toISOString()));
}
