import {CONSTANTS} from '../constants.js';


/** Read a json file
 * @param {string} filename - The file to be read
 * @return {string} - The json read from the file
*/
function readJSON(filename) {
  return new Promise(function(resolve, reject) {
    const request = new XMLHttpRequest();
    request.overrideMimeType('application/json');
    request.open('GET', filename, true);
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == '200') {
        resolve(JSON.parse(request.responseText));
      }
    };
    request.send(null);
  });
}

/** Run and return an XMLHttpRequest
 * @param {string} url - Request url
 * @return {string} - The returned information
*/
function runXMLHTTPRequest(url) {
  return new Promise(function(resolve, reject) {
    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == '200') {
        resolve(request.responseText);
      }
    };
    request.send(null);
  });
}

/** Run the GetCapabilities request to find available dates
 * @return {Promise} - Promise, resolves when request is complete
*/
function getValidDatesFromGetCapabilities() {
  return new Promise(async function(resolve, reject) {
    const gcr = CONSTANTS.getCapabilities;
    const requestHTTP = `${gcr.server}service=${gcr.service}&version=${gcr.version}&request=${gcr.request}`;
    const getCapabilities = await runXMLHTTPRequest(requestHTTP);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(getCapabilities, 'text/xml');
    const validDates = [];
    // Get layer tags in GetCapabilities XML
    const layers = xmlDoc.getElementsByTagName('Layer');
    for (let i = 0; i < layers.length; i++) { // Loop through all layer tags
      try {
        // Find the first (only) extent (dates) tag
        const datesArray = layers[i].getElementsByTagName('Extent')[0].textContent.split(',');
        // Add the extents to the state object
        validDates[layers[i].getElementsByTagName('Name')[0].textContent] = datesArray;
      } catch (error) {
        // Layer without extent tag, which means it is not relevant
      }
    }
    resolve(validDates);
  });
}

/** Pause execution for a set time in ms
 * @param {int} ms - Milliseconds to sleep for
 * @return {promise} - A promise that can be awaited for the specified time
*/
function sleep(ms) { // Sleep function for pauses between frames
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Get the last index of an array
 * @param {Array} arr - Array
 * @return {object} - The last index of the array
*/
function getLast(arr) {
  return (arr[arr.length - 1]);
}

export {readJSON, runXMLHTTPRequest, sleep, getLast, getValidDatesFromGetCapabilities};
