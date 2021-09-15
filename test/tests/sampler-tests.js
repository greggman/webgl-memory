import {describe, it} from '../mocha-support.js';
import {createContext2} from '../webgl.js';
import {MemInfoTracker} from './test-utils.js';

describe('sampler tests', () => {

  it('test sampler', () => {
    const {gl} = createContext2();
    if (!gl) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'sampler');
    const s = gl.createSampler();
    tracker.addObjects(1);
    gl.deleteSampler(s);
    tracker.deleteObjectAndMemory(0);
  });

});