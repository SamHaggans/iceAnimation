let CONSTANTS;
const STATE = {
  stop: true,
  rate: 100,
  current: moment().year(1990).month(0).day(1),
  start: moment().year(1990).month(0).day(1),
  end: moment().year(2020).month(11).day(31),
  extCon: 'extent',
  norSouth: 'n',
  dateLoopStyle: 'daily',
  monthLoop: 0,
};
let map;
/** Main function run to start animation */
async function main() {
  CONSTANTS = await readJSON('constants.json');
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
  document.querySelector('input[name="sDate"]').value = '1990-01-01';
  document.querySelector('input[name="eDate"]').value = '2020-01-01';
  $('#map').html('');// Empty map when a new animation occurs
  const timeNow = new moment();
  $('#startingText').html(`Starting Date (1979-${timeNow.year()}):`);
  $('#endingText').html(`Ending Date (1979-${timeNow.year()}):`);

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
      let sourceType = 'monthly';
      if (STATE.dateLoopStyle == 'daily') {
        sourceType = 'daily';
      }
      const wmsParams = {
        LAYERS: 'NSIDC:g02135_' + STATE.extCon + `_raster_${sourceType}_` + STATE.norSouth,
        SRS: getLocationParams().srs,
        BBOX: getLocationParams().locationVal,
        TILED: false,
        format: 'image/png',
        TIME: STATE.current.format('YYYY-MM-DD'),
        STYLES: 'NSIDC:g02135_' + STATE.extCon + '_raster_basemap',
      };
      STATE.rate = 2000 - $('#speedSlider').val();
      await updateWMSLayerParams(map.getLayers().getArray()[0], wmsParams);
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
  STATE.extCon = $('input[name=ext-con]:checked').val();
  // Get value for extent or concentration
  STATE.norSouth = $('input[name=n-s]:checked').val();
  // Get value for North or South
  STATE.dateLoopStyle = $('input[name=dates]:checked').val();
  // Get value for the looping style
  STATE.monthLoop = $('select[name=monthsLoop]').val();
  // Month to be repeated if that option is chosen
  STATE.start = moment(document.querySelector('input[name="sDate"]').value);
  STATE.end = moment(document.querySelector('input[name="eDate"]').value);
  if (oldHemisphere != STATE.norSouth) {
    let sourceType = 'monthly';
    if (STATE.dateLoopStyle == 'daily') {
      sourceType = 'daily';
    }
    const wmsParams = {
      LAYERS: 'NSIDC:g02135_' + STATE.extCon + `_raster_${sourceType}_` + STATE.norSouth,
      SRS: getLocationParams().srs,
      BBOX: getLocationParams().locationVal,
      TILED: false,
      format: 'image/png',
      TIME: STATE.current.format('YYYY-MM-DD'),
      STYLES: 'NSIDC:g02135_' + STATE.extCon + '_raster_basemap',
    };
    $('#map').html('');// Empty map when a new animation occurs
    projection = getProjection();
    map = getMap(projection);
    map.addLayer(createLayer());
    updateWMSLayerParams(map.getLayers().getArray()[0], wmsParams);
  }
  return [map, projection];
}

/** Method to go to the next date for the animation*/
function nextDate() {
  if (STATE.dateLoopStyle == 'monthly') {
    STATE.current.add(1, 'M');
    STATE.current.set({'date': 1});
  } else if (STATE.dateLoopStyle == 'samemonth') {
    STATE.current.add(1, 'y');
    STATE.current.month(STATE.monthLoop);
    STATE.current.set({'date': 1});
  } else {
    STATE.current.add(1, 'd');
  }
  if (STATE.current.isAfter(STATE.end)) {
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
  STATE.monthLoop = $('select[name=monthsLoop]').val();
  // Month to be repeated if that option is chosen
  STATE.start = moment(document.querySelector('input[name="sDate"]').value);
  STATE.end = moment(document.querySelector('input[name="eDate"]').value);
  STATE.current = moment(STATE.start);
  console.log(STATE.dateLoopStyle);
  let sourceType = 'monthly';
  if (STATE.dateLoopStyle == 'daily') {
    sourceType = 'daily';
  }
  const wmsParams = {
    LAYERS: 'NSIDC:g02135_' + STATE.extCon + `_raster_${sourceType}_` + STATE.norSouth,
    SRS: getLocationParams().srs,
    BBOX: getLocationParams().locationVal,
    TILED: false,
    format: 'image/png',
    TIME: STATE.current.format('YYYY-MM-DD'),
    STYLES: 'NSIDC:g02135_' + STATE.extCon + '_raster_basemap',
  };
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
  let sourceType = 'monthly';
  if (STATE.dateLoopStyle == 'daily') {
    sourceType = 'daily';
  }
  const wmsParams = {
    LAYERS: 'NSIDC:g02135_' + STATE.extCon + `_raster_${sourceType}_` + STATE.norSouth,
    SRS: getLocationParams().srs,
    BBOX: getLocationParams().locationVal,
    TILED: false,
    format: 'image/png',
    TIME: STATE.current.format('YYYY-MM-DD'),
    STYLES: 'NSIDC:g02135_' + STATE.extCon + '_raster_basemap',
  };
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
      zoom: 1,
      minZoom: 1,
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

/** Method to sleep for a set time in ms
    return new Promise(resolve => setTimeout(resolve, ms));
 * @param {int} ms - Milliseconds to sleep for
}
 * @return {promise} - A promise that can be awaited for the specified time
 */
function sleep(ms) { // Sleep function for pauses between frames
  return new Promise((resolve) => setTimeout(resolve, ms));
}
