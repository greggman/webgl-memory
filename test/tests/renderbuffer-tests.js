import {describe, it} from '../mocha-support.js';
import {createContext, createContext2} from '../webgl.js';
import {MemInfoTracker} from './test-utils.js';

describe('renderbuffer tests', () => {

  it('test renderbufferStorage', () => {
    const {gl} = createContext();
    const tracker = new MemInfoTracker(gl, 'renderbuffer');

    const rb1 = gl.createRenderbuffer();
    tracker.addObjects(1);

    gl.bindRenderbuffer(gl.RENDERBUFFER, rb1);
    let size1a;
    {
      const width = 17;
      const height = 49;
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGB565, width, height);
      size1a = width * height * 2;
      tracker.addMemory(size1a);
    }

    let size1b;
    {
      const width = 37;
      const height = 9;
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
      size1b = width * height * 2;
      tracker.addMemory(size1b - size1a);
    }

    const rb2 = gl.createRenderbuffer();
    tracker.addObjects(1);

    gl.bindRenderbuffer(gl.RENDERBUFFER, rb2);
    let size2;
    {
      const width = 71;
      const height = 94;
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, width, height);
      size2 = width * height * 2;
      tracker.addMemory(size2);
    }

    gl.deleteRenderbuffer(rb1);
    tracker.deleteObjectAndMemory(size1b);
    gl.deleteRenderbuffer(rb2);
    tracker.deleteObjectAndMemory(size2);
  });

  it('test renderbufferStorage STENCIL_INDEX8', () => {
    const {gl} = createContext();
    const tracker = new MemInfoTracker(gl, 'renderbuffer');

    const rb1 = gl.createRenderbuffer();
    tracker.addObjects(1);

    gl.bindRenderbuffer(gl.RENDERBUFFER, rb1);
    let size1a;
    {
      const width = 17;
      const height = 49;
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, width, height);
      size1a = width * height;
      tracker.addMemory(size1a);
    }

    gl.deleteRenderbuffer(rb1);
    tracker.deleteObjectAndMemory(size1a);
  });


  it('test renderbufferStorageMultisample', () => {
    const {gl} = createContext2();
    if (!gl) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'renderbuffer');

    const rb1 = gl.createRenderbuffer();
    tracker.addObjects(1);

    gl.bindRenderbuffer(gl.RENDERBUFFER, rb1);
    let size1a;
    {
      const width = 17;
      const height = 49;
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 2, gl.RGB565, width, height);
      size1a = width * height * 2 * 2;
      tracker.addMemory(size1a);
    }

    let size1b;
    {
      const width = 37;
      const height = 9;
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 4, gl.DEPTH_COMPONENT16, width, height);
      size1b = width * height * 2 * 4;
      tracker.addMemory(size1b - size1a);
    }

    const rb2 = gl.createRenderbuffer();
    tracker.addObjects(1);

    gl.bindRenderbuffer(gl.RENDERBUFFER, rb2);
    let size2;
    {
      const width = 71;
      const height = 94;
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 2, gl.RGBA4, width, height);
      size2 = width * height * 2 * 2;
      tracker.addMemory(size2);
    }

    gl.deleteRenderbuffer(rb1);
    tracker.deleteObjectAndMemory(size1b);
    gl.deleteRenderbuffer(rb2);
    tracker.deleteObjectAndMemory(size2);
  });
});