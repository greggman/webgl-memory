import {describe, it} from '../mocha-support.js';
import {createContext} from '../webgl.js';
import {MemInfoTracker} from './test-utils.js';

describe('program tests', () => {

  it('test program', () => {
    const {gl} = createContext();
    if (!gl) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'program');
    const prg = gl.createProgram();
    tracker.addObjects(1);
    gl.deleteProgram(prg);
    tracker.deleteObjectAndMemory(0);
  });

});