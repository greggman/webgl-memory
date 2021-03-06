import {describe, it} from '../mocha-support.js';
import {createContext} from '../webgl.js';
import {MemInfoTracker} from './test-utils.js';

describe('shader tests', () => {

  it('test shader', () => {
    const {gl} = createContext();
    if (!gl) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'shader');
    const sh = gl.createShader(gl.VERTEX_SHADER);
    tracker.addObjects(1);
    gl.deleteShader(sh);
    tracker.deleteObjectAndMemory(0);
  });

});