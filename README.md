[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/bytes-counter.svg)](https://www.npmjs.com/package/@advanced-rest-client/bytes-counter)

[![Build Status](https://travis-ci.org/advanced-rest-client/bytes-counter.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/bytes-counter)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/@advanced-rest-client/bytes-counter)

An element that computes number of bytes in `String`, `ArrayBuffer`, `Blob` (and therefore `File`) and - in supported browsers - from `FormData`.

Note that Safari is excluded from FormData tests because there's some bug in WebKit implementation of the `Request` object and it doesn't read `FormData` properly. Chrome had similar bug but they fixed it already. See demo page to check if your browser support `FormData`.

This element is native web component without using any library.
Do not set attributes as this element do not observe changes to any. Use templating system of your choice to set a property on the element or use it imperatively.

## Example

### In a Polymer template

```html
<textarea value="{{value::input}}"></textarea>
<bytes-counter value="[[value]]" bytes="{{bytes}}"></bytes-counter>
```

### In a LitElement template

```javascript
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/bytes-counter/bytes-counter.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <textarea @input="${this._inputHandler}"></textarea>
    <bytes-counter .value="${this.value}" @change="${this._computeHandler}"></bytes-counter>
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

Note that computations are asynchronous and there is a delay between setting the `value` property and getting a result.

## New in version 3

-   Dropped support for Polymer library. It is not plain web component.
-   Added `aria-hidden` attribute
-   Added debouncer when setting the `value`
-   Deprecating `bytes-changed` event. Use `change` event instead. This event is kept for compatibility with Polymer.

### Development

```sh
git clone https://github.com/@advanced-rest-client/bytes-counter
cd bytes-counter
npm install
```

### Running the demo locally

```sh
npm start
```

### Running the tests
```sh
npm test
```
