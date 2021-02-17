import $ from 'jquery';
import moment from 'moment';

import * as STATE from './STATE.js';

/** Generate and set the scale dates for the timeline
 */
function generateTimelineScale() {
  let state = STATE.get();
  for (let i = 0; i < 5; i++) {
    if (state.yearLoop) {
      let firstDate;
      let lastDate;
      [firstDate, lastDate] = getSliderPositioning();

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

/** Get the positioning of the slider and get the first and last date selectors when in looping mode
 * @return {array} - The first and last dates to be displayed on the slider
*/
function getSliderPositioning() {
  const dayLoop = document.querySelector('input[name="dayLoop"]').value;
  const monthLoop = document.querySelector('select[name="monthLoop"]').value;
  let firstDate = moment();
  firstDate.set({'year': STATE.getProp('startYear').year()});
  firstDate.set({'date': dayLoop});
  firstDate.set({'month': monthLoop});

  while (!dates.validDateInput(firstDate)) {
    firstDate.add(1, 'y');
  }

  let lastDate = moment();
  lastDate.set({'year': STATE.getProp('endYear').year()});
  lastDate.set({'date': dayLoop});
  lastDate.set({'month': monthLoop});

  while (!dates.validDateInput(lastDate)) {
    lastDate.subtract(1, 'y');
  }

  return [firstDate, lastDate];
}

export {generateTimelineScale, getSliderPositioning};
