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
import Projection from 'ol/proj/Projection';
import {getCenter} from 'ol/extent';

import * as STATE from './STATE.js';
import * as page from './page.js';
import * as timeline from './timeline.js';

import {CONSTANTS} from '../constants.js';

let MAP;
let PROJECTION;

/** Load the wms with the current params
 */
export async function loadWMS() {
  await updateWMSLayerParams();
}

/** Create a projection for a map
 */
export function getProjection() {
  let state = STATE.get();
  PROJECTION = new Projection({// Map projection
    code: CONSTANTS[state.hemi].srs,
    extent: CONSTANTS[state.hemi].extent,
  });
}

/** Update a given layer with specific parameters
 * @return {promise} - A promise of updating the layer
 */
export function updateWMSLayerParams() {
  let layer = MAP.getLayers().getArray()[0];
  let params = getWMSParams();
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
    MAP.once('rendercomplete', function(event) {
      if (state.temporality == 'daily') {
        $('#date').html(state.currentDate.format('YYYY-MM-DD'));
      } else {
        $('#date').html(state.currentDate.format('YYYY-MM'));
      }

      if (state.yearLoop) {
        let firstDate;
        let lastDate;
        [firstDate, lastDate] = timeline.getSliderPositioning(state);

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

/** Create a map */
export function getMap() {
  const extent = getLocationParams().extent;
  MAP = new Map({ // New map
    target: 'map', // Div in which the map is displayed
    view: new View({
      projection: PROJECTION,
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
  MAP.addControl(zoomToExtentControl);// Add control to reset view

  const zoomControl = new Zoom({
    size: [5, 5],
  });
  MAP.addControl(zoomControl);// Add control to reset view

  $('.ol-zoom-extent button').html(''); // Remove the default "E" from the zoom to extent button

  const wmsParams = getWMSParams();
  const source = new ImageWMS({
    url: 'https://nsidc.org/api/mapservices/NSIDC/wms',
    params: wmsParams,
    serverType: 'geoserver',
  });

  const layer = new Image({source});
  MAP.addLayer(layer);
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

/** Recreate the map and projection objects */
export function resetMap() {
  $('#map').html('');// Empty map when a new animation occurs
  getProjection();
  getMap();
}

/** Initialize the map settings
 * @return {Promise} - Resolves when loading is completed
*/
export function initialMapLoad() {
  return new Promise(function(resolve, reject) {
    STATE.readConfiguration();
    resetMap();
    loadWMS();
    resolve();
  });
}
