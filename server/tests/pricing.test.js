import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculatePricing} from '../src/utils/pricing.js';
import {toUZS,formatUZS} from '../../shared/currency.js';
test('Пять суток и фиксированный курс',()=>{const p=calculatePricing(45,'2030-01-01T05:00:00Z','2030-01-06T05:00:00Z');assert.equal(p.totalPrice,225);assert.equal(toUZS(p.totalPrice),2677500);assert.equal(formatUZS(toUZS(45)),'535 500 сум');});
test('Услуги за каждые начатые сутки',()=>{const p=calculatePricing(30,'2030-01-01T05:00:00Z','2030-01-02T06:00:00Z',[{price:5}]);assert.equal(p.daysCount,2);assert.equal(p.totalPrice,70);});
test('Некорректные периоды отклоняются',()=>{assert.throws(()=>calculatePricing(30,'bad','2030-01-01'));assert.throws(()=>calculatePricing(30,'2030-01-02','2030-01-01'));});
