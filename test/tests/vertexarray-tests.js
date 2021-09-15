import {describe, it} from '../mocha-support.js';
import {createContext, createContext2} from '../webgl.js';
import {MemInfoTracker} from './test-utils.js';

describe('vertex-array tests', () => {

  it('test vertex-array WebGL1', () => {
    const {gl} = createContext();
    const ext = gl.getExtension('OES_vertex_array_object');
    if (!ext) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'vertexArray');
    const va = ext.createVertexArrayOES();
    tracker.addObjects(1);
    ext.deleteVertexArrayOES(va);
    tracker.deleteObjectAndMemory(0);
  });

  it('test vertex-array WebGL2', () => {
    const {gl} = createContext2();
    if (!gl) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'vertexArray');
    const va = gl.createVertexArray();
    tracker.addObjects(1);
    gl.deleteVertexArray(va);
    tracker.deleteObjectAndMemory(0);
  });

});