import {describe, it} from '../mocha-support.js';
import {createContext, createContext2} from '../webgl.js';
import {MemInfoTracker} from './test-utils.js';

describe('buffer tests', () => {
  it('test bufferData with typedarray', () => {
    const {gl} = createContext();
    const tracker = new MemInfoTracker(gl, 'buffer');

    const buf1 = gl.createBuffer();
    tracker.addObjects(1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buf1);
    const data1 = new Float32Array(25);
    gl.bufferData(gl.ARRAY_BUFFER, data1, gl.STATIC_DRAW);
    tracker.addMemory(data1.byteLength);

    const data1a = new Uint16Array(37);
    gl.bufferData(gl.ARRAY_BUFFER, data1a, gl.STATIC_DRAW);
    tracker.addMemory(data1a.byteLength - data1.byteLength);

    const buf2 = gl.createBuffer();
    tracker.addObjects(1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buf2);
    const data2 = new Float32Array(55);
    gl.bufferData(gl.ARRAY_BUFFER, data2, gl.STATIC_DRAW);
    tracker.addMemory(data2.byteLength);

    gl.deleteBuffer(buf1);
    tracker.deleteObjectAndMemory(data1a.byteLength);

    gl.deleteBuffer(buf2);
    tracker.deleteObjectAndMemory(data2.byteLength);
  });

  it('test bufferData with ArrayBufferView', () => {
    const {gl} = createContext2();
    if (!gl) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'buffer');

    const buf1 = gl.createBuffer();
    tracker.addObjects(1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buf1);
    const data1 = new Float32Array(25);
    const size1 = 15;
    gl.bufferData(gl.ARRAY_BUFFER, data1, gl.STATIC_DRAW, 0, size1);
    tracker.addMemory(size1);

    const data1a = new Uint16Array(37);
    const size1a = 30;
    gl.bufferData(gl.ARRAY_BUFFER, data1a, gl.STATIC_DRAW, 0, size1a);
    tracker.addMemory(size1a - size1);

    const buf2 = gl.createBuffer();
    tracker.addObjects(1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buf2);
    const data2 = new Float32Array(55);
    const size2 = 41;
    gl.bufferData(gl.ARRAY_BUFFER, data2, gl.STATIC_DRAW, 0, size2);
    tracker.addMemory(size2);

    gl.deleteBuffer(buf1);
    tracker.deleteObjectAndMemory(size1a);

    gl.deleteBuffer(buf2);
    tracker.deleteObjectAndMemory(size2);
  });

  it('test bufferData with ArrayBuffer', () => {
    const {gl} = createContext2();
    if (!gl) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'buffer');

    const buf1 = gl.createBuffer();
    tracker.addObjects(1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buf1);
    const data1 = new Float32Array(25);
    gl.bufferData(gl.ARRAY_BUFFER, data1.buffer, gl.STATIC_DRAW);
    tracker.addMemory(data1.byteLength);

    const data1a = new Uint16Array(37);
    gl.bufferData(gl.ARRAY_BUFFER, data1a.buffer, gl.STATIC_DRAW);
    tracker.addMemory(data1a.byteLength - data1.byteLength);

    const buf2 = gl.createBuffer();
    tracker.addObjects(1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buf2);
    const data2 = new Float32Array(55);
    gl.bufferData(gl.ARRAY_BUFFER, data2.buffer, gl.STATIC_DRAW);
    tracker.addMemory(data2.byteLength);

    gl.deleteBuffer(buf1);
    tracker.deleteObjectAndMemory(data1a.byteLength);

    gl.deleteBuffer(buf2);
    tracker.deleteObjectAndMemory(data2.byteLength);
  });

  it('test bufferData with size', () => {
    const {gl} = createContext();
    const tracker = new MemInfoTracker(gl, 'buffer');

    const buf1 = gl.createBuffer();
    tracker.addObjects(1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buf1);
    const size1 = 26;
    gl.bufferData(gl.ARRAY_BUFFER, size1, gl.STATIC_DRAW);
    tracker.addMemory(size1);

    const size1a = 38;
    gl.bufferData(gl.ARRAY_BUFFER, size1a, gl.STATIC_DRAW);
    tracker.addMemory(size1a - size1);

    const buf2 = gl.createBuffer();
    tracker.addObjects(1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buf2);
    const size2 = 55;
    gl.bufferData(gl.ARRAY_BUFFER, size2, gl.STATIC_DRAW);
    tracker.addMemory(size2);

    gl.deleteBuffer(buf1);
    tracker.deleteObjectAndMemory(size1a);

    gl.deleteBuffer(buf2);
    tracker.deleteObjectAndMemory(size2);
  });

  it('test ELEMENT_ARRAY_BUFFER', () => {
    const {gl} = createContext2();
    if (!gl) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'buffer');

    const va1 = gl.createVertexArray();
    gl.bindVertexArray(va1);

    const buf1 = gl.createBuffer();
    tracker.addObjects(1);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf1);
    const size1 = 26;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, size1, gl.STATIC_DRAW);
    tracker.addMemory(size1);

    const va2 = gl.createVertexArray();
    gl.bindVertexArray(va2);

    const buf2 = gl.createBuffer();
    tracker.addObjects(1);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf2);
    const size2 = 55;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, size2, gl.STATIC_DRAW);
    tracker.addMemory(size2);

    gl.bindVertexArray(va1);
    const size1a = 5;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, size1a, gl.STATIC_DRAW);
    tracker.addMemory(size1a - size1);

    gl.deleteBuffer(buf1);
    tracker.deleteObjectAndMemory(size1a);

    gl.deleteBuffer(buf2);
    tracker.deleteObjectAndMemory(size2);
  });

  it ('test bindBufferBase/bindBufferRange', () => {
    const {gl} = createContext2();
    if (!gl) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'buffer');

    const buf1 = gl.createBuffer();
    tracker.addObjects(1);

    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, buf1);
    const data1 = new Float32Array(25);
    gl.bufferData(gl.UNIFORM_BUFFER, data1, gl.STATIC_DRAW);
    tracker.addMemory(data1.byteLength);

    const data1a = new Uint16Array(37);
    gl.bufferData(gl.UNIFORM_BUFFER, data1a, gl.STATIC_DRAW);
    tracker.addMemory(data1a.byteLength - data1.byteLength);

    const buf2 = gl.createBuffer();
    tracker.addObjects(1);

    const data2 = new Float32Array(55);
    gl.bindBufferRange(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buf2, 0, data2.byteLength);    
    gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, data2, gl.STATIC_DRAW);
    tracker.addMemory(data2.byteLength);

    gl.deleteBuffer(buf1);
    tracker.deleteObjectAndMemory(data1a.byteLength);

    gl.deleteBuffer(buf2);
    tracker.deleteObjectAndMemory(data2.byteLength);

  });

});