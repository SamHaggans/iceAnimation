// Packages
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import moment from 'moment';

import * as mapUtil from './mapUtil.js';
import * as stateUtil from './stateUtil.js';
import * as timeUtil from './timeUtil.js';

// Static Assets
import './style.css';
import {CONSTANTS} from './constants.js';

// Static Image Assets
// import extentLegend from './assets/extent_legend.png';
import concentrationLegend from './assets/concentration_legend.png';

/*
import nNoData from './assets/n_nodata.png';
import sNoData from './assets/s_nodata.png';
*/

/* Save static assets in an object for access (not currently used)
const noDataImages = {
  'n': nNoData,
  's': sNoData,
};
*/

let STATE = {
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

/** Initiaties the input values and the map */
async function init() {
  $('input:radio[name=ext-con]').val(['extent']);// Default values
  $('input:radio[name=n-s]').val(['n']);
  $('input:radio[name=dates]').val(['daily']);
  $('#yearLoop').prop('checked', false);
  document.querySelector('input[name="sDate"]').value = DEFAULTS[STATE.temporality].start.format('YYYY-MM-DD');
  document.querySelector('input[name="eDate"]').value = DEFAULTS[STATE.temporality].end.format('YYYY-MM-DD');

  $('#legend').attr('src', concentrationLegend);

  $('#map').html('');// Empty map when a new animation occurs

  const timeNow = moment();
  $('#startingText').html(`Starting Date (1978-${timeNow.year()}):`);
  $('#endingText').html(`Ending Date (1978-${timeNow.year()}):`);


  projection = mapUtil.getProjection(STATE);
  map = mapUtil.getMap(projection, STATE);
  map.addLayer(mapUtil.createLayer(STATE));

  $('.ol-zoom-extent button').html('');
  [map, projection, STATE] = await stateUtil.updateState(STATE);

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
    stopAnimation();
    STATE = timeUtil.previousDate(STATE, validDates);
    [map, projection, STATE] = stateUtil.getState(map, projection, STATE, DEFAULTS);
    mapUtil.loadWMS(map, projection, STATE);
  });
  $('#nextFrame').click(function() {// When animation button is clicked
    stopAnimation();
    STATE = timeUtil.nextDate(STATE, validDates);
    [map, projection, STATE] = stateUtil.getState(map, projection, STATE, DEFAULTS);
    mapUtil.loadWMS(map, projection, STATE);
  });
  $('#firstFrame').click(function() {// When animation button is clicked
    stopAnimation();
    STATE.current = moment(STATE.start);
    [map, projection, STATE] = stateUtil.getState(map, projection, STATE, DEFAULTS);
    mapUtil.loadWMS(map, projection, STATE);
  });
  $('#lastFrame').click(async function() {// When animation button is clicked
    stopAnimation();
    $('#playButton').removeClass('fa-pause');
    STATE.current = moment(STATE.end);
    [map, projection, STATE] = stateUtil.getState(map, projection, STATE, DEFAULTS);
    mapUtil.loadWMS(map, projection, STATE);
  });

  $('#info-hover').mouseover(function() {
    $('#missing-data-message').removeClass('hidden');
  });

  $('#info-hover').mouseout(function() {
    $('#missing-data-message').addClass('hidden');
  });

  $('#missing-data-message').css('left', `${340 + CONSTANTS[STATE.hemi].css.width}px`);

  animationLoop();
}

/** Actual animation loop
 * @param {map} map - The map object to animate
*/
async function animationLoop() {
  while (true) {
    if (!STATE.stop) {
      debugger;
      STATE = timeUtil.nextDate(STATE, validDates);
      debugger;
      [map, projection, STATE] = await stateUtil.getState(map, projection, STATE, DEFAULTS);
      const wmsParams = mapUtil.getWMSParams(STATE);
      STATE.rate = 2000 - $('#speedSlider').val();
      await mapUtil.updateWMSLayerParams(map, map.getLayers().getArray()[0], wmsParams, STATE);
      await sleep(STATE.rate);
    } else {
      [map, projection, STATE] = await stateUtil.getState(map, projection, STATE, DEFAULTS);
      const wmsParams = mapUtil.getWMSParams(STATE);
      STATE.rate = 2000 - $('#speedSlider').val();
      await mapUtil.updateWMSLayerParams(map, map.getLayers().getArray()[0], wmsParams, STATE);
      await sleep(50);
    }
  }
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

/** Method to clear the text covering the map (currently unused) */
function clearMapOverlay() {// eslint-disable-line no-unused-vars
  map.removeLayer(map.getLayers().getArray()[1]);
}


/** Method to stop the animation when buttons are pressed that should pause it
*/
function stopAnimation() {
  if (!STATE.stop) {
    STATE.stop = true;
    $('#playButton').addClass('fa-play');
    ('#playButton').removeClass('fa-pause');
  }
}

main();
