import {assertThrowsWith} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext, createContext2} from '../webgl.js';
import {MemInfoTracker} from './test-utils.js';

describe('tex-image tests', () => {

  it('test texImage2D', () => {
    const {gl} = createContext();
    const tracker = new MemInfoTracker(gl, 'texture');

    const tex1 = gl.createTexture();
    tracker.addObjects(1);

    gl.bindTexture(gl.TEXTURE_2D, tex1);
    gl.texImage2D(gl.TEXTURE_2D, 1, gl.RGBA, 16, 8, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const mip1Size = 16 * 8 * 4;
    tracker.addMemory(mip1Size);

    const mip0Size = 32 * 16 * 4;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 16, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    tracker.addMemory(mip0Size);

    gl.generateMipmap(gl.TEXTURE_2D);
    const texSize = (
      32 * 16 +   // level0
      16 * 8 +    // level1
      8 * 4 +     // level2
      4 * 2 +     // level3
      2 * 1 +     // level4
      1 * 1) * 4; // level5
    tracker.addMemory(texSize - mip0Size - mip1Size);

    gl.deleteTexture(tex1);
    tracker.deleteObjectAndMemory(texSize);
  });

  it('test OES_texture_float', () => {
    const {gl} = createContext();
    const ext = gl.getExtension('OES_texture_float');
    if (!ext) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'texture');

    const tex1 = gl.createTexture();
    tracker.addObjects(1);

    gl.bindTexture(gl.TEXTURE_2D, tex1);
    gl.texImage2D(gl.TEXTURE_2D, 1, gl.RGBA, 16, 8, 0, gl.RGBA, gl.FLOAT, null);
    const mip1Size = 16 * 8 * 16;
    tracker.addMemory(mip1Size);

    const mip0Size = 32 * 16 * 16;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 16, 0, gl.RGBA, gl.FLOAT, null);
    tracker.addMemory(mip0Size);

    gl.deleteTexture(tex1);
    tracker.deleteObjectAndMemory(mip1Size + mip0Size);
  });

  it('test texImage3D', () => {
    const {gl} = createContext2();
    if (!gl) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'texture');

    const tex1 = gl.createTexture();
    tracker.addObjects(1);

    gl.bindTexture(gl.TEXTURE_3D, tex1);
    gl.texImage3D(gl.TEXTURE_3D, 1, gl.RGBA, 10, 20, 5, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const mip1Size = 10 * 20 * 5 * 4;
    tracker.addMemory(mip1Size);

    const mip0Size = 30 * 15 * 6 * 4;
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA, 30, 15, 6, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    tracker.addMemory(mip0Size);

    gl.generateMipmap(gl.TEXTURE_3D);
    const texSize = 4 * (
      30 * 15 * 6 +  // level0
      15 *  8 * 3 +  // level1
       8 *  4 * 2 +  // level2
       4 *  2 * 1 +  // level3
       2 *  1 * 1 +  // level4
       1 *  1 * 1);  // level5
    tracker.addMemory(texSize - mip0Size - mip1Size);

    gl.deleteTexture(tex1);
    tracker.deleteObjectAndMemory(texSize);
  });

  it('test texStorage2D', () => {
    const {gl} = createContext2();
    if (!gl) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'texture');

    const tex1 = gl.createTexture();
    tracker.addObjects(1);

    gl.bindTexture(gl.TEXTURE_2D, tex1);
    gl.texStorage2D(gl.TEXTURE_2D, 4, gl.RGB16I, 10, 20);
    const size = 6 * (
      10 * 20 +  // level0
       5 * 10 +  // level1
       3 *  5 +  // level2
       2 *  3    // level3
      );
    tracker.addMemory(size);

    gl.deleteTexture(tex1);
    tracker.deleteObjectAndMemory(size);
  });

  it('test texStorage3D', () => {
    const {gl} = createContext2();
    if (!gl) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'texture');

    const tex1 = gl.createTexture();
    tracker.addObjects(1);

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex1);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 4, gl.RGB16I, 10, 20, 6);
    const size = 6 * (
      10 * 20 * 6 +  // level0
       5 * 10 * 6 +  // level1
       3 *  5 * 6 +  // level2
       2 *  3 * 6    // level3
      );
    tracker.addMemory(size);

    gl.deleteTexture(tex1);
    tracker.deleteObjectAndMemory(size);
  });

  it('test copyTexImage2D', () => {
    const {gl} = createContext();
    const tracker = new MemInfoTracker(gl, 'texture');

    const tex1 = gl.createTexture();
    tracker.addObjects(1);

    gl.bindTexture(gl.TEXTURE_2D, tex1);
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, 15, 25, 0);
    const mip0Size = 15 * 25 * 4;
    tracker.addMemory(mip0Size);

    gl.deleteTexture(tex1);
    tracker.deleteObjectAndMemory(mip0Size);
  });

});