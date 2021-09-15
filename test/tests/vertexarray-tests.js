import {describe, it} from '../mocha-support.js';
import {createContext2} from '../webgl.js';
import {MemInfoTracker} from './test-utils.js';

describe('program tests', () => {

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