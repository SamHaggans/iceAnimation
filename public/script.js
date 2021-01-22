// Packages
import $ from 'jquery';
window.jQuery = $;
window.$ = $;

import * as util from './mapUtil.js';

import moment from 'moment';

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

const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const STATE = {
  stop: true,
  rate: 100,
  current: moment(),
  start: moment(),
  end: moment(),
  startYear: moment(),
  endYear: moment(),
  dataType: 'extent',
  hemi: 'n',
  temporality: 'daily',
  yearLoop: false,
  validDates: [],
};

const DEFAULTS = {
  daily: {
    start: moment().year(1978).month(9).date(26),
    end: moment(),
  },
  monthly: {
    start: moment().year(1978).month(10).startOf('month'),
    end: moment(),
  },
};

let map;
let projection;

/** Start animation */
async function main() {
  // Run GetCapabilies request to load available dates and load into STATE
  STATE.validDates = await getValidDatesFromGetCapabilities();

  // Set default settings into the selectors and some other starting values
  init();

  // Run main animation loop
  animationLoop();
}

/** Initiate the input values and the map */
async function init() {
  // Create OpenLayers objects
  resetMap();

  // Set initial date settings from the GetCapabilities data
  setDateSettings();

  // Set default configuration for the animation
  setDefaultConfiguration();

  // Set playhead and timeline action bindings
  setPlayheadBindings();

  await initialMapLoad();

  STATE.current = moment(STATE.start);

  STATE.stop = true;

  $('#date').html(STATE.current.format('YYYY-MM-DD'));

  // Clear loading message
  $('#mapAlert').html('');
}

/** Run the animation loop
 * @param {map} map - The map object to animate
*/
async function animationLoop() {
  while (true) {
    if (!STATE.stop) {
      nextDate();
    }
    [map, projection] = await configureState(map, projection);
    const wmsParams = util.getWMSParams(STATE);
    STATE.rate = 2000 - $('#speedSlider').val();
    await util.updateWMSLayerParams(map, map.getLayers().getArray()[0], wmsParams, STATE);
    await sleep(!STATE.stop ? STATE.rate : 50);
  }
}

/** Read the configuration of the animation and save to STATE
 */
function readConfiguration() {
  STATE.start.hour(0);
  STATE.current.hour(10);
  STATE.end.hour(20);
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
  STATE.startYear = moment(`${document.querySelector('input[name="sYear"]').value}-01-01`);
  STATE.endYear = moment(`${document.querySelector('input[name="eYear"]').value}-12-31`);
  const month = document.querySelector('select[name="monthLoop"]').value;
  $('#dayLoop').attr({'max': daysInMonth[month]});
}

/** Recreate the map and projection objects
 */
function resetMap() {
  $('#map').html('');// Empty map when a new animation occurs
  projection = util.getProjection(STATE);
  map = util.getMap(projection, STATE);
  map.addLayer(util.createLayer(STATE));
}

/** Load and set the state configuration from the user inputs and return the correct map and projection
 * @return {array} - An array containing the map and projection objects
 * @param {map} map - The map to be used
 * @param {projection} projection - The projection to be used
*/
function configureState(map, projection) {
  const oldHemisphere = STATE.hemi;
  const oldTemporality = STATE.temporality;

  readConfiguration();
  if (oldHemisphere != STATE.hemi) {
    resetMap();
    util.loadWMS(map, projection, STATE);
  }
  if (oldTemporality != STATE.temporality) {
    document.querySelector('input[name="sDate"]').value = DEFAULTS[STATE.temporality].start.format('YYYY-MM-DD');
    document.querySelector('input[name="eDate"]').value = DEFAULTS[STATE.temporality].end.format('YYYY-MM-DD');
    STATE.start = moment(document.querySelector('input[name="sDate"]').value);
    STATE.current = moment(STATE.start);
    STATE.end = moment(document.querySelector('input[name="eDate"]').value);
  }
  STATE.start = STATE.start.startOf('day');

  updateCSS();

  generateTimelineScale();

  return [map, projection];
}

/** Generate and set the scale dates for the timeline
 */
