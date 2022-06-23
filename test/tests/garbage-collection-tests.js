import {describe, it} from '../mocha-support.js';
import {createContext, createContext2} from '../webgl.js';
import {MemInfoTracker} from './test-utils.js';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('garbage collection tests', async () => {

  function allocateBufferAndReturnWeakReference(gl, tracker, data) {
    const buf = gl.createBuffer();
    const weakRef = new WeakRef(buf);
    
    tracker.addObjects(1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    tracker.addMemory(data.byteLength);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return weakRef;
  }

  it('test WebGL resource gc', async() => {
    const {gl} = createContext();
    const tracker = new MemInfoTracker(gl, 'buffer');

    const data = new Float32Array(25);
    const weakRef = allocateBufferAndReturnWeakReference(gl, tracker, data);

    const pressure = [];
    while (weakRef.deref()) {
      await wait(500);
      // try to create some memory pressure
      pressure.push(new Array(1000000).fill(123));
      console.log('alloc');
    }

    tracker.deleteObjectAndMemory(data.byteLength);
  });

});