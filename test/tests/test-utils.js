import {assertEqual, assertTruthy} from '../assert.js';
import {computeDrawingbufferSize} from '../../src/utils.js';

export class MemInfoTracker {
  constructor(gl, type) {
    assertTruthy(gl);
    this.ext = gl.getExtension('GMAN_webgl_memory');
    assertTruthy(this.ext);
    this.drawingbufferSize = computeDrawingbufferSize(gl);
    this.numObjects = 0;
    this.memSize = 0;
    this.type = type;
  }
  check() {
    const {ext, type, memSize, numObjects, drawingbufferSize} = this;
    const {memory, resources} = ext.getMemoryInfo();
    if (memory[type] !== undefined) {
      assertEqual(memory[type], memSize, `memory.${type}`);
    }
    assertEqual(resources[type], numObjects, `resources.${type}`);
    assertEqual(memory.total, drawingbufferSize + memSize, `total`);
  }
  addObjects(deltaObjects = 1) {
    this.numObjects += deltaObjects;
  }
  addMemory(deltaMemory = 0) {
    this.memSize += deltaMemory;
    this.check();
  }
  deleteObjectAndMemory(deltaMemory, deltaObjects = 1) {
    this.memSize -= deltaMemory;
    this.numObjects -= deltaObjects;
    this.check();
  }
};
