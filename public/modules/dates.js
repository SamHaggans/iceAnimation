import moment from 'moment';

import * as STATE from './STATE.js';
import * as mapUtil from './map.js';

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
  if (!validDateInput(STATE.getProp('currentDate'))) {
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
    if (state.yearLoop) {
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


  if (validDateInput(STATE.getProp('currentDate'))) {
    previousDate();
  }
}

/** Check if a given date is valid and available
 * @param {moment} date - The date to be tested
 * @return {boolean} - Valid date or not
*/
function validDateInput(date) {
  let state = STATE.get();
  // Get the key (layername) for searching the valid layers object
  const objectKey = `g02135_${state.dataType}_raster_${state.temporality}_${state.hemi}`;
  // Return whether or not the current date is in the queried layer
  return (state.validDates[objectKey].includes(date.utc().startOf('day').toISOString()));
};
export {nextDate, previousDate, validDateInput};
