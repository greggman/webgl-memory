# WebGL-Memory

<img src="./webgl-memory.png" style="max-width: 640px">

This is a WebGL-Memory tracker. You add the script to your page
before you initialize WebGL and then for a given context
you can ask how much WebGL memory you're using.

Note: This is only a guess as various GPUs have different
internal requirements. For example a GPU might require that
RGB be expanded internally to RGBA. Similarly a GPU might
have alignment requirements. Still, this is likely to give
a reasonable approximation.

## Usage

```html
<script src="https://greggman.github.io/webgl-memory/webgl-memory.js" crossorigin></script>
```

or 

```js
import 'https://greggman.github.io/webgl-memory/webgl-memory.js';
```

Then in your code

```js
const ext = gl.getExtension('GMAN_webgl_memory');
...
if (ext) {
  const info = ext.getMemoryInfo();
}
```

The info returned is 

```js
{
  memory: {
    buffer: <bytes used by buffers>
    texture: <bytes used by textures>
    renderbuffer: <bytes used by renderbuffers>
    drawingbuffer: <bytes used by the canvas>
    total: <bytes used in total>
  },
  resources: {
    buffer: <count of buffers>,
    renderbuffer: <count of renderbuffers>
    program: <count of programs>
    query: <count of query objects, WebGL2 only>
    sampler: <count of samplers, WebGL2 only>
    shader: <count of shaders>
    sync: <count of sync objects, WebGL2 only>
    texture: <count of textures>
    transformFeedback: <count of transformfeedbacks, WebGL2 only>
    vertexArray: <count of vertexArrays, only if used or WebGL2>
  }
}
```

## Caveats

1. You must have WebGL error free code. 

   If your code is generating WebGL errors you must fix those first
   before using this library. Consider using [webgl-lint](https://greggman.github.io/webgl-lint) to help find your errors.

2. Resource reference counting is not supported.

   In WebGL if you delete a WebGLObject (a buffer, a texture, etc..),
   then, if that object is still attached to something else (a buffer
   attached to a vertex array, a texture attached to a framebuffer,
   a shader attached to a program), the object is not actually deleted
   until it's detached or the thing it's attached to is itself deleted  
   <sub>unless the thing it's attached to is currently bound. It's complicated 😭</sub>

   Tracking all of that in JavaScript is more work than I was willing
   to put in ATM. My belief is that the stuff that is still attached
   is usually not a problem because either (a) you'll delete the objects
   that are holding the attachments (b) you'll detach the attachments
   by binding new ones (c) you have a leak where you're creating more and
   more of these objects the hold attachments in which case you can find
   the issue by watching your resources counts climb.

   Given that it seemed okay to skip this for now.
   
3. `texImage2D/3D` vs `texStorage2D/3D`

   Be aware that `texImage2D/3D` *may* require double the memory of
   `texStorage2D/3D`. 

   Based on the design of `texImage2D/3D`, every mip level can have a
   different size/format and so until it's time to draw, there is
   no way to know if those levels will be updated by the app to be
   matching. Further, in WebGL2, there's no way to know before draw time
   if the app will set `TEXTURE_BASE_LEVEL` and `TEXTURE_MAX_LEVEL` to
   be a *texture complete* subset of mip levels.
   
   WebGL-memory does not report this difference
   because it's up to the implementation what really happens behind the scenes.
   In general though, `texStorage2D/3D` has a much higher probablility
   of using less memory overall.
   
   The tradeoff for using `texStorage` is that the texture's size is immutable. 
   So, for example, if you wanted to wrap a user's image to a cube, and then
   change that image when the user selects a different sized image, with `texImage`
   you can just upload the new image to the existing texture. With `texStorage`
   you'd be required to create a new texture. 
   
4. `ELEMENT_ARRAY_BUFFER`

   Buffers used with `ELEMENT_ARRAY_BUFFER` may need a second copy in ram.
   This is because WebGL requires no out of bounds memory access (eg,
   you have a buffer with 10 vertices but you have an index greater >= 10).
   This can be handled in 2 ways (1) if the driver advertizes "robustness"
   then rely on the driver (2) keep a copy of that data in ram and check
   before draw time that no indices are out of range.
   
   WebGL-memory does not report this difference because it's up to the
   implementation. Further, unlike the texture issue above there is
   nothing an app can do. Fortunately such buffers are usually
   a small percent of the data used by most WebGL apps.

## Example:

[Click here for an Example](https://jsgist.org/?src=57dafa41cb1d2d5bc1520832db49f946)  
[Unity example here](https://greggman.github.io/webgl-memory-unity-example/)

## Development

```bash
git clone https://github.com/greggman/webgl-memory.git
cd webgl-memory
npm install
```

now serve the folder

```
npx servez
```

and go to [`http://localhost:8080/test?src=true`](http://localhost:8080/test?src=true)

`src=true` tells the test harness to use the unrolled source from the `src` folder
where as without it uses `webgl-memory.js` in the root folder which is built using
`npm run build`.

`grep=<some expression>` will limit the tests as in `...?src=true&grep=renderbuffer` only
runs the tests with `renderbuffer` in their description.

## Live Tests

[built version](https://greggman.github.io/webgl-memory/test/)  
[source version](https://greggman.github.io/webgl-memory/test/?src=true)

## Thoughts

I'm not totally convinced this is the right way to do this. If I was making a
webgl app and I wanted to know this stuff I think I'd track it myself by wrapping
my own creation functions.

In other words, lets say I wanted to know how many times I call
`fetch`.

```js
const req = await fetch(url);
const text = await req.text();
```

I'd just refactor that 

```js
let fetchCount = 0;
function doFetch(url) {
  fetchCount++;
  return fetch(url);
}

...
const req = await doFetch(url);
const text = await req.text();
```

No need for some fancy library. Simple.

I could do similar things for WebGL functions.

```js
let textureCount = 0;
function makeTexture(gl) {
  textureCount++;
  return gl.createTexture(gl);
}
function freeTexture(gl, tex) {
  --textureCount;
  gl.deleteTexture(tex);
}

const tex = makeTexture(gl);
...
freeTexture(gl, tex);
```

Also, even if webgl-memory is an okay way to do it I'm not sure making it an extension was the best way
vs just some library you call like `webglMemoryTracker.init(someWebGLRenderingContext)`. 
I structured it this way just because I used [webgl-lint](https://greggman.github.io/webgl-lint) as
the basis to get this working.

## Licence

[MIT](https://github.com/greggman/webgl-memory/blob/main/LICENCE.md)
