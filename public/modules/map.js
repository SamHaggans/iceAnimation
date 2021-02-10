// Packages
import $ from 'jquery';
window.jQuery = $;
window.$ = $;
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import ZoomToExtent from 'ol/control/ZoomToExtent';
import Zoom from 'ol/control/Zoom';
import ImageWMS from 'ol/source/ImageWMS';
import Image from 'ol/layer/Image';
import ImageStatic from 'ol/source/ImageStatic';
import Projection from 'ol/proj/Projection';
import {getCenter} from 'ol/extent';
import moment from 'moment';

import * as STATE from './STATE.js';
import * as page from './page.js';
import * as dates from './dates.js';

import {CONSTANTS} from '../constants.js';

let map;
let projection;
/** Load the wms with the current params
 * @param {map} map - The map to be used
 * @param {projection} projection - The projection to be used
 */
export async function loadWMS(map, projection) {
  const params = getWMSParams();
  await updateWMSLayerParams(map, map.getLayers().getArray()[0], params);
}

/** Create a projection for a map
 * @return {projection} projection
 */
export function getProjection() {
  let state = STATE.get();
  const projection = new Projection({// Map projection
    code: CONSTANTS[state.hemi].srs,
    extent: CONSTANTS[state.hemi].extent,
  });
  return projection;
}

/** Update a given layer with specific parameters
 * @param {map} map Map to be updated
 * @param {layer} layer - The layer to be updated
 * @param {object} params - The parameters to be updated
 * @return {promise} - A promise of updating the layer
 */
export function updateWMSLayerParams(map, layer, params) {
  let state = STATE.get();
  page.toggleLegend(state);
  return new Promise(async function(resolve, reject) {
    const source = layer.getSource();
    await source.updateParams(params);
    await source.refresh();
    // Make requests on a 5 second interval to ensure that WMS loads eventually
    const interval = setInterval(async () => {
      const source = layer.getSource();
      await source.updateParams(params);
      await source.refresh();
    }, 5000);
    map.once('rendercomplete', function(event) {
      if (state.temporality == 'daily') {
        $('#date').html(state.currentDate.format('YYYY-MM-DD'));
      } else {
        $('#date').html(state.currentDate.format('YYYY-MM'));
      }

      if (state.yearLoop) {
        let firstDate;
        let lastDate;
        [firstDate, lastDate] = getSliderPositioning(state);

        const totalDays = Math.abs(firstDate.diff(lastDate, 'days') + 1);
        const animateDistance = Math.abs(firstDate.diff(state.currentDate, 'days') + 1);
        const sliderPos = (animateDistance / totalDays) * 1000000;
        document.getElementById('timeline').value = sliderPos;
      } else {
        const totalDays = Math.abs(state.startDate.diff(state.endDate, 'days') + 1);
        const animateDistance = Math.abs(state.startDate.diff(state.currentDate, 'days') + 1);
        const sliderPos = (animateDistance / totalDays) * 1000000;
        document.getElementById('timeline').value = sliderPos;
      }
      // Delete interval requests after load
      clearInterval(interval);
      // Wait for map to be ready to change the date tag
      resolve();
    });
  });
}

/** Create a layer for a map
 * @return {layer} layer
 */
export function createLayer() {
  const wmsParams = getWMSParams();
  const source = new ImageWMS({
    url: 'https://nsidc.org/api/mapservices/NSIDC/wms',
    params: wmsParams,
    serverType: 'geoserver',
  });

  const layer = new Image({source});
  return layer;
}

/** Create a map
 * @return {map} Map
 * @param {projection} projection - The Projection to create the map with
 */
export function getMap(projection) {
  const extent = getLocationParams().extent;
  const map = new Map({ // New map
    target: 'map', // Div in which the map is displayed
    view: new View({
      projection: projection,
      center: getCenter(extent), // Start in the center of the image
      zoom: 1,
      minZoom: 1,
      extent: extent,
    }),
  });
  const zoomToExtentControl = new ZoomToExtent({
    extent: getLocationParams().extent,
    size: [5, 5],
  });
  map.addControl(zoomToExtentControl);// Add control to reset view

  const zoomControl = new Zoom({
    size: [5, 5],
  });
  map.addControl(zoomControl);// Add control to reset view

  $('.ol-zoom-extent button').html(''); // Remove the default "E" from the zoom to extent button

  return map;
}

/** Get location parameters from CONSTANTS
 * @return {object} The parameters
 */
export function getLocationParams() {
  let state = STATE.get();
  const extent = CONSTANTS[state.hemi].extent;// Map size
  // var extent = [0,0,0,0];

  $('#map').css('width', CONSTANTS[state.hemi].css.width);
  $('#map').css('height', CONSTANTS[state.hemi].css.height);
  $('#mapContainer').css('width', CONSTANTS[state.hemi].css.width);
  $('#mapContainer').css('height', CONSTANTS[state.hemi].css.height);
  $('#mapAlert').css('left', CONSTANTS[state.hemi].css.width*0.30);
  $('#mapAlert').css('top', CONSTANTS[state.hemi].css.height*0.7);
  const locationVal = CONSTANTS[state.hemi].locationVal;
  const width = CONSTANTS[state.hemi].width;
  const height = CONSTANTS[state.hemi].height;
  const srs = CONSTANTS[state.hemi].srs;// Location for request url

  return {extent: extent, locationVal: locationVal, width: width, height: height, srs: srs};
}

/** Get the wms parameters
 * @return {object} wmsParameters
 */
export function getWMSParams() {
  let state = STATE.get();
  let sourceType = 'monthly';
  if (state.temporality == 'daily') {
    sourceType = 'daily';
  }
  const basemap = 'NSIDC:g02135_' + state.dataType+ '_raster_basemap';
  // const withMissing = 'NSIDC:g02135_' + STATE.dataType+ '_raster_with_missing';
  return {
    LAYERS: 'NSIDC:g02135_' + state.dataType + `_raster_${sourceType}_` + state.hemi,
    SRS: getLocationParams(state).srs,
    BBOX: getLocationParams(state).locationVal,
    TILED: false,
    format: 'image/png',
    TIME: state.currentDate.format('YYYY-MM-DD'),
    STYLES: [basemap],
  };
}

/** Set the text covering the map
 * @param {string} text - Text to put over map
*/
export function setNoDataOverlay(text) {// eslint-disable-line no-unused-vars
  let state = STATE.get();
  const source = new ImageStatic({
    url: `${state.hemi}_nodata.png`,
    serverType: 'geoserver',
    projection: map.getView().getProjection(),
    imageExtent: CONSTANTS[state.hemi].extent,
  });

  const layer = new Image({source});
  map.addLayer(layer);
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

/** Recreate the map and projection objects
 * @return {array} - An array containing the map and projection objects
 */
export function resetMap() {
  $('#map').html('');// Empty map when a new animation occurs
  let projection = getProjection();
  let map = getMap(projection);
  map.addLayer(createLayer());
  return [map, projection];
}

/** Initialize the map settings
 * @return {Promise} - Resolves when loading is completed
*/
export function initialMapLoad() {
  return new Promise(function(resolve, reject) {
    STATE.readConfiguration();
    let map;
    let projection;
    [map, projection] = resetMap();
    loadWMS(map, projection);
    resolve();
  });
}

export {getSliderPositioning};
