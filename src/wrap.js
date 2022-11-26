/*
The MIT License (MIT)

Copyright (c) 2021 Gregg Tavares

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import {augmentAPI} from './augment-api.js';

function wrapGetContext(Ctor) {
  const oldFn = Ctor.prototype.getContext;
  Ctor.prototype.getContext = function(type, ...args) {
    const ctx = oldFn.call(this, type, ...args);
    // Using bindTexture to see if it's WebGL. Could check for instanceof WebGLRenderingContext
    // but that might fail if wrapped by debugging extension
    if (ctx && ctx.bindTexture) {
      const config = {};
      augmentAPI(ctx, type, config);
      ctx.getExtension('GMAN_webgl_memory');
    }
    return ctx;
  };
}

if (typeof HTMLCanvasElement !== 'undefined') {
  wrapGetContext(HTMLCanvasElement);
}
if (typeof OffscreenCanvas !== 'undefined') {
  wrapGetContext(OffscreenCanvas);
}

