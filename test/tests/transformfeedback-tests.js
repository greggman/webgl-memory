import {describe, it} from '../mocha-support.js';
import {createContext2} from '../webgl.js';
import {MemInfoTracker} from './test-utils.js';

describe('transformfeedback tests', () => {

  it('test transformfeedback', () => {
    const {gl} = createContext2();
    if (!gl) {
      return;
    }
    const tracker = new MemInfoTracker(gl, 'transformFeedback');
    const tf = gl.createTransformFeedback();
    tracker.addObjects(1);
    gl.deleteTransformFeedback(tf);
    tracker.deleteObjectAndMemory(0);
  });

});