[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/bytes-counter.svg)](https://www.npmjs.com/package/@advanced-rest-client/bytes-counter)

[![Build Status](https://travis-ci.org/advanced-rest-client/bytes-counter.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/bytes-counter)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/bytes-counter)

## BytesCounter component

An element that computes number of bytes in `String`, `ArrayBuffer`, `Blob`
(and therefore `File`) and, in browsers supported Fetch API, from `FormData`.

Note that Safari is excluded from FormData tests because there's some bug in
WebKit iplementation of the Request object and it doesn't read FormData
properly. Chrome had similar bug but they fixed it already. See demo page
to check if your browser support FormData.

### Example

```html
<textarea value="{{value::input}}"></textarea>
<bytes-counter value="[[value]]" bytes="{{bytes}}"></bytes-counter>
```

In the example above the `bytes` variable contains size of the input.

Note that computations are synchronous and there is a delay between setting the
`value` property (or calling `calculate()` function) and getting a result.

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @advanced-rest-client/bytes-counter
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/bytes-counter/bytes-counter.js';
    </script>
  </head>
  <body>
    <bytes-counter></bytes-counter>
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@advanced-rest-client/bytes-counter/bytes-counter.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <bytes-counter></bytes-counter>
    `;
  }

  _authChanged(e) {
    console.log(e.detail);
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/bytes-counter
cd bytes-counter
npm install
npm install -g polymer-cli
```

### Running the demo locally

```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/
```

### Running the tests
```sh
polymer test --npm
```
