export const config = {};

export function setConfig(options) {
  Object.assign(config, options);
}

function formatMsg(msg) {
  return `${msg}${msg ? ': ' : ''}`;
}

export function assertTruthy(actual, msg = '') {
  if (!config.noLint && !actual) {
    throw new Error(`${formatMsg(msg)}expected: truthy, actual: ${actual}`);
  }
}

export function assertFalsy(actual, msg = '') {
  if (!config.noLint && actual) {
    throw new Error(`${formatMsg(msg)}expected: falsy, actual: ${actual}`);
  }
}

export function assertStringMatchesRegEx(actual, regex, msg = '') {
  if (!config.noLint && !regex.test(actual)) {
    throw new Error(`${formatMsg(msg)}expected: ${regex}, actual: ${actual}`);
  }
}

export function assertEqual(actual, expected, msg = '') {
  if (!config.noLint && actual !== expected) {
    throw new Error(`${formatMsg(msg)}expected: ${expected} to equal actual: ${actual}`);
  }
}

export function assertNotEqual(actual, expected, msg = '') {
  if (!config.noLint && actual === expected) {
    throw new Error(`${formatMsg(msg)}expected: ${expected} to not equal actual: ${actual}`);
  }
}

export function assertThrowsWith(func, expectations, msg = '') {
  let error = '';
  if (config.throwOnError === false) {
    const origFn = console.error;
    const errors = [];
    console.error = function(...args) {
      errors.push(args.join(' '));
    };
    func();
    console.error = origFn;
    if (errors.length) {
      error = errors.join('\n');
      console.error(error);
    }
  } else {
    try {
      func();
    } catch (e) {
      console.error(e);  // eslint-disable-line
      error = e;
    }

  }

  if (config.noLint) {
    return;
  }

  assertStringMatchesREs(error.toString().replace(/\n/g, ' '), expectations, msg);
}

// check if it throws it throws with x
export function assertIfThrowsItThrowsWith(func, expectations, msg = '') {
  let error = '';
  let threw = false;
  if (config.throwOnError === false) {
    const origFn = console.error;
    const errors = [];
    console.error = function(...args) {
      errors.push(args.join(' '));
    };
    func();
    console.error = origFn;
    if (errors.length) {
      error = errors.join('\n');
      console.error(error);
    }
  } else {
    try {
      func();
    } catch (e) {
      console.error(e);  // eslint-disable-line
      error = e;
      threw = true;
    }

  }

  if (config.noLint) {
    return;
  }

  if (!threw) {
    return;
  }

  assertStringMatchesREs(error.toString().replace(/\n/g, ' '), expectations, msg);
}

function assertStringMatchesREs(actual, expectations, msg) {
  for (const expectation of expectations) {
    if (expectation instanceof RegExp) {
      if (!expectation.test(actual)) {
        throw new Error(`${formatMsg(msg)}expected: ${expectation}, actual: ${actual}`);
      }
    }
  }

}
export function assertWarnsWith(func, expectations, msg = '') {
  const warnings = [];
  const origWarnFn = console.warn;
  console.warn = function(...args) {
    origWarnFn.call(this, ...args);
    warnings.push(args.join(' '));
  };

  let error;
  try {
    func();
  } catch (e) {
    error = e;
  }

  console.warn = origWarnFn;

  if (error) {
    throw error;
  }

  if (config.noLint) {
    return;
  }

  assertStringMatchesREs(warnings.join(' '), expectations, msg);
}

export default {
  false: assertFalsy,
  equal: assertEqual,
  matchesRegEx: assertStringMatchesRegEx,
  notEqual: assertNotEqual,
  throwsWith: assertThrowsWith,
  true: assertTruthy,
};