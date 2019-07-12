/**
@license
Copyright 2016 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/

/**
An element that computes number of bytes in `String`, `ArrayBuffer`, `Blob`
(and therefore `File`) and - in supported browsers - from `FormData`.

Note that Safari is excluded from FormData tests because there's some bug in
WebKit iplementation of the Request object and it doesn't read FormData
properly. Chrome had similar bug but they fixed it already. See demo page
to check if your browser support FormData.

This element is native web component without using any library.
Do not set attributes as this element do not observe changes to any. Use templating
system of your choice to set a property on the element or use it imperatively.

## Example

### In a Polymer template

```html
<textarea value="{{value::input}}"></textarea>
<bytes-counter value="[[value]]" bytes="{{bytes}}"></bytes-counter>
```

### In a LitElement template

```htlm
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/bytes-counter/bytes-counter.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <textarea oninput="${this._inputHandler}"></textarea>
    <bytes-counter .value="${this.value}" onchange="${this._computeHandler}"></bytes-counter>
    `;
  }

  _inputHandler(e) {
    const { value } = e.target;
    this.value = value;
  }

  _computeHandler(e) {
    const { value } = e.detail;
    console.log(`Computed input size is ${value} bytes`);
  }
}
customElements.define('sample-element', SampleElement);
```

### Imperative use

```html
<textarea id="i1"></textarea>
<bytes-counter id="b1"></bytes-counter>
<output id="o1"></output>
<script>
{
  document.getElementById('i1').addEventListener('input', (e) => {
    const { value } = e.target;
    document.getElementById('b1').value = value;
  });
  document.getElementById('b1').addEventListener('bytes-changed', (e) => {
    const { value } = e.detail;
    document.getElementById('o1').value = `Current input has ${value} bytes`;
  });
}
</script>
```

In the example above the `bytes` variable contains size of the input.

Note that computations are synchronous and there is a delay between setting the
`value` property (or calling `calculate()` function) and getting a result.

## New in version 3

- Dropped support for Polymer library. It is not plain web component.
- Added `aria-hidden` attribute

@customElement
@demo demo/index.html
@memberof LogicElements
*/
export class BytesCounter extends HTMLElement {
  /**
   * @return {String|Blob|ArrayBuffer|FormData}
   */
  get value() {
    return this._value;
  }
  /**
   * @param {String|Blob|ArrayBuffer|FormData} value A value to be evaluated.
   */
  set value(value) {
    const oldValue = this._value;
    if (oldValue === value) {
      return;
    }
    this._value = value;
    this._valueChanged();
  }
  /**
   * @return {Number} The size of the object passed to the `value` property.
   */
  get bytes() {
    return this.__bytes;
  }

  get _bytes() {
    return this.__bytes;
  }

  set _bytes(value) {
    this.__bytes = value;
    const opts = { detail: { value } };
    this.dispatchEvent(new CustomEvent('change', opts));
    // Polymer compability, this is deprecated
    this.dispatchEvent(new CustomEvent('bytes-changed', opts));
  }

