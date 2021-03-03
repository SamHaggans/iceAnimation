import {describe} from 'mocha';
import * as assert from 'assert';

import * as STATE from '../public/modules/STATE.js';

/** General STATE testing commands */
export function test() {
  describe('Test of STATE module', function() {
    it('STATE.get() returns correct defaults', function() {
      let state = STATE.get();
      assert(
          state.stop == true &&
          state.rate == 100 &&
          state.currentDate._isValid &&
          state.startDate._isValid &&
          state.endDate._isValid &&
          state.startYear._isValid &&
          state.startYear._isValid &&
          state.dataType == 'extent' &&
          state.hemi == 'n' &&
          state.temporality == 'daily' &&
          state.yearLoop == false &&
          state.validDates.length == 0,
      );
    });

    it('STATE.getProp() returns the correct object from STATE', function() {
      let currentDate = STATE.getProp('currentDate');
      assert(
          currentDate._isValid,
      );
    });

    it('STATE.set() correctly sets the selected property', function() {
      STATE.set('stop', true);
      let stop = STATE.getProp('stop');
      assert(stop);
    });

    it('STATE.updateCurrentDate() correctly updates the currentDate object', function() {
      STATE.updateCurrentDate({'year': 2000});
      let currentDate = STATE.getProp('currentDate');
      assert(currentDate.year() == 2000);
    });

    it('STATE.addToCurrentDate() correctly adds to and updates the currentDate object', function() {
      STATE.updateCurrentDate({'year': 2000});
      STATE.addToCurrentDate({years: 10});
      let currentDate = STATE.getProp('currentDate');
      assert(currentDate.year() == 2010);
    });

    it('STATE.subtractFromCurrentDate() correctly subtracts from and updates the currentDate object', function() {
      STATE.updateCurrentDate({'year': 2000});
      STATE.subtractFromCurrentDate({years: 10});
      let currentDate = STATE.getProp('currentDate');
      assert(currentDate.year() == 1990);
    });
  });
}
