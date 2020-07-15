import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import moment from 'moment';

import * as mapUtil from './mapUtil.js';
import {CONSTANTS} from './constants.js';

/** Method to get the state of the loop
 * @return {array} - An array containing the map and projection objects
 * @param {map} map - The map to be used
 * @param {projection} projection - The projection to be used
 * @param {object} STATE Animation state
 * @param {object} DEFAULTS default parameters
*/
export function getState(map, projection, STATE, DEFAULTS) {
  const oldHemisphere = STATE.hemi;
  const oldMode = STATE.temporality;
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
  if (oldHemisphere != STATE.hemi) {
    const wmsParams = mapUtil.getWMSParams(STATE);
    $('#map').html('');// Empty map when a new animation occurs
    let projection = mapUtil.getProjection(STATE);
    let map = mapUtil.getMap(projection, STATE);
    map.addLayer(mapUtil.createLayer(STATE));
    $('.ol-zoom-extent button').html('');
    mapUtil.updateWMSLayerParams(map, map.getLayers().getArray()[0], wmsParams, STATE);
  }
  if (oldMode != STATE.temporality) {
    document.querySelector('input[name="sDate"]').value = DEFAULTS[STATE.temporality].start.format('YYYY-MM-DD');
    document.querySelector('input[name="eDate"]').value = DEFAULTS[STATE.temporality].end.format('YYYY-MM-DD');
    STATE.start = moment(document.querySelector('input[name="sDate"]').value);
    STATE.current = moment(STATE.start);
    STATE.end = moment(document.querySelector('input[name="eDate"]').value);
  }
  $('#missing-data-message').css('left', `${340 + CONSTANTS[STATE.hemi].css.width}px`);
  return [map, projection];
}

/** Method to update the state of the loop
 * @param {object} STATE Animation state
 * @return {array} - An array containing the map and projection objects
*/
export function updateState(STATE) {
  STATE.dataType = $('input[name=ext-con]:checked').val();
  // Get value for extent or concentration
  STATE.hemi = $('input[name=n-s]:checked').val();
  // Get value for North or South
  STATE.temporality = $('input[name=dates]:checked').val();
  // Get value for the looping style
  STATE.start = moment(document.querySelector('input[name="sDate"]').value);
  STATE.end = moment(document.querySelector('input[name="eDate"]').value);
  STATE.current = moment(STATE.start);
  const wmsParams = mapUtil.getWMSParams(STATE);
  $('#map').html('');// Empty map when a new animation occurs
  let projection = mapUtil.getProjection(STATE);
  let map = mapUtil.getMap(projection, STATE);
  $('.ol-zoom-extent button').html('');
  map.addLayer(mapUtil.createLayer(STATE));
  mapUtil.updateWMSLayerParams(map, map.getLayers().getArray()[0], wmsParams, STATE);
  $('#missing-data-message').css('left', `${340 + CONSTANTS[STATE.hemi].css.width}px`);
  return [map, projection];
}
