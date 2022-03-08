import { describe, it } from '../mocha-support.js';
import { createContext } from '../webgl.js';
import { MemInfoTracker } from './test-utils.js';

describe('webgl context loss tests', () => {
  it('test context loss', async () => {
    const { gl } = createContext();
    // To enable context restoration we must preventDefault on the context loss event:
    gl.canvas.addEventListener('webglcontextlost', e => e.preventDefault());
    const ext = gl.getExtension('WEBGL_lose_context');
    const tracker = new MemInfoTracker(gl, 'texture');

    // Add a texture
    const tex1 = gl.createTexture();
    tracker.addObjects(1);
    gl.bindTexture(gl.TEXTURE_2D, tex1);
    const texSize = 32 * 16 * 4;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 16, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    tracker.addMemory(texSize);

    // Force context loss and wait for event loop to complete
    ext.loseContext();
    await delay(1);

    // Verify memory tracking was zeroed out
    tracker.deleteObjectAndMemory(texSize, 1);

    // Force context restoration and wait for event loop to complete
    ext.restoreContext();
    await delay(1);

    // Verify you can still add new things
    const tex2 = gl.createTexture();
    tracker.addObjects(1);
    gl.bindTexture(gl.TEXTURE_2D, tex2);
    const texSize2 = 64 * 24 * 4;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 64, 24, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    tracker.addMemory(texSize2);
  });
});

async function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
