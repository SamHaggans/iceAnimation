// Packages
import $ from 'jquery';
window.jQuery = $;
window.$ = $;

import * as mapUtil from './modules/map.js';
import * as util from './modules/util.js';
import * as STATE from './modules/STATE.js';
import * as page from './modules/page.js';
import * as dates from './modules/dates.js';

import moment from 'moment';

// Static Assets
import './style.css';

// Static Image Assets
// import extentLegend from './assets/extent_legend.png';
import concentrationLegend from './assets/concentration_legend.png';

/*
import nNoData from './assets/n_nodata.png';
import sNoData from './assets/s_nodata.png';
*/

/* Save static assets in an object for access (not currently used)
const noDataImages = {
  'n': nNoData,
  's': sNoData,
};
*/


let map;
let projection;

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
  [map, projection] = mapUtil.resetMap();

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

/** Run the animation loop
 * @param {map} map - The map object to animate
*/
async function animationLoop() {
  while (true) {
    let state = STATE.get();
    if (!state.stop) {
      dates.nextDate();
    }
    [map, projection] = await STATE.configureState(map, projection);
    const wmsParams = mapUtil.getWMSParams();
    STATE.set('rate', 2000 - $('#speedSlider').val());
    await mapUtil.updateWMSLayerParams(map, map.getLayers().getArray()[0], wmsParams);
    await util.sleep(!state.stop ? state.rate : 50);
  }
}



main();
