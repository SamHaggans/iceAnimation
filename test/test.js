import * as testSTATE from './testSTATE.js';
import * as testDates from './testDates.js';
import * as util from '../public/modules/util.js';

/** General testing */
async function runTests() {
  await util.getValidDatesFromGetCapabilities();
  console.log("here");
}

runTests();

console.log('\n\n\n\n\n\n\n\n\n\n\n');

console.log('-------Begin Testing-------');

testSTATE.test();

console.log('\n\n\n');

testDates.test();