function generateTimelineScale() {
  for (let i = 0; i < 5; i++) {
    if (STATE.yearLoop) {
      let firstDate;
      let lastDate;
      [firstDate, lastDate] = getSliderPositioning();

      let totalDays = Math.abs(firstDate.diff(lastDate, 'days') + 1);
      let forwardDays = (totalDays / 4) * i;
      let scaleDate = moment(firstDate).add(forwardDays, 'd');
      $(`#scale${i}`).html(scaleDate.format(
          STATE.temporality == 'monthly' ? 'YYYY-MM' : 'YYYY-MM-DD',
      ));
    } else {
      let totalDays = Math.abs(STATE.start.diff(STATE.end, 'days') + 1);
      let forwardDays = (totalDays / 4) * i;
      let scaleDate = moment(STATE.start).add(forwardDays, 'd');
      $(`#scale${i}`).html(scaleDate.format(
        STATE.temporality == 'monthly' ? 'YYYY-MM' : 'YYYY-MM-DD',
      ));
    }
  }
}

/** Update CSS to reflect STATE
 */
function updateCSS() {
  if (STATE.yearLoop) {
    $('.loopSelection').css('display', 'block');
    $('.dateSelect').css('display', 'none');
    $('.yearSelect').css('display', 'flex');

    if (STATE.temporality == 'monthly') {
      $('#dayLoop').css('display', 'none');
    } else {
      $('#dayLoop').css('display', 'inline');
    }
  } else {
    $('.loopSelection').css('display', 'none');
    $('.dateSelect').css('display', 'flex');
    $('.yearSelect').css('display', 'none');
  }
}

/** Find and move to next date for the animation*/
function nextDate() {
  STATE.start.hour(0);
  STATE.current.hour(10);
  STATE.end.hour(20);
  if (STATE.yearLoop) {
    const dayLoop = document.querySelector('input[name="dayLoop"]').value;
    const monthLoop = document.querySelector('select[name="monthLoop"]').value;
    STATE.current.set({'date': dayLoop});
    STATE.current.set({'month': monthLoop});
  }
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
  }

  if (STATE.yearLoop) {
    let firstDate;
    let lastDate;
    [firstDate, lastDate] = getSliderPositioning();
    const dayLoop = document.querySelector('input[name="dayLoop"]').value;
    const monthLoop = document.querySelector('select[name="monthLoop"]').value;
    if (STATE.current.isBefore(firstDate)) {
      STATE.current.set({'year': lastDate.year()});
    } else if (STATE.current.isAfter(lastDate)) {
      STATE.current.set({'year': firstDate.year()});
    }
    STATE.current.set({'date': dayLoop});
    STATE.current.set({'month': monthLoop});
  }


  if (STATE.yearLoop) {
    const dayLoop = document.querySelector('input[name="dayLoop"]').value;
    const monthLoop = document.querySelector('select[name="monthLoop"]').value;
    STATE.current.set({'date': dayLoop});
    STATE.current.set({'month': monthLoop});
  }
  if (!util.validDateInput(STATE.current, STATE)) {
    nextDate();
  }
}

/** Find and move to previous date for the animation*/
function previousDate() {
  STATE.start.hour(0);
  STATE.current.hour(10);
  STATE.end.hour(20);

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
  }

  if (STATE.yearLoop) {
    let firstDate;
    let lastDate;
    [firstDate, lastDate] = getSliderPositioning();
    const dayLoop = document.querySelector('input[name="dayLoop"]').value;
    const monthLoop = document.querySelector('select[name="monthLoop"]').value;
    if (STATE.current.isBefore(firstDate)) {
      STATE.current.set({'year': lastDate.year()});
    } else if (STATE.current.isAfter(lastDate)) {
      STATE.current.set({'year': firstDate.year()});
    }
    STATE.current.set({'date': dayLoop});
    STATE.current.set({'month': monthLoop});
  }


  if (!util.validDateInput(STATE.current, STATE)) {
    previousDate();
  }
}

/** Initialize the map settings
 * @return {Promise} - Resolves when loading is completed
*/
function initialMapLoad() {
  return new Promise(function(resolve, reject) {
    readConfiguration();
    resetMap();
    util.loadWMS(map, projection, STATE);
    resolve();
  });
}

