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

import {CONSTANTS} from './constants.js';
import './style.css';

// Static Image Assets
import extentLegend from './assets/extent_legend.png';
import concentrationLegend from './assets/concentration_legend.png';

/** Method to load the wms with the current params
 * @return {array} - An array containing the map and projection objects
 * @param {map} map - The map to be used
 * @param {projection} projection - The projection to be used
 * @param {object} STATE animation state
 */
async function loadWMS(map, projection, STATE) {
  await updateWMSLayerParams(map, map.getLayers().getArray(), STATE);
}

/** Method to create a projection for a map
 * @return {projection} projection
 * @param {object} STATE animation state
 */
function getProjection(STATE) {
  const projection = new Projection({// Map projection
    code: CONSTANTS[STATE.hemi].srs,
    extent: CONSTANTS[STATE.hemi].extent,
  });
  return projection;
}

/** Method to update the map layers
 * @param {map} map Map to be updated
 * @param {layer} layer - The layer to be updated
 * @param {object} params - The parameters to be updated
 * @return {promise} - A promise of updating the layer
 * @param {object} STATE animation state
 */
function updateWMSLayerParams(map, layer, params, STATE) {
  toggleLegend(STATE);
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
      if (STATE.temporality == 'daily') {
        $('#date').html(STATE.current.format('YYYY-MM-DD'));
      } else {
        $('#date').html(STATE.current.format('YYYY-MM'));
      }
      // Delete interval requests after load
      clearInterval(interval);
      // Wait for map to be ready to change the date tag
      resolve();
    });
  });
}

/** Method to create a layer for a map
 * @return {layer} layer
 * @param {object} STATE animation state
 */
function createLayer(STATE) {
  const wmsParams = getWMSParams(STATE);
  const source = new ImageWMS({
    url: 'https://nsidc.org/api/mapservices/NSIDC/wms',
    params: wmsParams,
    serverType: 'geoserver',
  });

  const layer = new Image({source});
  return layer;
}

/** Method to create a map
 * @return {map} Map
 * @param {projection} projection - The Projection to create the map with
 * @param {object} STATE Animation State
 */
function getMap(projection, STATE) {
  const extent = getLocationParams(STATE).extent;
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
    extent: getLocationParams(STATE).extent,
    size: [5, 5],
  });
  map.addControl(zoomToExtentControl);// Add control to reset view

  const zoomControl = new Zoom({
    size: [5, 5],
  });
  map.addControl(zoomControl);// Add control to reset view

  return map;
}

/** Method to create a map
 * @return {object} The parameters
 * @param {object} STATE Animation state
 */
function getLocationParams(STATE) {
  const extent = CONSTANTS[STATE.hemi].extent;// Map size
  // var extent = [0,0,0,0];

  $('#map').css('width', CONSTANTS[STATE.hemi].css.width);
  $('#map').css('height', CONSTANTS[STATE.hemi].css.height);
  $('#mapContainer').css('width', CONSTANTS[STATE.hemi].css.width);
  $('#mapContainer').css('height', CONSTANTS[STATE.hemi].css.height);
  $('#legendContainer').css('width', CONSTANTS[STATE.hemi].css.width);
  $('#mapAlert').css('left', CONSTANTS[STATE.hemi].css.width*0.30);
  $('#mapAlert').css('top', CONSTANTS[STATE.hemi].css.height*0.7);
  const locationVal = CONSTANTS[STATE.hemi].locationVal;
  const width = CONSTANTS[STATE.hemi].width;
  const height = CONSTANTS[STATE.hemi].height;
  const srs = CONSTANTS[STATE.hemi].srs;// Location for request url

  return {extent: extent, locationVal: locationVal, width: width, height: height, srs: srs};
}

/** Method to set the wms parameters
 * @return {object} wmsParameters
 * @param {object} STATE Animation State
 */
function getWMSParams(STATE) {
  let sourceType = 'monthly';
  if (STATE.temporality == 'daily') {
    sourceType = 'daily';
  }
  const basemap = 'NSIDC:g02135_' + STATE.dataType+ '_raster_basemap';
  // const withMissing = 'NSIDC:g02135_' + STATE.dataType+ '_raster_with_missing';
  return {
    LAYERS: 'NSIDC:g02135_' + STATE.dataType + `_raster_${sourceType}_` + STATE.hemi,
    SRS: getLocationParams(STATE).srs,
    BBOX: getLocationParams(STATE).locationVal,
    TILED: false,
    format: 'image/png',
    TIME: STATE.current.format('YYYY-MM-DD'),
    STYLES: [basemap],
  };
}

/** Method to set the text covering the map (currently unused)
 * @param {string} text - Text to put over map
 * @param {object} STATE - Animation State
*/
function setNoDataOverlay(text, STATE) {// eslint-disable-line no-unused-vars
  const source = new ImageStatic({
    url: `${STATE.hemi}_nodata.png`,
    serverType: 'geoserver',
    projection: map.getView().getProjection(),
    imageExtent: CONSTANTS[STATE.hemi].extent,
  });

  const layer = new Image({source});
  map.addLayer(layer);
}

/** Method to set the visibility of the legend
 * @param {object} STATE animation state
 */
function toggleLegend(STATE) {
  if (STATE.dataType == 'extent') {
    $('#legend').attr('src', extentLegend);
  }
  if (STATE.dataType == 'concentration') {
    $('#legend').attr('src', concentrationLegend);
  }
}

const methods = {
  loadWMS: loadWMS,
  getProjection: getProjection,
  createLayer: createLayer,
  getMap: getMap,
  getLocationParams, getLocationParams,
  getWMSParams: getWMSParams,
  setNoDataOverlay: setNoDataOverlay,
  updateWMSLayerParams: updateWMSLayerParams,
};

export default methods;
