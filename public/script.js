// Packages
import $ from 'jquery';
window.jQuery = $;
window.$ = $;

import * as mapUtil from './modules/mapUtil.js';
import * as util from './modules/util.js';
import * as STATE from './modules/STATE.js';

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

let DEFAULTS = {
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
  STATE.set('validDates', await getValidDatesFromGetCapabilities());

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

  STATE.set('currentDate', moment(STATE.getProp('startDate')));

  STATE.set('stop', true);

  $('#date').html(STATE.getProp('currentDate').format('YYYY-MM-DD'));

  // Clear loading message
  $('#mapAlert').html('');
}

/** Run the animation loop
 * @param {map} map - The map object to animate
*/
async function animationLoop() {
  while (true) {
    let state = STATE.get();
    if (!state.stop) {
      nextDate();
    }
    [map, projection] = await configureState(map, projection);
    const wmsParams = mapUtil.getWMSParams();
    STATE.set('rate', 2000 - $('#speedSlider').val());
    await mapUtil.updateWMSLayerParams(map, map.getLayers().getArray()[0], wmsParams);
    await util.sleep(!state.stop ? state.rate : 50);
  }
}


/** Recreate the map and projection objects
 */
function resetMap() {
  $('#map').html('');// Empty map when a new animation occurs
  projection = mapUtil.getProjection();
  map = mapUtil.getMap(projection);
  map.addLayer(mapUtil.createLayer());
}

/** Load and set the state configuration from the user inputs and return the correct map and projection
 * @return {array} - An array containing the map and projection objects
 * @param {map} map - The map to be used
 * @param {projection} projection - The projection to be used
*/
function configureState(map, projection) {
  let state = STATE.get();
  const oldHemisphere = state.hemi;
  const oldTemporality = state.temporality;

  STATE.readConfiguration();
  if (oldHemisphere != STATE.getProp('hemi')) {
    resetMap();
    mapUtil.loadWMS(map, projection);
  }
  if (oldTemporality != STATE.getProp('temporality')) {
    let temporality = STATE.getProp('temporality');
    document.querySelector('input[name="sDate"]').value = DEFAULTS[temporality].start.format('YYYY-MM-DD');
    document.querySelector('input[name="eDate"]').value = DEFAULTS[temporality].end.format('YYYY-MM-DD');
    STATE.set('startDate', moment(document.querySelector('input[name="sDate"]').value));
    STATE.set('currentDate', moment(STATE.getProp('startDate')));
    STATE.set('endDate', moment(document.querySelector('input[name="eDate"]').value));
    while (!mapUtil.validDateInput(STATE.getProp('currentDate'))) {
      nextDate();
    }
  }
  STATE.updateStartDate(STATE.getProp('startDate').startOf('day'));

  updateCSS();

  generateTimelineScale();

  return [map, projection];
}

/** Generate and set the scale dates for the timeline
 */
function generateTimelineScale() {
  let state = STATE.get();
  for (let i = 0; i < 5; i++) {
    if (state.yearLoop) {
      let firstDate;
      let lastDate;
      [firstDate, lastDate] = mapUtil.getSliderPositioning();

      let totalDays = Math.abs(firstDate.diff(lastDate, 'days') + 1);
      let forwardDays = (totalDays / 4) * i;
      let scaleDate = moment(firstDate).add(forwardDays, 'd');
      $(`#scale${i}`).html(scaleDate.format(
        state.temporality == 'monthly' ? 'YYYY-MM' : 'YYYY-MM-DD',
      ));
    } else {
      let totalDays = Math.abs(state.startDate.diff(state.endDate, 'days') + 1);
      let forwardDays = (totalDays / 4) * i;
      let scaleDate = moment(state.startDate).add(forwardDays, 'd');
      $(`#scale${i}`).html(scaleDate.format(
        state.temporality == 'monthly' ? 'YYYY-MM' : 'YYYY-MM-DD',
      ));
    }
  }
}

/** Update CSS to reflect STATE
 */
