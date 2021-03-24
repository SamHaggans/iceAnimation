// Packages
import $ from 'jquery';

import * as mapUtil from './modules/map.js';
import * as util from './modules/util.js';
import * as STATE from './modules/STATE.js';
import * as page from './modules/page.js';
import * as dates from './modules/dates.js';

import moment from 'moment';

// Static Assets
import './style.css';

/** Start animation */
async function main() {
  // Run GetCapabilies request to load available dates and load into STATE
  STATE.set('validDates', await util.getValidDatesFromGetCapabilities());

  // Set default settings into the selectors and some other starting values
  init();

  // Run main animation loop
  animationLoop();
}

/** Initiate the input values and the map */
async function init() {
  // Create OpenLayers objects
  mapUtil.resetMap();

  // Set initial date settings from the GetCapabilities data
  page.setDateSettings();

  // Set default configuration for the animation
  page.setDefaultConfiguration();

  // Set playhead and timeline action bindings
  page.setPlayheadBindings();

  await mapUtil.initialMapLoad();

  STATE.set('currentDate', moment(STATE.getProp('startDate')));

  STATE.set('stop', true);

  $('#date').html(STATE.getProp('currentDate').format('YYYY-MM-DD'));

  // Clear loading message
  $('#mapAlert').html('');
}

/** Run the animation loop */
async function animationLoop() {
  while (true) {
    let state = STATE.get();
    if (!state.stop) {
      dates.nextDate();
    }
    await STATE.updateState();
    STATE.set('rate', 2000 - $('#speedSlider').val());
    await mapUtil.updateMap();
    await util.sleep(!state.stop ? state.rate : 50);
  }
}

main();
