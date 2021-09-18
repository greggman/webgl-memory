import { computeDrawingbufferSize, getDrawingbufferInfo } from '../../src/utils.js';
import assert, {assertEqual, assertNotEqual, assertTruthy} from '../assert.js';
import {describe, it} from '../mocha-support.js';
import {createContext, createContext2} from '../webgl.js';

describe('info tests', () => {
  it('test base state webgl1', () => {
    const {ext, drawingbufferSize} = createContext();
    assertTruthy(ext, 'got extension');

    const info = ext.getMemoryInfo();
    const {memory, resources} = info;

    assertEqual(memory.buffer, 0);
    assertEqual(memory.texture, 0);
    assertEqual(memory.renderbuffer, 0);
    assertEqual(memory.drawingbuffer, drawingbufferSize);
    assertEqual(memory.total, drawingbufferSize);
    assertEqual(resources.buffer, 0);
    assertEqual(resources.framebuffer, 0);
    assertEqual(resources.renderbuffer, 0);
    assertEqual(resources.program, 0);
    assertEqual(resources.query, undefined);
    assertEqual(resources.sampler, undefined);
    assertEqual(resources.shader, 0);
    assertEqual(resources.sync, undefined);
    assertEqual(resources.texture, 0);
    assertEqual(resources.transformFeedback, undefined);
    assertEqual(resources.vertexArray, undefined);
  });

  it('test base state webgl2', () => {
    const {ext, drawingbufferSize} = createContext2();
    assertTruthy(ext, 'got extension');

    const info = ext.getMemoryInfo();
    const {memory, resources} = info;

    assertEqual(memory.buffer, 0);
    assertEqual(memory.texture, 0);
    assertEqual(memory.renderbuffer, 0);
    assertEqual(memory.drawingbuffer, drawingbufferSize);
    assertEqual(memory.total, drawingbufferSize);
    assertEqual(resources.buffer, 0);
    assertEqual(resources.framebuffer, 0);
    assertEqual(resources.renderbuffer, 0);
    assertEqual(resources.program, 0);
    assertEqual(resources.query, 0);
    assertEqual(resources.sampler, 0);
    assertEqual(resources.shader, 0);
    assertEqual(resources.sync, 0);
    assertEqual(resources.texture, 0);
    assertEqual(resources.transformFeedback, 0);
    assertEqual(resources.vertexArray, 0);
  });

  it('test canvas resize', () => {
    const {gl, ext, drawingbufferSize} = createContext();
    assertTruthy(ext, 'got extension');

    {
      const info = ext.getMemoryInfo();
      const {memory} = info;
      assertEqual(memory.drawingbuffer, drawingbufferSize);
      assertEqual(memory.total, drawingbufferSize);
    }

    gl.canvas.width = 150;
    gl.canvas.height = 75;

    {
      const newDrawingbufferSize = computeDrawingbufferSize(gl, getDrawingbufferInfo(gl));
      const info = ext.getMemoryInfo();
      const {memory} = info;
      assertEqual(memory.drawingbuffer, newDrawingbufferSize);
      assertEqual(memory.total, newDrawingbufferSize);
      assertNotEqual(drawingbufferSize, newDrawingbufferSize)
    }

  });

});