function updateCSS() {
  let state = STATE.get();
  if (state.yearLoop) {
    $('.loopSelection').css('display', 'block');
    $('.dateSelect').css('display', 'none');
    $('.yearSelect').css('display', 'flex');

    if (state.temporality == 'monthly') {
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
  STATE.updateStartDate({'hour': 0});
  STATE.updateCurrentDate({'hour': 10});
  STATE.updateEndDate({'hour': 20});
  let state = STATE.get();
  if (state.yearLoop) {
    const dayLoop = document.querySelector('input[name="dayLoop"]').value;
    const monthLoop = document.querySelector('select[name="monthLoop"]').value;
    STATE.updateCurrentDate({'date': dayLoop});
    STATE.updateCurrentDate({'month': monthLoop});
  }
  if (state.temporality == 'monthly') {
    if (state.yearLoop) {
      STATE.addToCurrentDate({years: 1});
    } else {
      STATE.addToCurrentDate({months: 1});
    }
    STATE.updateCurrentDate({'date': 1});
  } else {
    if (state.yearLoop) {
      STATE.addToCurrentDate({years: 1});
    } else {
      STATE.addToCurrentDate({days: 1});
    }
  }
  if (!state.yearLoop) {
    if (STATE.getProp('currentDate').isAfter(STATE.getProp('endDate')) ||
        STATE.getProp('currentDate').isBefore(STATE.getProp('startDate'))) {
      STATE.set('currentDate', moment(STATE.getProp('startDate')));
    }
  }

  if (state.yearLoop) {
    let firstDate;
    let lastDate;
    [firstDate, lastDate] = mapUtil.getSliderPositioning();
    const dayLoop = document.querySelector('input[name="dayLoop"]').value;
    const monthLoop = document.querySelector('select[name="monthLoop"]').value;
    if (STATE.getProp('currentDate').isBefore(firstDate)) {
      STATE.updateCurrentDate({'year': lastDate.year()});
    } else if (STATE.getProp('currentDate').isAfter(lastDate)) {
      STATE.updateCurrentDate({'year': firstDate.year()});
    }
    STATE.updateCurrentDate({'date': dayLoop});
    STATE.updateCurrentDate({'month': monthLoop});
  }


  if (state.yearLoop) {
    const dayLoop = document.querySelector('input[name="dayLoop"]').value;
    const monthLoop = document.querySelector('select[name="monthLoop"]').value;
    STATE.updateCurrentDate({'date': dayLoop});
    STATE.updateCurrentDate({'month': monthLoop});
  }
  if (!mapUtil.validDateInput(STATE.getProp('currentDate'))) {
    nextDate();
  }
}

/** Find and move to previous date for the animation*/
function previousDate() {
  STATE.updateStartDate({'hour': 0});
  STATE.updateCurrentDate({'hour': 10});
  STATE.updateEndDate({'hour': 20});
  let state = STATE.get();

  if (state.temporality == 'monthly') {
    if (state.yearLoop) {
      STATE.subtractFromCurrentDate({years: 1});
    } else {
      STATE.subtractFromCurrentDate({months: 1});
    }
    STATE.updateCurrentDate({'date': 1});
  } else {
    if (STATE.yearLoop) {
      STATE.subtractFromCurrentDate({years: 1});
    } else {
      STATE.subtractFromCurrentDate({days: 1});
    }
  }
  if (!state.yearLoop) {
    if (STATE.getProp('currentDate').isBefore(STATE.getProp('startDate'))) {
      STATE.set('currentDate', moment(STATE.getProp('endDate')));
    }
  }

  if (state.yearLoop) {
    let firstDate;
    let lastDate;
    [firstDate, lastDate] = mapUtil.getSliderPositioning();
    const dayLoop = document.querySelector('input[name="dayLoop"]').value;
    const monthLoop = document.querySelector('select[name="monthLoop"]').value;
    if (STATE.getProp('currentDate').isBefore(STATE.getProp('firstDate'))) {
      STATE.updateCurrentDate({'year': lastDate.year()});
    } else if (STATE.getProp('currentDate').isAfter(STATE.getProp('lastDate'))) {
      STATE.updateCurrentDate({'year': firstDate.year()});
    }
    STATE.updateCurrentDate({'date': dayLoop});
    STATE.updateCurrentDate({'month': monthLoop});
  }


  if (!mapUtil.validDateInput(STATE.getProp('currentDate'))) {
    previousDate();
  }
}

/** Initialize the map settings
 * @return {Promise} - Resolves when loading is completed
*/
function initialMapLoad() {
  return new Promise(function(resolve, reject) {
    STATE.readConfiguration();
    resetMap();
    mapUtil.loadWMS(map, projection);
    resolve();
  });
}

/** Clear the text covering the map */
function clearMapOverlay() {// eslint-disable-line no-unused-vars
  map.removeLayer(map.getLayers().getArray()[1]);
}

/** Pause animation
 */
function pauseAnimation() {
  if (!STATE.getProp('stop')) {
    STATE.set('stop', true);
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
    const getCapabilities = await util.runXMLHTTPRequest(requestHTTP);
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
  let state = STATE.get();
  // Set the "last" day and month to be the last of the getCapabilities data
  const dailyDates = `g02135_extent_raster_daily_n`;
  const lastDay = util.getLast(state.validDates[dailyDates]).split('T')[0];
  DEFAULTS['daily'].end = moment(lastDay);
  const monthlyDates = `g02135_extent_raster_monthly_n`;
  const lastMonth = util.getLast(state.validDates[monthlyDates]).split('T')[0];
  DEFAULTS['monthly'].end = moment(lastMonth);

  const lastYear = util.getLast(state.validDates[dailyDates]).split('-')[0];
  $('#sYear').attr({'max': lastYear});
  $('#eYear').attr({'max': lastYear, 'value': lastYear});

  document.querySelector('input[name="sDate"]').value = DEFAULTS[state.temporality].start.format('YYYY-MM-DD');
  document.querySelector('input[name="eDate"]').value = DEFAULTS[state.temporality].end.format('YYYY-MM-DD');
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
    if (STATE.getProp('stop')) {
      STATE.set('stop', false);// Start animation
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
    mapUtil.loadWMS(map, projection);
  });
  $('#nextFrame').click(function() {// When animation button is clicked
    pauseAnimation();
    nextDate();
    [map, projection] = configureState(map, projection);
    mapUtil.loadWMS(map, projection);
  });
  $('#firstFrame').click(function() {// When animation button is clicked
    pauseAnimation();
    if (STATE.getProp('yearLoop')) {
      const dayLoop = document.querySelector('input[name="dayLoop"]').value;
      const monthLoop = document.querySelector('select[name="monthLoop"]').value;

      STATE.updateCurrentDate({'year': STATE.getProp('startYear').year()});
      STATE.updateCurrentDate({'date': dayLoop});
      STATE.updateCurrentDate({'month': monthLoop});

      while (!mapUtil.validDateInput(STATE.getProp('currentDate'))) {
        nextDate();
      }
    } else {
      STATE.set('currentDate', moment(STATE.getProp('startDate')));
      while (!mapUtil.validDateInput(STATE.getProp('currentDate'))) {
        nextDate();
      }
      [map, projection] = configureState(map, projection);
      mapUtil.loadWMS(map, projection);
    }
  });
  $('#lastFrame').click(async function() {// When animation button is clicked
    pauseAnimation();
    if (STATE.getProp('yearLoop')) {
      const dayLoop = document.querySelector('input[name="dayLoop"]').value;
      const monthLoop = document.querySelector('select[name="monthLoop"]').value;

      STATE.updateCurrentDate({'year': STATE.getProp('endYear').year()});
      STATE.updateCurrentDate({'date': dayLoop});
      STATE.updateCurrentDate({'month': monthLoop});
      while (!mapUtil.validDateInput(STATE.getProp('currentDate'))) {
        previousDate();
      }
    } else {
      STATE.set('currentDate', moment(STATE.getProp('endDate')));
      while (!mapUtil.validDateInput(STATE.getProp('currentDate'))) {
        previousDate();
      }
      [map, projection] = configureState(map, projection);
      mapUtil.loadWMS(map, projection);
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
    [firstDate, lastDate] = mapUtil.getSliderPositioning();

    const totalDays = Math.abs(firstDate.diff(lastDate, 'days') + 1);
    const sliderVal = $(this).val();
    const selectedTime = (sliderVal / CONSTANTS.timeline.maxValue) * totalDays;
    STATE.set('currentDate', moment(firstDate).add(selectedTime, 'd'));
    if (STATE.getProp('yearLoop')) {
      const dayLoop = document.querySelector('input[name="dayLoop"]').value;
      const monthLoop = document.querySelector('select[name="monthLoop"]').value;
      STATE.updateCurrentDate({'date': dayLoop, 'month': monthLoop});
    }

    if (!mapUtil.validDateInput(STATE.getProp('currentDate'))) {
      nextDate();
    }
  };
}

main();
