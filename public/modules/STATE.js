// Packages
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import moment from 'moment';

// Initialize the STATE object to the starting values
let STATE = {
  stop: true,
  rate: 100,
  currentDate: moment(),
  startDate: moment(),
  endDate: moment(),
  startYear: moment(),
  endYear: moment(),
  dataType: 'extent',
  hemi: 'n',
  temporality: 'daily',
  yearLoop: false,
  validDates: [],
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
function readConfiguration() {
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
  STATE.startYear = moment(`${document.querySelector('input[name="sYear"]').value}-01-01`);
  STATE.endYear = moment(`${document.querySelector('input[name="eYear"]').value}-12-31`);
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

/** Update the startDate value
 * @param {*} values - The attribute-value pairs of startDate to be set
*/
function updateStartDate(values) {
  STATE['startDate'].set(values);
}

/** Update the endDate value
 * @param {*} values - The attribute-value pairs of endDate to be set
*/
function updateEndDate(values) {
  STATE['endDate'].set(values);
}

/** Add to the currentDate value
 * @param {*} values - The attribute-value pairs of currentDate to be added
*/
function addToCurrentDate(values) {
  STATE['currentDate'].add(values);
}

/** Add to the currentDate value
 * @param {*} values - The attribute-value pairs of startDate to be added
*/
function addToStartDate(values) {
  STATE['startDate'].add(values);
}

/** Add to the currentDate value
 * @param {*} values - The attribute-value pairs of endDate to be added
*/
function addToEndDate(values) {
  STATE['endDate'].add(values);
}

/** Subtract from the currentDate value
 * @param {*} values - The attribute-value pairs of currentDate to be subtracted
*/
function subtractFromCurrentDate(values) {
  STATE['currentDate'].subtract(values);
}

/** Subtract from the currentDate value
 * @param {*} values - The attribute-value pairs of startDate to be subtracted
*/
function subtractFromStartDate(values) {
  STATE['startDate'].subtract(values);
}

/** Subtract from the currentDate value
 * @param {*} values - The attribute-value pairs of endDate to be subtracted
*/
function subtractFromEndDate(values) {
  STATE['endDate'].subtract(values);
}

export {get, getProp, set, readConfiguration, updateCurrentDate,
  updateStartDate, updateEndDate, addToCurrentDate, addToEndDate,
  addToStartDate, subtractFromCurrentDate, subtractFromEndDate,
  subtractFromStartDate};
