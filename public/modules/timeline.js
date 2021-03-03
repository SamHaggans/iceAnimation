import $ from 'jquery';
import moment from 'moment';

import * as STATE from './STATE.js';
/** Generate and set the scale dates for the timeline
 */
function generateTimelineScale() {
  let state = STATE.get();
  for (let i = 0; i < 5; i++) {
    let firstDate = STATE.getProp('startDate');
    let lastDate = STATE.getProp('lastDate');

    let totalDays = Math.abs(firstDate.diff(lastDate, 'days') + 1);
    let forwardDays = (totalDays / 4) * i;
    let scaleDate = moment(firstDate).add(forwardDays, 'd');
    $(`#scale${i}`).html(scaleDate.format(
      state.temporality == 'monthly' ? 'YYYY-MM' : 'YYYY-MM-DD',
    ));
  }
}

export {generateTimelineScale};
