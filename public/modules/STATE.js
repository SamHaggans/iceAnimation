// Packages
import $ from 'jquery';
import moment from 'moment';

import * as mapUtil from './map.js';
import * as page from './page.js';
import * as dates from './dates.js';
import * as timeline from './timeline.js';

// Initialize the STATE object to the starting values
let STATE = {
  stop: true,
  rate: 100,
  currentDate: moment(),
  startDate: moment(),
  endDate: moment(),
  dataType: 'extent',
  hemi: 'n',
  temporality: 'daily',
  yearLoop: false,
  validDates: [],
  DEFAULTS: {
    daily: {
      start: moment().year(1978).month(9).date(26),
      end: moment(),
    },
    monthly: {
      start: moment().year(1978).month(10).startOf('month'),
      end: moment(),
    },
  },
};

/** Return the STATE object
* @return {object} STATE - Animation state
*/
function get() {
  let cloneState = {...STATE};
  return cloneState;
}

/** Return the STATE object
 * @param  {object} prop - The Attribute to be fetched
 * @return {object} STATE - Animation state
*/
function getProp(prop) {
  return STATE[prop];
}

/** Set a given attribute to a specific value
* @param {*} attr - Attribute to be set
* @param {*} value - Value to be stored in the attribute
*/
function set(attr, value) {
  STATE[attr] = value;
}

/** Read the configuration of the animation and save to STATE
*/
function readPageConfiguration() {
  // Get value for extent or concentration
  STATE.dataType = $('input[name=ext-con]:checked').val();
  // Get value for North or South
  STATE.hemi = $('input[name=n-s]:checked').val();
  // Get value for the looping style
  STATE.temporality = $('input[name=dates]:checked').val();
  // Get the value for the yearLoop option
  STATE.yearLoop = $('#yearLoop').is(':checked');
  STATE.startDate = moment(document.querySelector('input[name="sDate"]').value);
  STATE.endDate = moment(document.querySelector('input[name="eDate"]').value);


  if (STATE.yearLoop) {
    const dayLoop = document.querySelector('input[name="dayLoop"]').value;
    const monthLoop = document.querySelector('select[name="monthLoop"]').value;

    STATE.startDate = moment();
    STATE.startDate.set({'year': document.querySelector('input[name="sYear"]').value,
      'date': dayLoop, 'month': monthLoop});

    STATE.endDate = moment();
    STATE.endDate.set({'year': document.querySelector('input[name="eYear"]').value,
      'date': dayLoop, 'month': monthLoop});

    while (!dates.validDateInput(STATE.startDate)) {
      STATE.startDate.add(1, 'y');
    }

    while (!dates.validDateInput( STATE.endDate)) {
      STATE.endDate.subtract(1, 'y');
    }
  }

  const month = document.querySelector('select[name="monthLoop"]').value;
  let daysInMonth = moment().set({'year': 2020, 'month': month}).daysInMonth();
  $('#dayLoop').attr({'max': daysInMonth});

  // Set the hours on the date objects to ensure that
  // dates that occur on the same day are ordered correctly
  // (startDate before currentDate before endDate)
  STATE.startDate.hour(0);
  STATE.currentDate.hour(10);
  STATE.endDate.hour(20);
}

/** Update the currentDate value
 * @param {*} values - The attribute-value pairs of currentDate to be set
*/
function updateCurrentDate(values) {
  STATE['currentDate'].set(values);
}

/** Add to the currentDate value
 * @param {*} values - The attribute-value pairs of currentDate to be added
*/
function addToCurrentDate(values) {
  STATE['currentDate'].add(values);
}

/** Subtract from the currentDate value
 * @param {*} values - The attribute-value pairs of currentDate to be subtracted
*/
function subtractFromCurrentDate(values) {
  STATE['currentDate'].subtract(values);
}

/** Load and set the state configuration from the user inputs
*/
function updateState() {
  const oldHemisphere = STATE.hemi;
  const oldTemporality = STATE.temporality;
  const oldYearLoop = STATE.yearLoop;


  readPageConfiguration();
  if (oldHemisphere != STATE.hemi) {
    mapUtil.resetMap();
    mapUtil.updateMap();
  }

  if (oldTemporality != STATE.temporality || oldYearLoop != STATE.yearLoop) {
    STATE.currentDate = moment(STATE.startDate);
  }

  if (STATE.currentDate.isBefore(STATE.startDate)) {
    STATE.currentDate = moment(STATE.startDate);
  }

  if (STATE.currentDate.isAfter(STATE.endDate)) {
    STATE.currentDate = moment(STATE.endDate);
  }

  if (STATE.yearLoop) {
    const dayLoop = document.querySelector('input[name="dayLoop"]').value;
    const monthLoop = document.querySelector('select[name="monthLoop"]').value;
    updateCurrentDate({'date': dayLoop, 'month': monthLoop});
  }

  page.updateCSS();

  timeline.generateTimelineScale();
}

export {get, getProp, set, updateCurrentDate,
  addToCurrentDate, subtractFromCurrentDate, updateState};
