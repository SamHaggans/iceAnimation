// Packages
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import moment from 'moment';

let STATE = {};

/** Initialize the STATE object
 */
function initialize() {
  STATE = {
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
}

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
  STATE.startDate.hour(0);
  STATE.currentDate.hour(10);
  STATE.endDate.hour(20);
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
}

/** Update a date value
 * @param {*} date - The date object to be updated
 * @param {*} values - The attribute-value pairs of the date to be set
*/
function setDate(date, values) {
  STATE[date].set(values);
}

/** Update the currentDate value
 * @param {*} values - The attribute-value pairs of currentDate to be set
*/
function setCurrentDate(values) {
  setDate('currentDate', values);
}

/** Update the startDate value
 * @param {*} values - The attribute-value pairs of startDate to be set
*/
function setStartDate(values) {
  setDate('startDate', values);
}

/** Update the endDate value
 * @param {*} values - The attribute-value pairs of endDate to be set
*/
function setEndDate(values) {
  setDate('endDate', values);
}

/** Add to a date value
 * @param {*} date - The date object to be updated
 * @param {*} values - The addition to be made
*/
function addToDate(date, values) {
  STATE[date].add(values);
}

/** Add to the currentDate value
 * @param {*} values - The attribute-value pairs of currentDate to be added
*/
function addToCurrentDate(values) {
  addToDate('currentDate', values);
}

/** Add to the currentDate value
 * @param {*} values - The attribute-value pairs of startDate to be added
*/
function addToStartDate(values) {
  addToDate('startDate', values);
}

/** Add to the currentDate value
 * @param {*} values - The attribute-value pairs of endDate to be added
*/
function addToEndDate(values) {
  addToDate('endDate', values);
}

/** Subtract from a date value
 * @param {*} date - The date object to be updated
 * @param {*} values - The subtraction to be made
*/
function subtractFromDate(date, values) {
  STATE[date].subtract(values);
}

/** Subtract from the currentDate value
 * @param {*} values - The attribute-value pairs of currentDate to be subtracted
*/
function subtractFromCurrentDate(values) {
  subtractFromDate('currentDate', values);
}

/** Subtract from the currentDate value
 * @param {*} values - The attribute-value pairs of startDate to be subtracted
*/
function subtractFromStartDate(values) {
  subtractFromDate('startDate', values);
}

/** Subtract from the currentDate value
 * @param {*} values - The attribute-value pairs of endDate to be subtracted
*/
function subtractFromEndDate(values) {
  subtractFromDate('endDate', values);
}

/** Set the current date to a moment date
 * @param {*} momentDate - The moment date to which STATE will be set
*/
function setCurrentDateToMoment(momentDate) {
  STATE.currentDate = momentDate;
}

/** Set the end date to a moment date
 * @param {*} momentDate - The moment date to which STATE will be set
*/
function setEndDateToMoment(momentDate) {
  STATE.endDate = momentDate;
}

/** Set the starting date to a moment date
 * @param {*} momentDate - The moment date to which STATE will be set
*/
function setStartDateToMoment(momentDate) {
  STATE.startDate = momentDate;
}

initialize();

export {get, getProp, set, readConfiguration, setCurrentDate,
  setStartDate, setEndDate, addToCurrentDate, addToEndDate,
  addToStartDate, subtractFromCurrentDate, subtractFromEndDate,
  subtractFromStartDate, setCurrentDateToMoment, setStartDateToMoment,
  setEndDateToMoment};
