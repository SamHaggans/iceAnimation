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
      STATE.validDates[layers[i].getElementsByTagName('Name')[0].textContent] = datesArray;
    } catch (error) {
      // Layer without extent tag, which means it is not relevant
    }
  }

  // Set default settings into the selectors and some other starting values
  init();
}

/** Initiaties the input values and the map */
async function init() {
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
  $('#startingYearText').html(`Starting Year (1978-${timeNow.year()}):`);
  $('#endingYearText').html(`Ending Year (1978-${timeNow.year()}):`);


  projection = util.getProjection(STATE);
  map = util.getMap(projection, STATE);
  map.addLayer(util.createLayer(STATE));

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
    [map, projection] = getState(map, projection);
    util.loadWMS(map, projection, STATE);
  });
  $('#nextFrame').click(function() {// When animation button is clicked
    if (!STATE.stop) {
      STATE.stop = true;
      $('#playButton').addClass('fa-play');
      $('#playButton').removeClass('fa-pause');
    }
    nextDate();
    [map, projection] = getState(map, projection);
    util.loadWMS(map, projection, STATE);
  });
  $('#firstFrame').click(function() {// When animation button is clicked
    if (!STATE.stop) {
      STATE.stop = true;
      $('#playButton').addClass('fa-play');
      $('#playButton').removeClass('fa-pause');
    }
    if (STATE.yearLoop) {
      let firstDate;
      let lastDate;
      const dayLoop = document.querySelector('input[name="dayLoop"]').value;
      const monthLoop = document.querySelector('select[name="monthLoop"]').value;

      [firstDate, lastDate] = getSliderPositioning();

      STATE.current.set({'year': STATE.startYear.year()});
      STATE.current.set({'date': dayLoop});
      STATE.current.set({'month': monthLoop});

      while (!validDate()) {
        nextDate();
      }
    } else {
      STATE.current = moment(STATE.start);
      [map, projection] = getState(map, projection);
      util.loadWMS(map, projection, STATE);
    }
  });
  $('#lastFrame').click(async function() {// When animation button is clicked
    if (!STATE.stop) {
      STATE.stop = true;
      $('#playButton').addClass('fa-play');
      $('#playButton').removeClass('fa-pause');
    }
    if (STATE.yearLoop) {
      let firstDate;
      let lastDate;
      const dayLoop = document.querySelector('input[name="dayLoop"]').value;
      const monthLoop = document.querySelector('select[name="monthLoop"]').value;

      [firstDate, lastDate] = getSliderPositioning();

      STATE.current.set({'year': STATE.endYear.year()});
      STATE.current.set({'date': dayLoop});
      STATE.current.set({'month': monthLoop});
      while (!validDate()) {
        previousDate();
      }
    } else {
      STATE.current = moment(STATE.end);
      [map, projection] = getState(map, projection);
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

  document.getElementById('timeline').onmouseout = function() {
    $('#hoverDate').addClass('hidden');
  };

  document.getElementById('timeline').value = 1;

  document.getElementById('timeline').onmousemove = function(e) {
    let parentOffset = $(this).offset();
    let relX = (e.pageX - parentOffset.left);

    let firstDate;
    let lastDate;
    let totalDays;
    let hoverDate;
    let selectedTime;
    if (STATE.yearLoop) {
      [firstDate, lastDate] = getSliderPositioning();
      totalDays = Math.abs(firstDate.diff(lastDate, 'days') + 1);
      let timelineXHover = (CONSTANTS.timeline.shiftFactor*(relX/$(this).width() - CONSTANTS.timeline.shiftValue));
      selectedTime = ((timelineXHover * CONSTANTS.timeline.maxValue)/(CONSTANTS.timeline.maxValue)) * totalDays;
      hoverDate = moment(firstDate).add(selectedTime, 'd');
      if (CONSTANTS.timeline.shiftFactor*(relX/$(this).width() - CONSTANTS.timeline.shiftValue) > 1) {
        hoverDate = moment(STATE.end);
      }
    } else {
      totalDays = Math.abs(STATE.start.diff(STATE.end, 'days') + 1);
      let timelineXHover = (CONSTANTS.timeline.shiftFactor*(relX/$(this).width() - CONSTANTS.timeline.shiftValue));
      selectedTime = ((timelineXHover * CONSTANTS.timeline.maxValue)/(CONSTANTS.timeline.maxValue)) * totalDays;
      hoverDate = moment(STATE.start).add(selectedTime, 'd');
      if (timelineXHover > 1) {
        hoverDate = moment(STATE.end);
      }
    }

    console.log(CONSTANTS.timeline.shiftFactor*(relX/$(this).width() - CONSTANTS.timeline.shiftValue));

    console.log(hoverDate);
    $('#hoverDate').removeClass('hidden');
    let left = e.pageX - 100 + 'px';
    let top = e.pageY - 10 + 'px';
    $('#hoverDate').css('top', top).css('left', left);
    if (STATE.temporality == 'monthly') {
      $('#hoverDate').html(hoverDate.format('YYYY-MM'));
    } else {
      $('#hoverDate').html(hoverDate.format('YYYY-MM-DD'));
    }
  };

  document.getElementById('timeline').oninput = function(e) {
    if (!STATE.stop) {
      STATE.stop = true;
      $('#playButton').addClass('fa-play');
      $('#playButton').removeClass('fa-pause');
    };
    if (STATE.yearLoop) {
      let firstDate;
      let lastDate;
      [firstDate, lastDate] = getSliderPositioning();

      const totalDays = Math.abs(firstDate.diff(lastDate, 'days') + 1);
      const sliderVal = $(this).val();
      const selectedTime = (sliderVal / CONSTANTS.timeline.maxValue) * totalDays;
      STATE.current = moment(firstDate).add(selectedTime, 'd');
    } else {
      const totalDays = Math.abs(STATE.start.diff(STATE.end, 'days') + 1);
      const sliderVal = $(this).val();
      const selectedTime = (sliderVal / CONSTANTS.timeline.maxValue) * totalDays;
      STATE.current = moment(STATE.start).add(selectedTime, 'd');
    }
    if (STATE.yearLoop) {
      const dayLoop = document.querySelector('input[name="dayLoop"]').value;
      const monthLoop = document.querySelector('select[name="monthLoop"]').value;
      STATE.current.set({'date': dayLoop});
      STATE.current.set({'month': monthLoop});
    }

    if (!validDate()) {
      nextDate();
    }
  };
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
      const wmsParams = util.getWMSParams(STATE);
      STATE.rate = 2000 - $('#speedSlider').val();
      await util.updateWMSLayerParams(map, map.getLayers().getArray()[0], wmsParams, STATE);
      await sleep(STATE.rate);
    } else {
      [map, projection] = await getState(map, projection);
      const wmsParams = util.getWMSParams(STATE);
      STATE.rate = 2000 - $('#speedSlider').val();
      await util.updateWMSLayerParams(map, map.getLayers().getArray()[0], wmsParams, STATE);
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
  STATE.start.hour(0);
  STATE.current.hour(10);
  STATE.end.hour(20);
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
  STATE.startYear = moment(`${document.querySelector('input[name="sYear"]').value}-01-01`);
  STATE.endYear = moment(`${document.querySelector('input[name="eYear"]').value}-12-31`);
  const month = document.querySelector('select[name="monthLoop"]').value;
  $('#dayLoop').attr({'max': daysInMonth[month]});
  if (oldHemisphere != STATE.hemi) {
    const wmsParams = util.getWMSParams(STATE);
    $('#map').html('');// Empty map when a new animation occurs
    projection = util.getProjection(STATE);
    map = util.getMap(projection, STATE);
    map.addLayer(util.createLayer(STATE));
    $('.ol-zoom-extent button').html('');
    util.updateWMSLayerParams(map, map.getLayers().getArray()[0], wmsParams, STATE);
  }
  if (oldMode != STATE.temporality) {
    document.querySelector('input[name="sDate"]').value = DEFAULTS[STATE.temporality].start.format('YYYY-MM-DD');
    document.querySelector('input[name="eDate"]').value = DEFAULTS[STATE.temporality].end.format('YYYY-MM-DD');
    STATE.start = moment(document.querySelector('input[name="sDate"]').value);
    STATE.current = moment(STATE.start);
    STATE.end = moment(document.querySelector('input[name="eDate"]').value);
  }
  STATE.start = STATE.start.startOf('day');
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

  for (let i = 0; i < 5; i++) {
    if (STATE.yearLoop) {
      let firstDate;
      let lastDate;
      [firstDate, lastDate] = getSliderPositioning();

      let totalDays = Math.abs(firstDate.diff(lastDate, 'days') + 1);
      let forwardDays = (totalDays / 4) * i;
      let scaleDate = moment(firstDate).add(forwardDays, 'd');
      if (STATE.temporality == 'monthly') {
        $(`#scale${i}`).html(scaleDate.format('YYYY-MM'));
      } else {
        $(`#scale${i}`).html(scaleDate.format('YYYY-MM-DD'));
      }
    } else {
      let totalDays = Math.abs(STATE.start.diff(STATE.end, 'days') + 1);
      let forwardDays = (totalDays / 4) * i;
      let scaleDate = moment(STATE.start).add(forwardDays, 'd');
      if (STATE.temporality == 'monthly') {
        $(`#scale${i}`).html(scaleDate.format('YYYY-MM'));
      } else {
        $(`#scale${i}`).html(scaleDate.format('YYYY-MM-DD'));
      }
    }
  }

  return [map, projection];
}

/** Method to go to the next date for the animation*/
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
  if (!validDate()) {
    nextDate();
  }
}

/** Method to go to the previous date for the animation*/
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
  const wmsParams = util.getWMSParams(STATE);
  $('#map').html('');// Empty map when a new animation occurs
  projection = util.getProjection(STATE);
  map = util.getMap(projection, STATE);
  $('.ol-zoom-extent button').html('');
  map.addLayer(util.createLayer(STATE));
  util.updateWMSLayerParams(map, map.getLayers().getArray()[0], wmsParams, STATE);
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
 * @param {int} ms - Milliseconds to sleep for
 * @return {promise} - A promise that can be awaited for the specified time
 */
function sleep(ms) { // Sleep function for pauses between frames
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Method to clear the text covering the map (currently unused) */
function clearMapOverlay() {// eslint-disable-line no-unused-vars
  map.removeLayer(map.getLayers().getArray()[1]);
}

/** Method to set the text covering the map
 * @return {boolean} - Valid date or not
*/
function validDate() {
  // Get the key (layername) for searching the valid layers object
  const objectKey = `g02135_${STATE.dataType}_raster_${STATE.temporality}_${STATE.hemi}`;
  // Return whether or not the current date is in the queried layer
  return (STATE.validDates[objectKey].includes(STATE.current.utc().startOf('day').toISOString()));
}

/** Method to set the text covering the map
 * @param {moment} date - The date to be tested
 * @return {boolean} - Valid date or not
*/
function validDateInput(date) {
  // Get the key (layername) for searching the valid layers object
  const objectKey = `g02135_${STATE.dataType}_raster_${STATE.temporality}_${STATE.hemi}`;
  // Return whether or not the current date is in the queried layer
  return (STATE.validDates[objectKey].includes(date.utc().startOf('day').toISOString()));
}

/** Method to get the positioning of the slider and get the first and last date selectors when in looping mode
 * @return {array} - The first and last dates to be displayed on the slider
*/
function getSliderPositioning() {
  const dayLoop = document.querySelector('input[name="dayLoop"]').value;
  const monthLoop = document.querySelector('select[name="monthLoop"]').value;
  let firstDate = moment();
  firstDate.set({'year': STATE.startYear.year()});
  firstDate.set({'date': dayLoop});
  firstDate.set({'month': monthLoop});

  while (!validDateInput(firstDate)) {
    firstDate.add(1, 'y');
  }

  let lastDate = moment();
  lastDate.set({'year': STATE.endYear.year()});
  lastDate.set({'date': dayLoop});
  lastDate.set({'month': monthLoop});

  while (!validDateInput(lastDate)) {
    lastDate.subtract(1, 'y');
  }

  return [firstDate, lastDate];
}

/** Method to get the last index of an array
 * @param {Array} arr - Array
 * @return {object} - The last index of the array
 */
function getLast(arr) {
  return (arr[arr.length - 1]);
}

main();
