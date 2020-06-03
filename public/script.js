// Packages
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import ZoomToExtent from 'ol/control/ZoomToExtent';
import ImageWMS from 'ol/source/ImageWMS';
import Image from 'ol/layer/Image';
import ImageStatic from 'ol/source/ImageStatic';
import Projection from 'ol/proj/Projection';
import {getCenter} from 'ol/extent';
import moment from 'moment';

// Static Assets
import './style.css';
import {CONSTANTS} from './constants.js';

// Static Image Assets
import concentrationLegend from './assets/concentration_legend.png';
import nNoData from './assets/n_nodata.png';
import sNoData from './assets/s_nodata.png';


// Save static assets in an object for access
const noDataImages = {
  'n': nNoData,
  's': sNoData,
};

const STATE = {
  stop: true,
  rate: 100,
  current: moment(),
  start: moment(),
  end: moment(),
  dataType: 'extent',
  hemi: 'n',
  temporality: 'daily',
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
let projection;
const validDates = [];
/** Main function run to start animation */
async function main() { // eslint-disable-line no-unused-vars
  const gcr = CONSTANTS.getCapabilities;
  const requestHTTP = `${gcr.server}service=${gcr.service}&version=${gcr.version}&request=${gcr.request}`;
  const getCapabilities = await runXMLHTTPRequest(requestHTTP);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(getCapabilities, 'text/xml');
  // Get layer tags in GetCapabilities XML
  const layers = xmlDoc.getElementsByTagName('Layer');
  for (let i = 0; i < layers.length; i++) { // Loop through all layer tags
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
  let sourceType = 'monthly';
  if (STATE.temporality == 'daily') {
    sourceType = 'daily';
  }
  const wmsParams = {
    LAYERS: 'NSIDC:g02135_' + STATE.dataType+ `_raster_${sourceType}_` + STATE.hemi,
    SRS: getLocationParams().srs,
    BBOX: getLocationParams().locationVal,
    TILED: false,
    format: 'image/png',
    TIME: STATE.current.format('YYYY-MM-DD'),
    STYLES: 'NSIDC:g02135_' + STATE.dataType+ '_raster_basemap',
  };
  await updateWMSLayerParams(map.getLayers().getArray()[0], wmsParams);
}

/** Initiaties the input values and the map */
async function init() {
  $('input:radio[name=ext-con]').val(['extent']);// Default values
  $('input:radio[name=n-s]').val(['n']);
  $('input:radio[name=dates]').val(['daily']);
  document.querySelector('input[name="sDate"]').value = DEFAULTS[STATE.temporality].start.format('YYYY-MM-DD');
  document.querySelector('input[name="eDate"]').value = DEFAULTS[STATE.temporality].end.format('YYYY-MM-DD');
  $('#legend').attr('src', concentrationLegend);

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
  const zoomToExtentControl = new ZoomToExtent({
    extent: getLocationParams().extent,
    size: [5, 5],
  });
  map.addControl(zoomToExtentControl);// Add control to reset view


  STATE.stop = true;
  $('#pauseAnimation').html('Start Animation');
  $('#date').html(STATE.current.format('YYYY-MM-DD'));
  $('#mapAlert').html('');

  $('#playButton').click(function() {// When animation button is clicked
    if (STATE.stop) {
      STATE.stop = false;// Start animation
      $('#playButton').addClass('pause');
      $('#playButton').removeClass('play');
    } else {
      STATE.stop = true;
      $('#playButton').addClass('play');
      $('#playButton').removeClass('pause');
    }
  });
  $('#prevFrame').click(function() {// When animation button is clicked
    if (!STATE.stop) {
      STATE.stop = true;
      $('#playButton').addClass('play');
      $('#playButton').removeClass('pause');
    }
    previousDate();
    loadWMS(map, projection);
  });
  $('#nextFrame').click(function() {// When animation button is clicked
    if (!STATE.stop) {
      STATE.stop = true;
      $('#playButton').addClass('play');
      $('#playButton').removeClass('pause');
    }
    nextDate();
    loadWMS(map, projection);
  });
  $('#firstFrame').click(function() {// When animation button is clicked
    if (!STATE.stop) {
      STATE.stop = true;
      $('#playButton').addClass('play');
      $('#playButton').removeClass('pause');
    }
    STATE.current = moment(STATE.start);
    loadWMS(map, projection);
  });
  $('#lastFrame').click(async function() {// When animation button is clicked
    if (!STATE.stop) {
      STATE.stop = true;
      $('#playButton').addClass('play');
      $('#playButton').removeClass('pause');
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
      if (!validDate()) {
        setNoDataOverlay('No Data');
      } else {
        clearMapOverlay();
      }
      await sleep(STATE.rate);
    } else {
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
  STATE.dataType = $('input[name=ext-con]:checked').val();
  // Get value for extent or concentration
  STATE.hemi = $('input[name=n-s]:checked').val();
  // Get value for North or South
  STATE.temporality = $('input[name=dates]:checked').val();
  // Get value for the looping style
  STATE.start = moment(document.querySelector('input[name="sDate"]').value);
  STATE.end = moment(document.querySelector('input[name="eDate"]').value);
  if (oldHemisphere != STATE.hemi) {
    const wmsParams = getWMSParams();
    $('#map').html('');// Empty map when a new animation occurs
    projection = getProjection();
    map = getMap(projection);
    map.addLayer(createLayer());
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

/** Method to go to the previous date for the animation*/
function previousDate() {
  if (STATE.temporality == 'monthly') {
    STATE.current.subtract(1, 'M');
    STATE.current.set({'date': 1});
  } else if (STATE.temporality == 'samemonth') {
    STATE.current.subtract(1, 'y');
    STATE.current.month(STATE.monthLoop);
    STATE.current.set({'date': 1});
  } else {
    STATE.current.subtract(1, 'd');
  }
  if (STATE.current.isBefore(STATE.start)) {
    STATE.current = moment(STATE.end);
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
  map.addLayer(createLayer());
  updateWMSLayerParams(map.getLayers().getArray()[0], wmsParams);
}

/** Method to create a projection for a map
 * @return {projection} projection
 */
function getProjection() {
  const projection = new Projection({// Map projection
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
  const source = new ImageWMS({
    url: 'https://nsidc.org/api/mapservices/NSIDC/wms',
    params: wmsParams,
    serverType: 'geoserver',
  });

  const layer = new Image({source});
  return layer;
}

/** Method to create a map
 * @return {map} Map
 * @param {projection} projection - The Projection to create the map with
 */
function getMap(projection) {
  const extent = getLocationParams().extent;
  const map = new Map({ // New map
    target: 'map', // Div in which the map is displayed
    view: new View({
      projection: projection,
      center: getCenter(extent), // Start in the center of the image
      zoom: 1,
      minZoom: 1,
      extent: extent,
    }),
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
      $('#date').html(STATE.current.format('YYYY-MM-DD'));
      // Wait for map to be ready to change the date tag
      resolve();
    });
  });
}

/** Method to read a json file (Leaving in despite not being used because it may come up in the future)
 * @param {string} filename - The file to be read
 * @return {string} - The json read from the file
 */
function readJSON(filename) { // eslint-disable-line no-unused-vars
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
  return {
    LAYERS: 'NSIDC:g02135_' + STATE.dataType + `_raster_${sourceType}_` + STATE.hemi,
    SRS: getLocationParams().srs,
    BBOX: getLocationParams().locationVal,
    TILED: false,
    format: 'image/png',
    TIME: STATE.current.format('YYYY-MM-DD'),
    STYLES: 'NSIDC:g02135_' + STATE.dataType + '_raster_basemap',
  };
}

/** Method to set the visibility of the legend
 * @param {string} dataType - Sets the extent or concentration setting
 */
function toggleLegend() {
  if (STATE.dataType == 'extent') {
    $('#legend').addClass('hidden');
  }
  if (STATE.dataType == 'concentration') {
    $('#legend').removeClass('hidden');
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
  const source = new ImageStatic({
    url: noDataImages[STATE.hemi],
    serverType: 'geoserver',
    projection: map.getView().getProjection(),
    imageExtent: CONSTANTS[STATE.hemi].extent,
  });

  const layer = new Image({source});
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

main();
