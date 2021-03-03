import $ from 'jquery';
import moment from 'moment';

import * as STATE from './STATE.js';
import * as mapUtil from './map.js';
import * as dates from './dates.js';
import * as util from './util.js';

import {CONSTANTS} from '../constants.js';

// Static Image Assets
import extentLegend from '../assets/extent_legend.png';
import concentrationLegend from '../assets/concentration_legend.png';

/** Toggle the visibility of the legend
 */
function toggleLegend() {
  let state = STATE.get();
  if (state.dataType == 'extent') {
    $('#legend').attr('src', extentLegend);
  }
  if (state.dataType == 'concentration') {
    $('#legend').attr('src', concentrationLegend);
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
    dates.previousDate();
    STATE.updateState();
    mapUtil.updateMap();
  });
  $('#nextFrame').click(function() {// When animation button is clicked
    pauseAnimation();
    dates.nextDate();
    STATE.updateState();
    mapUtil.updateMap();
  });
  $('#firstFrame').click(function() {// When animation button is clicked
    pauseAnimation();

    STATE.set('currentDate', moment(STATE.getProp('startDate')));
    if (!dates.validDateInput(STATE.getProp('currentDate'))) {
      dates.nextDate();
    }

    STATE.updateState();
    mapUtil.updateMap();
  });
  $('#lastFrame').click(async function() {// When animation button is clicked
    pauseAnimation();

    STATE.set('currentDate', moment(STATE.getProp('endDate')));
    if (!dates.validDateInput(STATE.getProp('currentDate'))) {
      dates.previousDate();
    }

    STATE.updateState();
    mapUtil.updateMap();
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

    let firstDate = STATE.getProp('startDate');
    let lastDate = STATE.getProp('lastDate');

    const totalDays = Math.abs(firstDate.diff(lastDate, 'days') + 1);
    const sliderVal = $(this).val();
    const selectedTime = (sliderVal / CONSTANTS.timeline.maxValue) * totalDays;
    STATE.set('currentDate', moment(firstDate).add(selectedTime, 'd'));
    if (STATE.getProp('yearLoop')) {
      const dayLoop = document.querySelector('input[name="dayLoop"]').value;
      const monthLoop = document.querySelector('select[name="monthLoop"]').value;
      STATE.updateCurrentDate({'date': dayLoop, 'month': monthLoop});
    }

    if (!dates.validDateInput(STATE.getProp('currentDate'))) {
      dates.nextDate();
    }
  };
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

/** Find the ending dates based on the GetCapabilities data and set starting date text
 */
function setDateSettings() {
  let state = STATE.get();
  // Set the "last" day and month to be the last of the getCapabilities data
  const dailyDates = `g02135_extent_raster_daily_n`;
  const lastDay = util.getLast(state.validDates[dailyDates]).split('T')[0];
  STATE.set('DEFAULTS.daily.end', moment(lastDay));
  const monthlyDates = `g02135_extent_raster_monthly_n`;
  const lastMonth = util.getLast(state.validDates[monthlyDates]).split('T')[0];
  STATE.set('DEFAULTS.monthly.end', moment(lastMonth));
  const lastYear = util.getLast(state.validDates[dailyDates]).split('-')[0];
  $('#sYear').attr({'max': lastYear});
  $('#eYear').attr({'max': lastYear, 'value': lastYear});

  document.querySelector('input[name="sDate"]').value = state.DEFAULTS[state.temporality].start.format('YYYY-MM-DD');
  document.querySelector('input[name="eDate"]').value = state.DEFAULTS[state.temporality].end.format('YYYY-MM-DD');
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

export {toggleLegend, updateCSS, setPlayheadBindings, pauseAnimation, setDateSettings, setDefaultConfiguration};
