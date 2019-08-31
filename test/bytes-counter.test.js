import { fixture, assert, aTimeout } from '@open-wc/testing';
import * as sinon from 'sinon/pkg/sinon-esm.js';
import '../bytes-counter.js';

const hasSearchParams = typeof URLSearchParams === 'function';

describe('<bytes-counter>', function() {
  async function basicFixture() {
    return (await fixture(`<bytes-counter></bytes-counter>`));
  }

  async function ariaHiddenFixture() {
    return (await fixture(`<bytes-counter aria-hidden="false"></bytes-counter>`));
  }

  describe('Basics', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('value is undefined', () => {
      assert.isUndefined(element.value);
    });

    it('bytes is undefined', () => {
      assert.isUndefined(element.bytes);
    });

    it('Calls _valueChanged() when value change', () => {
      const spy = sinon.spy(element, '_valueChanged');
      element.value = 'test';
      assert.isTrue(spy.called);
      clearTimeout(element.__valueTimeout);
    });

    it('Won\'t call _valueChanged() when value is the same', () => {
      element.value = 'test';
      clearTimeout(element.__valueTimeout);
      const spy = sinon.spy(element, '_valueChanged');
      element.value = 'test';
      assert.isFalse(spy.called);
    });

    it('Returns set _bytes', () => {
      element._bytes = 1;
      assert.equal(element._bytes, 1);
    });

    it('Returns set value', () => {
      element.value = 'test';
      clearTimeout(element.__valueTimeout);
      assert.equal(element.value, 'test');
    });
  });

  function performMapit(element, map, fnCall) {
    const iterator = map.entries();
    const state = true;
    while (state) {
      const entry = iterator.next();
      if (entry.done) {
        break;
      }
      const item = entry.value;
      const size = element[fnCall](item[0]);
      assert.equal(size, item[1][0], 'Size of "' + item[0] + '" equals ' + item[1][0] + ': ' + item[1][1]);
    }
  }

  function getBuffer(text) {
    let value;
    if ('TextEncoder' in window) {
      const encoder = new TextEncoder();
      const encoded = encoder.encode(text);
      value = encoded.buffer;
    } else {
      const str = text;
      value = new ArrayBuffer(str.length * 2); // 2 bytes for each char
      const bufView = new Uint16Array(value);
      for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
    }
    return value;
  }

  describe('stringBytes()', () => {
    let element;
    const model = new Map([
      ['a', [1, 'a has size 1']],
      ['ł', [2, 'ł has size 2']],
      ['1', [1, '1 has size 1']],
      ['�', [3, '� has size 3']]
    ]);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('computes size of input: string', () => {
      performMapit(element, model, 'stringBytes');
    });
  });

  describe('blobBytes()', () => {
    let element;
    const model = new Map([
      [new Blob(['a']), [1, 'a has size 1']],
      [new Blob(['ą']), [2, 'ą has size 2']],
      [new Blob(['1']), [1, '1 has size 1']]
    ]);

    beforeEach(async () => {
      element = await basicFixture();
    });

    it('computes size of input: blob', () => {
      performMapit(element, model, 'blobBytes');
    });
  });

  describe('bufferBytes()', function() {
    let element;
    const model = new Map([
      [getBuffer('a'), [1, 'a has size 1']],
      [getBuffer('ą'), [2, 'ą has size 2']],
      [getBuffer('1'), [1, '1 has size 1']]
    ]);

    beforeEach(async function() {
      // Apparently Edge has some wired thing for ArrayBuffer.
      // I don't care enough for few % browser to even investigate.
      // Send PR if you figure it out.
      if (/Edge/.test(navigator.userAgent)) {
        // eslint-disable-next-line
        this.skip();
      } else {
        element = await basicFixture();
      }
    });

    it('computes size of input: array buffer', () => {
      performMapit(element, model, 'bufferBytes');
    });
  });

  describe('_bodyToArrayBuffer()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Transforms Blob to array buffer', async () => {
      const result = await element._bodyToArrayBuffer(new Blob(['a']));
      assert.typeOf(result, 'arraybuffer');
    });

    it('Transforms String to array buffer', async () => {
      const result = await element._bodyToArrayBuffer('test');
      assert.typeOf(result, 'arraybuffer');
    });

    it('Transforms FormData to array buffer', async () => {
      const fd = new FormData();
      fd.append('a', 'b');
      const result = await element._bodyToArrayBuffer(fd);
      // For browsers that do not understand this....
      if (result !== undefined) {
        assert.typeOf(result, 'arraybuffer');
      }
    });

    it('Rejects when Request is not defined', () => {
      const orig = window.Request;
      window.Request = undefined;
      return element._bodyToArrayBuffer('test')
      .then(() => {
        throw new Error('Should reject promise');
      })
      .catch((cause) => {
        window.Request = orig;
        assert.equal(cause.message, 'Your browser do not support Fetch API.');
      });
    });
  });

  describe('_handleBuffer()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Rejects when no argument', () => {
      return element._handleBuffer()
      .then(() => {
        throw new Error('Should reject promise');
      })
      .catch((cause) => {
        assert.equal(cause.message, 'Your browser do not support Fetch API.');
      });
    });

    it('Reads size of the buffer', async () => {
      const buffer = new Uint16Array([1, 2, 3]).buffer;
      const result = await element._handleBuffer(buffer);
      assert.equal(result, 6);
    });
  });

  describe('calculate()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Resolves to 0 when no argument', async () => {
      const result = await element.calculate();
      assert.equal(result, 0);
    });

    it('Resolves to 0 when argument is undefined', async () => {
      const result = await element.calculate(null);
      assert.equal(result, 0);
    });

    it('Resolves to 0 when argument is null', async () => {
      const result = await element.calculate(null);
      assert.equal(result, 0);
    });

    it('Resolves to size of string', async () => {
      const result = await element.calculate('test');
      assert.equal(result, 4);
    });

    it('Resolves to size of Blob', async () => {
      const input = new Blob(['a']);
      const result = await element.calculate(input);
      assert.equal(result, 1);
    });

    it('Resolves to size of ArrayBuffer', async () => {
      const input = new ArrayBuffer(6);
      const result = await element.calculate(input);
      assert.equal(result, 6);
    });

    it('Resolves to size of FormData', async () => {
      const fd = new FormData();
      fd.append('a', 'b');
      const result = await element.calculate(fd);
      // For browsers not supporting Fetch API in full
      if (result !== undefined) {
        assert.isAbove(result, 0);
      }
    });

    it('Resolves to size of casted string', async () => {
      const result = await element.calculate(2);
      assert.equal(result, 1);
    });
  });

  describe('_valueChanged()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Sets __valueTimeout', () => {
      element._valueChanged();
      assert.typeOf(element.__valueTimeout, 'number');
      clearTimeout(element.__valueTimeout);
    });

    it('Clears previously set timeout', () => {
      element._valueChanged();
      const spy = sinon.spy(window, 'clearTimeout');
      element._valueChanged();
      window.clearTimeout.restore();
      clearTimeout(element.__valueTimeout);
      assert.isTrue(spy.called);
    });

    it('Eventually calls _computeValueSize()', async () => {
      const spy = sinon.spy(element, '_computeValueSize');
      element._valueChanged();
      await aTimeout();
      assert.isTrue(spy.called);
    });

    it('Eventually clears __valueTimeout', async () => {
      element._valueChanged();
      await aTimeout();
      assert.isUndefined(element.__valueTimeout);
    });
  });

  describe('URLSearchParams', function() {
    let element;
    before(async function() {
      if (hasSearchParams) {
        element = await basicFixture();
      } else {
        // eslint-disable-next-line
        this.skip();
      }
    });

    it('Computes size for search params', async () => {
      const p = new URLSearchParams();
      p.append('param', 'test');
      const result = await element.calculate(p);
      assert.equal(result, 10);
    });
  });

  describe('Events', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Dispatches "change" event when setting value attribute', (done) => {
      element.value = 'test';
      element.addEventListener('change', (e) => {
        assert.equal(e.detail.value, 4);
        done();
      });
    });

    it('Dispatches "bytes-changed" event when setting value attribute', (done) => {
      element.value = 'test';
      element.addEventListener('bytes-changed', (e) => {
        assert.equal(e.detail.value, 4);
        done();
      });
    });

    it('Does not dispatches "change" event when callikng calculate', async () => {
      const spy = sinon.spy();
      element.addEventListener('bytes-changed', spy);
      await element.calculate('test');
      assert.isFalse(spy.called);
    });
  });

  describe('a11y', () => {
    it('Sets aria-hidden attribute', async () => {
      const element = await basicFixture();
      assert.equal(element.getAttribute('aria-hidden'), 'true');
    });

    it('Respects existin aria-hidden', async () => {
      const element = await ariaHiddenFixture();
      assert.equal(element.getAttribute('aria-hidden'), 'false');
    });

    it('Sets aria-hidden attribute', async () => {
      const element = await basicFixture();
      await assert.isAccessible(element);
    });
  });
});
