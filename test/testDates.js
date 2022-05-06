import {describe} from 'mocha';
import assert from 'assert';
import moment from 'moment';

import * as dates from '../public/modules/dates.js';
import * as STATE from '../public/modules/STATE.js';


/** General dates testing commands */
export function test() {
  let validDates = [];
  validDates['g02135_extent_raster_daily_n'] =
    ['1978-10-26T00:00:00.000Z', '1978-10-28T00:00:00.000Z', '1978-10-30T00:00:00.000Z'];
  STATE.set('validDates', validDates);
  describe('Test of dates module', function() {
    it('nextDate() moves to the correct next date', async function() {
      STATE.updateCurrentDate({year: 1978, month: 9, date: 28});
      let endDate = moment().set({year: 1978, month: 9, date: 30});
      let startDate = moment().set({year: 1978, month: 9, date: 26});
      STATE.set('endDate', endDate);
      STATE.set('startDate', startDate);
      dates.nextDate();
      assert.ok(
          STATE.getProp('currentDate').year() == 1978 &&
          STATE.getProp('currentDate').month() == 9 &&
          STATE.getProp('currentDate').date() == 30,
      );
    });
    it('nextDate() loops correctly to the start date', async function() {
      STATE.updateCurrentDate({year: 1978, month: 9, date: 30});
      let endDate = moment().set({year: 1978, month: 9, date: 30});
      let startDate = moment().set({year: 1978, month: 9, date: 26});
      STATE.set('endDate', endDate);
      STATE.set('startDate', startDate);
      dates.nextDate();
      assert.ok(
          STATE.getProp('currentDate').year() == 1978 &&
          STATE.getProp('currentDate').month() == 9 &&
          STATE.getProp('currentDate').date() == 26,
      );
    });
    it('nextDate() moves to the correct previous date', async function() {
      STATE.updateCurrentDate({year: 1978, month: 9, date: 28});
      let endDate = moment().set({year: 1978, month: 9, date: 30});
      let startDate = moment().set({year: 1978, month: 9, date: 26});
      STATE.set('endDate', endDate);
      STATE.set('startDate', startDate);
      dates.previousDate();
      assert.ok(
          STATE.getProp('currentDate').year() == 1978 &&
          STATE.getProp('currentDate').month() == 9 &&
          STATE.getProp('currentDate').date() == 26,
      );
    });
    it('nextDate() loops correctly to the end date', async function() {
      STATE.updateCurrentDate({year: 1978, month: 9, date: 26});
      let endDate = moment().set({year: 1978, month: 9, date: 30});
      let startDate = moment().set({year: 1978, month: 9, date: 26});
      STATE.set('endDate', endDate);
      STATE.set('startDate', startDate);
      dates.previousDate();
      assert.ok(
          STATE.getProp('currentDate').year() == 1978 &&
          STATE.getProp('currentDate').month() == 9 &&
          STATE.getProp('currentDate').date() == 30,
      );
    });
  });
}
