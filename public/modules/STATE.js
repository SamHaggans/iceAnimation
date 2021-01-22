// Packages
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import moment from 'moment';

const STATE = {};

/** Initialize the STATE object
 */
function init() {
  STATE = {
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
}

/** Return the STATE object
 * @return {object} STATE - Animation state
 */
function get() {
  return STATE;
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


export {init, set, get, readConfiguration}