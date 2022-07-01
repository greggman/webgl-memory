import assert, { assertEqual, assertFalsy } from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext} from '../webgl.js';
import {MemInfoTracker} from './test-utils.js';

function createExposedPromise() {
  const p = {};
  p.promise = new Promise((resolve, reject) => {
    p.resolve = resolve;
    p.reject = reject;
  });
  return p;
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('webgl context lost tests', () => {

  async function testContextLost(gl) {
    const contextLostExposedPromise = createExposedPromise();
    const contextRestoredExposedPromise = createExposedPromise();

    const handleContextLost = e => {
      // To enable context restoration we must preventDefault on the context loss event:
      e.preventDefault();
      contextLostExposedPromise.resolve();
    };
    const handleContextRestored = _ => {
      contextRestoredExposedPromise.resolve();
    };

    gl.canvas.addEventListener('webglcontextlost', handleContextLost);
    gl.canvas.addEventListener('contextlost', handleContextLost);

    gl.canvas.addEventListener('webglcontextrestored', handleContextRestored);
    gl.canvas.addEventListener('contextrestored', handleContextRestored);

    const loseContextExt = gl.getExtension('WEBGL_lose_context');
    const oesVertexArrayExt = gl.getExtension('OES_vertex_array_object');
    if (!loseContextExt && !oesVertexArrayExt) {
      return;
    }
    const memExt = gl.getExtension('GMAN_webgl_memory');

    const tracker = new MemInfoTracker(gl, 'texture');

    // Add a texture
    const tex1 = gl.createTexture();
    tracker.addObjects(1);
    gl.bindTexture(gl.TEXTURE_2D, tex1);
    const texSize = 32 * 16 * 4;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 16, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    tracker.addMemory(texSize);

    const va = oesVertexArrayExt.createVertexArrayOES();
    oesVertexArrayExt.bindVertexArrayOES(va);
    assertEqual(memExt.getMemoryInfo().resources.vertexArray, 1);

    // Force context loss and wait for event loop to complete
    loseContextExt.loseContext();
    await contextLostExposedPromise.promise;
    await wait();

    // Verify memory tracking was zeroed out
    tracker.deleteObjectAndMemory(texSize, 1);
    assertEqual(memExt.getMemoryInfo().resources.vertexArray, 0);

    // Check that calling functions while context is lost does not add memory
    gl.bindTexture(gl.TEXTURE_2D, tex1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 16, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    tracker.addMemory(0);

    oesVertexArrayExt.createVertexArrayOES();
    assertEqual(memExt.getMemoryInfo().resources.vertexArray, 0);

    // Check that getting an extension while context lost returns null?
    // Actually not entirely sure what's supposed to happen here.
    const ext = gl.getExtension('OES_vertex_array_object');
    assertFalsy(ext);

    // Force context restoration and wait for event loop to complete
    loseContextExt.restoreContext();

    await contextRestoredExposedPromise.promise;
    await wait();

    // Verify you can still add new things
    const tex2 = gl.createTexture();
    tracker.addObjects(1);
    gl.bindTexture(gl.TEXTURE_2D, tex2);
    const texSize2 = 64 * 24 * 4;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 64, 24, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    tracker.addMemory(texSize2);

    // Check that old extensions do not add new info
    oesVertexArrayExt.createVertexArrayOES();
    assertEqual(memExt.getMemoryInfo().resources.vertexArray, 0);

    // Check that new extensions do add new info
    const newOESVertexArrayExt = gl.getExtension('OES_vertex_array_object');
    if (!newOESVertexArrayExt) {
      return;
    }

    newOESVertexArrayExt.createVertexArrayOES();
    assertEqual(memExt.getMemoryInfo().resources.vertexArray, 1);
  }

  it('test context loss', async () => {
    const {gl} = createContext();
    await testContextLost(gl);
  });

  it('test context loss OffscreenCanvas', async () => {
    if (typeof OffscreenCanvas === 'undefined') {
      return;
    }

    const gl = new OffscreenCanvas(300, 150).getContext('webgl');
    await testContextLost(gl);
  });

});
