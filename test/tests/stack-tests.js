import {describe, it} from '../mocha-support.js';
import {assertEqual, assertFalsy, assertTruthy} from '../assert.js';
import {createContext} from '../webgl.js';

describe('stack tests', () => {

  it('test texture stack capture', () => {
    const {gl, ext} = createContext();

    const tex1 = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, tex1);
    gl.texImage2D(gl.TEXTURE_2D, 1, gl.RGBA, 16, 8, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    {
      const textures = ext.getResourcesInfo(WebGLTexture);
      assertEqual(textures.length, 1);
      assertTruthy(textures[0].stackCreated);
      assertTruthy(textures[0].stackUpdated);
    }

    gl.deleteTexture(tex1);

    {
      const textures = ext.getResourcesInfo(WebGLTexture);
      assertEqual(textures.length, 0);
    }
  });

  it('test buffers stack capture', () => {
    const {gl, ext} = createContext();

    const buf = gl.createBuffer();

    {
      const buffers = ext.getResourcesInfo(WebGLBuffer);
      assertEqual(buffers.length, 1);
      assertTruthy(buffers[0].stackCreated);
      assertFalsy(buffers[0].stackUpdated);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, 16, gl.STATIC_DRAW);

    {
      const buffers = ext.getResourcesInfo(WebGLBuffer);
      assertEqual(buffers.length, 1);
      assertTruthy(buffers[0].stackCreated);
      assertTruthy(buffers[0].stackUpdated);
    }

    gl.deleteBuffer(buf);

    {
      const buffers = ext.getResourcesInfo(WebGLBuffer);
      assertEqual(buffers.length, 0);
    }
  });

  it('test program stack capture', () => {
    const {gl, ext} = createContext();

    const program = gl.createProgram();

    {
      const programs = ext.getResourcesInfo(WebGLProgram);
      assertEqual(programs.length, 1);
      assertTruthy(programs[0].stackCreated);
    }

    gl.deleteProgram(program);

    {
      const programs = ext.getResourcesInfo(WebGLProgram);
      assertEqual(programs.length, 0);
    }
  });

});
