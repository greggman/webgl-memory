/* global mocha */

import './tests/buffer-tests.js';
import './tests/contextloss-tests.js';
import './tests/info-tests.js';
import './tests/program-tests.js';
import './tests/renderbuffer-tests.js';
import './tests/sampler-tests.js';
import './tests/shader-tests.js';
import './tests/sync-tests.js';
import './tests/texture-tests.js';
import './tests/transformfeedback-tests.js';
import './tests/vertexarray-tests.js';
import './tests/stack-tests.js';

const settings = Object.fromEntries(new URLSearchParams(window.location.search).entries());
if (settings.reporter) {
  mocha.reporter(settings.reporter);
}
mocha.run((failures) => {
  window.testsPromiseInfo.resolve(failures);
});
