import moment from 'moment';

import * as STATE from './STATE.js';

/** Find and move currentDate to the next date for the animation */
function nextDate() {
  let state = STATE.get();

  if (state.temporality == 'daily') {
    STATE.addToCurrentDate(state.yearLoop ? {years: 1} : {days: 1});
  } else {
    STATE.addToCurrentDate(state.yearLoop ? {years: 1} : {months: 1});
    STATE.updateCurrentDate({'date': 1});
  }
  if (isBefore(STATE.getProp('currentDate'), STATE.getProp('startDate')) ||
      isAfter(STATE.getProp('currentDate'), STATE.getProp('endDate'))) {
    STATE.set('currentDate', moment(STATE.getProp('startDate')));
  }

  if (state.yearLoop) {
    const dayLoop = document.querySelector('input[name="dayLoop"]').value;
    const monthLoop = document.querySelector('select[name="monthLoop"]').value;
    STATE.updateCurrentDate({'date': dayLoop, 'month': monthLoop});
  }

  if (!availableDate(STATE.getProp('currentDate'))) {
    nextDate();
  }
}

/** Find and move curretnDate to the previous date for the animation */
function previousDate() {
  let state = STATE.get();

  if (state.temporality == 'daily') {
    STATE.subtractFromCurrentDate(state.yearLoop ? {years: 1} : {days: 1});
  } else {
    STATE.subtractFromCurrentDate(state.yearLoop ? {years: 1} : {months: 1});
    STATE.updateCurrentDate({'date': 1});
  }

  if (isBefore(STATE.getProp('currentDate'), STATE.getProp('startDate')) ||
      isAfter(STATE.getProp('currentDate'), STATE.getProp('endDate'))) {
    STATE.set('currentDate', moment(STATE.getProp('endDate')));
  }
  if (state.yearLoop) {
    const dayLoop = document.querySelector('input[name="dayLoop"]').value;
    const monthLoop = document.querySelector('select[name="monthLoop"]').value;
    STATE.updateCurrentDate({'date': dayLoop, 'month': monthLoop});
  }

  if (!availableDate(STATE.getProp('currentDate'))) {
    previousDate();
  }
}

/** Check if a given date is valid and available in the getCapabilities array
 * @param {moment} date - The date to be tested
 * @return {boolean} - Valid date or not
*/
function availableDate(date) {
  let state = STATE.get();
  // Get the key (layername) for searching the valid layers object
  const objectKey = `g02135_${state.dataType}_raster_${state.temporality}_${state.hemi}`;
  // Return whether or not the current date is in the queried layer
  return (state.validDates[objectKey].includes(date.utc().startOf('day').toISOString()));
};
export {nextDate, previousDate, availableDate};

/** Check if a moment date is before another moment date
 * @param {moment} date - The date to be checked
 * @param {moment} comparison - The date to be compared against
 * @return {boolean}
*/
function isBefore(date, comparison) {
  // Return false if they are the same date
  if (date.year() == comparison.year() && date.month() == comparison.month() && date.date() == comparison.date()) {
    return false;
  } else {
    return date.isBefore(comparison);// Else return the moment check value
  }
}

/** Check if a moment date is after another moment date
 * @param {moment} date - The date to be checked
 * @param {moment} comparison - The date to be compared against
 * @return {boolean}
*/
function isAfter(date, comparison) {
  // Return false if they are the same date
  if (date.year() == comparison.year() && date.month() == comparison.month() && date.date() == comparison.date()) {
    return false;
  } else {
    return date.isAfter(comparison);// Else return the moment check value
  }
}
