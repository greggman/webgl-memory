import {describe, it} from '../mocha-support.js';
import {assertEqual, assertTruthy} from '../assert.js';
import {createContext} from '../webgl.js';

describe('stack tests', () => {

  it('test stack capture', () => {
    const {gl, ext} = createContext();

    const tex1 = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, tex1);
    gl.texImage2D(gl.TEXTURE_2D, 1, gl.RGBA, 16, 8, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    const info = ext.getMemoryInfo();
    const {textures} = info;

    assertEqual(textures.length, 1);
    assertTruthy(textures[0].stackCreated);
    assertTruthy(textures[0].stackUpdated);

    gl.deleteTexture(tex1);
  });
});