/** Read a json file
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

/** Run and return an XMLHTTP request
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

/** Pause execution for a set time in ms
 * @param {int} ms - Milliseconds to sleep for
 * @return {promise} - A promise that can be awaited for the specified time
 */
function sleep(ms) { // Sleep function for pauses between frames
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Clear the text covering the map */
function clearMapOverlay() {// eslint-disable-line no-unused-vars
  map.removeLayer(map.getLayers().getArray()[1]);
}

/** Get the positioning of the slider and get the first and last date selectors when in looping mode
 * @return {array} - The first and last dates to be displayed on the slider
*/
function getSliderPositioning() {
  const dayLoop = document.querySelector('input[name="dayLoop"]').value;
  const monthLoop = document.querySelector('select[name="monthLoop"]').value;
  let firstDate = moment();
  firstDate.set({'year': STATE.startYear.year()});
  firstDate.set({'date': dayLoop});
  firstDate.set({'month': monthLoop});

  while (!util.validDateInput(firstDate, STATE)) {
    firstDate.add(1, 'y');
  }

  let lastDate = moment();
  lastDate.set({'year': STATE.endYear.year()});
  lastDate.set({'date': dayLoop});
  lastDate.set({'month': monthLoop});

  while (!util.validDateInput(lastDate, STATE)) {
    lastDate.subtract(1, 'y');
  }

  return [firstDate, lastDate];
}

/** Get the last index of an array
 * @param {Array} arr - Array
 * @return {object} - The last index of the array
 */
function getLast(arr) {
  return (arr[arr.length - 1]);
}

/** Pause animation
 */
function pauseAnimation() {
  if (!STATE.stop) {
    STATE.stop = true;
    $('#playButton').addClass('fa-play');
    $('#playButton').removeClass('fa-pause');
  }
}

/** Run the GetCapabilities request to find available dates
 * @return {Promise} - Promise, resolves when request is complete
 */
function getValidDatesFromGetCapabilities() {
  return new Promise(async function(resolve, reject) {
    const gcr = CONSTANTS.getCapabilities;
    const requestHTTP = `${gcr.server}service=${gcr.service}&version=${gcr.version}&request=${gcr.request}`;
    const getCapabilities = await runXMLHTTPRequest(requestHTTP);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(getCapabilities, 'text/xml');
    const validDates = [];
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
    resolve(validDates);
  });
}
/** Find the ending dates based on the GetCapabilities data and set starting date text
 */
function setDateSettings() {
  // Set the "last" day and month to be the last of the getCapabilities data
  const dailyDates = `g02135_extent_raster_daily_n`;
  const lastDay = getLast(STATE.validDates[dailyDates]).split('T')[0];
  DEFAULTS['daily'].end = moment(lastDay);
  const monthlyDates = `g02135_extent_raster_monthly_n`;
  const lastMonth = getLast(STATE.validDates[monthlyDates]).split('T')[0];
  DEFAULTS['monthly'].end = moment(lastMonth);

  const lastYear = getLast(STATE.validDates[dailyDates]).split('-')[0];
  $('#sYear').attr({'max': lastYear});
  $('#eYear').attr({'max': lastYear, 'value': lastYear});

  document.querySelector('input[name="sDate"]').value = DEFAULTS[STATE.temporality].start.format('YYYY-MM-DD');
  document.querySelector('input[name="eDate"]').value = DEFAULTS[STATE.temporality].end.format('YYYY-MM-DD');
}

/** Set the configuration to default
 */
function setDefaultConfiguration() {
  $('input:radio[name=ext-con]').val(['extent']);// Default values
  $('input:radio[name=n-s]').val(['n']);
  $('input:radio[name=dates]').val(['daily']);
  $('#yearLoop').prop('checked', false);


  $('#legend').attr('src', concentrationLegend);

  $('#map').html('');// Empty map when a new animation occurs

  $('.ol-zoom-extent button').html('');

  const timeNow = moment();

  $('#startingText').html(`Starting Date (1978-${timeNow.year()}):`);
  $('#endingText').html(`Ending Date (1978-${timeNow.year()}):`);
  $('#startingYearText').html(`Starting Year (1978-${timeNow.year()}):`);
  $('#endingYearText').html(`Ending Year (1978-${timeNow.year()}):`);

  $('#attribution').html(`
  © ${timeNow.year()} National Snow and Ice Data Center, University of Colorado Boulder,
  <br>
  Data Source: <a href = "https://nsidc.org/data/G02135">Sea Ice Index</a>
  `);
}

/** Set the action bindings to the playhead controls
 */
function setPlayheadBindings() {
  $('#playButton').click(function() {// When animation button is clicked
    if (STATE.stop) {
      STATE.stop = false;// Start animation
      $('#playButton').addClass('fa-pause');
      $('#playButton').removeClass('fa-play');
    } else {
      pauseAnimation();
    }
  });
  $('#prevFrame').click(function() {// When animation button is clicked
    pauseAnimation();
    previousDate();
    [map, projection] = configureState(map, projection);
    util.loadWMS(map, projection, STATE);
  });
  $('#nextFrame').click(function() {// When animation button is clicked
    pauseAnimation();
    nextDate();
    [map, projection] = configureState(map, projection);
    util.loadWMS(map, projection, STATE);
  });
  $('#firstFrame').click(function() {// When animation button is clicked
    pauseAnimation();
    if (STATE.yearLoop) {
      const dayLoop = document.querySelector('input[name="dayLoop"]').value;
      const monthLoop = document.querySelector('select[name="monthLoop"]').value;

      STATE.current.set({'year': STATE.startYear.year()});
      STATE.current.set({'date': dayLoop});
      STATE.current.set({'month': monthLoop});

      while (!util.validDateInput(STATE.current, STATE)) {
        nextDate();
      }
    } else {
      STATE.current = moment(STATE.start);
      [map, projection] = configureState(map, projection);
      util.loadWMS(map, projection, STATE);
    }
  });
  $('#lastFrame').click(async function() {// When animation button is clicked
    pauseAnimation();
    if (STATE.yearLoop) {
      const dayLoop = document.querySelector('input[name="dayLoop"]').value;
      const monthLoop = document.querySelector('select[name="monthLoop"]').value;

      STATE.current.set({'year': STATE.endYear.year()});
      STATE.current.set({'date': dayLoop});
      STATE.current.set({'month': monthLoop});
      while (!util.validDateInput(STATE.current, STATE)) {
        previousDate();
      }
    } else {
      STATE.current = moment(STATE.end);
      [map, projection] = configureState(map, projection);
      util.loadWMS(map, projection, STATE);
    }
  });
  document.getElementById('info-hover').onclick = function() {
    $('#missing-data-message').toggleClass('hidden');
  };

  $('#closeButton').mouseover(function() {
    $('#closeButton').removeClass('fa-window-close');
    $('#closeButton').addClass('fa-window-close-o');
  });

  $('#closeButton').mouseout(function() {
    $('#closeButton').removeClass('fa-window-close-o');
    $('#closeButton').addClass('fa-window-close');
  });

  document.getElementById('closeButton').onclick = function() {
    $('#missing-data-message').toggleClass('hidden');
  };

  document.getElementById('timeline').value = 1;

  document.getElementById('timeline').oninput = function(e) {
    pauseAnimation();
    let firstDate;
    let lastDate;
    [firstDate, lastDate] = getSliderPositioning();

    const totalDays = Math.abs(firstDate.diff(lastDate, 'days') + 1);
    const sliderVal = $(this).val();
    const selectedTime = (sliderVal / CONSTANTS.timeline.maxValue) * totalDays;
    STATE.current = moment(firstDate).add(selectedTime, 'd');
    if (STATE.yearLoop) {
      const dayLoop = document.querySelector('input[name="dayLoop"]').value;
      const monthLoop = document.querySelector('select[name="monthLoop"]').value;
      STATE.current.set({'date': dayLoop});
      STATE.current.set({'month': monthLoop});
    }

    if (!util.validDateInput(STATE.current, STATE)) {
      nextDate();
    }
  };
}

main();