  connectedCallback() {
    if (!this.hasAttribute('aria-hidden')) {
      this.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Dispatched when `bytes` property changed.
   * @event bytes-changed
   * @param {Number} value Calculated size of an object passed to the `value`
   * property in bytes.
   * @deprecated Listen for `change` event instead
   */

  /**
   * Called when `value` property changed. Asynchronusly calls `_computeValueSize()`
   * function.
   */
  _valueChanged() {
    if (this.__valueTimeout) {
      clearTimeout(this.__valueTimeout);
    }
    this.__valueTimeout = setTimeout(() => {
      this.__valueTimeout = undefined;
      this._computeValueSize();
    });
  }
  /**
   * Computes the size of passed value and sets `bytes` property.
   * @return {Promise}
   */
  async _computeValueSize() {
    const size = await this.calculate(this.value);
    this._bytes = size;
  }
  /**
   * Calculates number of bytes in the `value`.
   *
   * After computation it sets `bytes` property of the element.
   *
   * This function returns Promise but you may want to use synchronous versions
   * for values that contains a method to read size synchronously. Not all
   * values can be processed synchronously (FormData for example).
   *
   * @param {String|ArrayBuffer|Blob|File|FormData} value A value to compute
   * number of bytes from.
   * @return {Promise<Number>} Promise with number of bytes in the `value`. If
   * the `value` is not one of the supported types then the promise will
   * resolve to `undefined`;
   */
  calculate(value) {
    if (value === undefined || value === null) {
      this._bytes = 0;
      return Promise.resolve(0);
    }
    let size;
    if (typeof value === 'string') {
      size = this.stringBytes(value);
    } else if (value instanceof Blob) {
      size = this.blobBytes(value);
    } else if (value instanceof ArrayBuffer) {
      size = this.bufferBytes(value);
    } else if (value instanceof FormData ||
      (typeof URLSearchParams === 'function' && (value instanceof URLSearchParams))) {
      /* global URLSearchParams */
      size = this._bodyToArrayBuffer(value)
      .then((buffer) => this._handleBuffer(buffer));
    } else {
      size = this.stringBytes(String(value));
    }
    if (!(size instanceof Promise)) {
      size = Promise.resolve(size);
    }
    return size
    .catch((cause) => {
      console.warn(cause);
      this.dispatchEvent(new CustomEvent('error', {
        detail: {
          message: cause && cause.message ? cause.message : 'Your browser do not support this API.'
        }
      }));
    });
  }
  /**
   * Handles buffer size calculation.
   *
   * @param {ArrayBuffer} buffer Buffer created from the body.
   * @return {Promise} Promise resolved to number of bytes in the buffer.
   */
  _handleBuffer(buffer) {
    if (!buffer) {
      return Promise.reject(new Error('Your browser do not support Fetch API.'));
    }
    return Promise.resolve(this.bufferBytes(buffer));
  }
  /**
   * Calculates number of bytes in string.
   *
   * See: http://stackoverflow.com/a/23329386/1127848
   *
   * @param {String} str A value to evaluate
   * @return {Number} Number of bytes in the string.
   */
  stringBytes(str) {
    let s = str.length;
    for (let i = str.length - 1; i >= 0; i--) {
      const code = str.charCodeAt(i);
      if (code > 0x7f && code <= 0x7ff) {
        s++;
      } else if (code > 0x7ff && code <= 0xffff) {
        s += 2;
      }
      if (code >= 0xDC00 && code <= 0xDFFF) {
        i--; // trail surrogate
      }
    }
    return s;
  }
  /**
   * Calculates number of bytes in Blob (and therefore in File).
   *
   * @param {Blob|File} blob A value to evaluate
   * @return {Number} Number of bytes in the blob.
   */
  blobBytes(blob) {
    return blob.size;
  }
  /**
   * Calculates number of bytes in ArrayBuffer.
   *
   * Note, it is only possible to read number of allocated bytes by the buffer,
   * even if they are not containig any value. It is a size of the buffer at
   * the time it was created.
   *
   * @param {ArrayBuffer} buffer A value to evaluate
   * @return {Number} Number of bytes in the buffer.
   */
  bufferBytes(buffer) {
    return buffer.byteLength;
  }
  /**
   * Transfer any object that is acceptable as a bidy parameter in the Request
   * object to ArrayBuffer.
   *
   * @param {Blob|BufferSource|FormData|URLSearchParams|String} body An object
   * to pass to the Request object as a body property.
   * @return {Promise} Resolved promise with the ArrayBuffer. It will reject
   * if the browser doesn't support this method.
   */
  _bodyToArrayBuffer(body) {
    let request;
    try {
      request = new Request('/', {
        method: 'POST',
        body: body
      });
    } catch (e) {
      return Promise.reject(new Error('Your browser do not support Fetch API.'));
    }
    if (!request.arrayBuffer) {
      return Promise.reject(new Error('Your browser do not support this method.'));
    }
    return request.arrayBuffer()
    .catch((cause) => {
      console.warn('Request.arrayBuffer() is not supported in this browser.');
      console.warn(cause);
    });
  }
}
