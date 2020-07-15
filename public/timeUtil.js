import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import moment from 'moment';

/** Method to go to the next date for the animation
 * @param {object} STATE Animation state
 * @param {array} validDates Array of valid dates
*/
export function nextDate(STATE, validDates) {
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
  } else {
    if (STATE.current.isAfter(STATE.end)) {
      STATE.current.set({'year': STATE.start.year()});
      while (STATE.current.isBefore(STATE.start)) {
        STATE.current.add(1, 'y');
      }
    }
    if (STATE.current.isBefore(STATE.start)) {
      STATE.current.set({'year': STATE.start.year()});
      while (STATE.current.isBefore(STATE.start)) {
        STATE.current.add(1, 'y');
      }
    }
  }
  if (!validDate(STATE, validDates)) {
    nextDate(STATE, validDates);
  }
}

/** Method to go to the previous date for the animation
 * @param {object} STATE Animation state
 * @param {array} validDates Array of valid dates
*/
export function previousDate(STATE, validDates) {
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
  } else {
    if (STATE.current.isBefore(STATE.start)) {
      STATE.current.set({'year': STATE.end.year()});
      while (STATE.current.isAfter(STATE.end)) {
        STATE.current.subtract(1, 'y');
      }
    }
  }
  if (!validDate(STATE, validDates)) {
    previousDate(STATE, validDates);
  }
}

/** Method to set the text covering the map
 * @return {boolean} - Valid date or not
 * @param {object} STATE Animation state
 * @param {array} validDates Array of valid dates
*/
function validDate(STATE, validDates) {
  // Get the key (layername) for searching the valid layers object
  const objectKey = `g02135_${STATE.dataType}_raster_${STATE.temporality}_${STATE.hemi}`;
  // Return whether or not the current date is in the queried layer
  return (validDates[objectKey].includes(STATE.current.utc().startOf('day').toISOString()));
}
