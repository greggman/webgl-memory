/*
The MIT License (MIT)

Copyright (c) 2021 Gregg Tavares

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import {
  getBytesForMip,
} from './texture-utils.js';
import {
  computeDrawingbufferSize,
  getDrawingbufferInfo,
  isBufferSource,
  isNumber,
  getStackTrace,
  collectObjects,
} from './utils.js';

//------------ [ from https://github.com/KhronosGroup/WebGLDeveloperTools ]

/*
** Copyright (c) 2012 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** "Materials"), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/


const augmentedSet = new Set();

/**
 * Given a WebGL context replaces all the functions with wrapped functions
 * that call gl.getError after every command
 *
 * @param {WebGLRenderingContext|Extension} ctx The webgl context to wrap.
 * @param {string} nameOfClass (eg, webgl, webgl2, OES_texture_float)
 */
// eslint-disable-next-line consistent-return
export function augmentAPI(ctx, nameOfClass, options = {}) {

  if (augmentedSet.has(ctx)) {
    return ctx;
  }
  augmentedSet.add(ctx);

  const origGLErrorFn = options.origGLErrorFn || ctx.getError;

  function createSharedState(ctx) {
    const drawingBufferInfo = getDrawingbufferInfo(ctx);
    const sharedState = {
      baseContext: ctx,
      config: options,
      apis: {
        // custom extension
        gman_webgl_memory: {
          ctx: {
            getMemoryInfo() {
              const drawingbuffer = computeDrawingbufferSize(ctx, drawingBufferInfo);
              return {
                memory: {
                  ...memory,
                  drawingbuffer,
                  total: drawingbuffer + memory.buffer + memory.texture + memory.renderbuffer,
                },
                resources: {
                  ...resources,
                },
              };
            },
            getResourcesInfo(type) {
              return collectObjects(sharedState, type);
            },
          },
        },
      },
      resources: {},
      memory: {
        texture: 0,
        buffer: 0,
        renderbuffer: 0,
      },
      bindings: new Map(),
      defaultVertexArray: {},
      webglObjectToMemory: new Map(),
    };

    const unRestorableAPIs = new Set([
      'webgl',
      'webgl2',
      'webgl_lose_context',
    ]);

    function resetSharedState() {
      sharedState.bindings.clear();
      sharedState.webglObjectToMemory.clear();
      sharedState.webglObjectToMemory.set(sharedState.defaultVertexArray, {});
      sharedState.currentVertexArray = sharedState.defaultVertexArray;
      sharedState.activeTextureUnit = 0x84C0; // TEXTURE0
      [sharedState.resources, sharedState.memory].forEach(function(obj) {
        for (const prop in obj) {
          obj[prop] = 0;
        }
      });
    }

    function handleContextLost() {
      // Issues:
      //   * all resources are lost.
      //     Solution: handled by resetSharedState
      //   * all functions are no-op
      //     Solutions:
      //        * swap all functions for noop
      //          (not so easy because some functions return values)
      //        * wrap all functions is a isContextLost check forwarder
      //          (slow? and same as above)
      //        * have each function manually check for context lost
      //          (simple but repetitive)
      //   * all extensions are lost
      //      Solution: For these we go through and restore all the functions
      //         on each extension
      resetSharedState();
      sharedState.isContextLost = true;

      // restore all original functions for extensions since
      // user will have to get new extensions.
      for (const [name, {ctx, origFuncs}] of [...Object.entries(sharedState.apis)]) {
        if (!unRestorableAPIs.has(name) && origFuncs) {
          augmentedSet.delete(ctx);
          for (const [funcName, origFn] of Object.entries(origFuncs)) {
            ctx[funcName] = origFn;
          }
          delete apis[name];
        }
      }
    }

    function handleContextRestored() {
      sharedState.isContextLost = false;
    }

    if (ctx.canvas) {
      ctx.canvas.addEventListener('webglcontextlost', handleContextLost);
      ctx.canvas.addEventListener('webglcontextrestored', handleContextRestored);
    }

    resetSharedState();
    return sharedState;
  }

  function getTextureBindingKey(target) {
    return `${sharedState.activeTextureUnit}_${target}`;
  }

  const sharedState = options.sharedState || createSharedState(ctx);
  options.sharedState = sharedState;

  const {
    apis,
    bindings,
    memory,
    resources,
    webglObjectToMemory,
  } = sharedState;

  const origFuncs = {};

  function noop() {
  }

  function makeCreateWrapper(ctx, typeName, _funcName) {
    const funcName = _funcName || `create${typeName[0].toUpperCase()}${typeName.substr(1)}`;
    if (!ctx[funcName]) {
      return null;
    }
    resources[typeName] = 0;
    return function(ctx, funcName, args, webglObj) {
      if (sharedState.isContextLost) {
        return;
      }
      ++resources[typeName];
      webglObjectToMemory.set(webglObj, {
        size: 0,
        stackCreated: getStackTrace(),
      });
    };
  }

  function makeDeleteWrapper(typeName, fn = noop, _funcName) {
    const funcName = _funcName || `delete${typeName[0].toUpperCase()}${typeName.substr(1)}`;
    if (!ctx[funcName]) {
      return null;
    }
    return function(ctx, funcName, args) {
      if (sharedState.isContextLost) {
        return;
      }
      const [obj] = args;
      const info = webglObjectToMemory.get(obj);
      if (info) {
        --resources[typeName];
        fn(obj, info);
        // TODO: handle resource counts
        webglObjectToMemory.delete(obj);
      }
    };
  }

  function updateRenderbuffer(target, samples, internalFormat, width, height) {
    if (sharedState.isContextLost) {
      return;
    }
    const obj = bindings.get(target);
    if (!obj) {
      throw new Error(`no renderbuffer bound to ${target}`);
    }
    const info = webglObjectToMemory.get(obj);
    if (!info) {
      throw new Error(`unknown renderbuffer ${obj}`);
    }

    const bytesForMip = getBytesForMip(internalFormat, width, height, 1);
    const newSize = bytesForMip * samples;

    memory.renderbuffer -= info.size;
    info.size = newSize;
    info.stackUpdated = getStackTrace();
    memory.renderbuffer += newSize;
  }

  const ELEMENT_ARRAY_BUFFER           = 0x8893;
  const TEXTURE0                       = 0x84C0;

  const UNSIGNED_BYTE                  = 0x1401;
  const TEXTURE_CUBE_MAP               = 0x8513;
  const TEXTURE_2D_ARRAY               = 0x8C1A;
  const TEXTURE_CUBE_MAP_POSITIVE_X    = 0x8515;
  const TEXTURE_CUBE_MAP_NEGATIVE_X    = 0x8516;
  const TEXTURE_CUBE_MAP_POSITIVE_Y    = 0x8517;
  const TEXTURE_CUBE_MAP_NEGATIVE_Y    = 0x8518;
  const TEXTURE_CUBE_MAP_POSITIVE_Z    = 0x8519;
  const TEXTURE_CUBE_MAP_NEGATIVE_Z    = 0x851A;

  const TEXTURE_BASE_LEVEL             = 0x813C;
  const TEXTURE_MAX_LEVEL              = 0x813D;

  const cubemapTargets = new Set([
    TEXTURE_CUBE_MAP_POSITIVE_X,
    TEXTURE_CUBE_MAP_NEGATIVE_X,
    TEXTURE_CUBE_MAP_POSITIVE_Y,
    TEXTURE_CUBE_MAP_NEGATIVE_Y,
    TEXTURE_CUBE_MAP_POSITIVE_Z,
    TEXTURE_CUBE_MAP_NEGATIVE_Z,
  ]);

  function isCubemapFace(target) {
    return cubemapTargets.has(target);
  }

  function getTextureInfo(target) {
    target = isCubemapFace(target) ? TEXTURE_CUBE_MAP : target;
    const bindingKey = getTextureBindingKey(target);
    const obj = bindings.get(bindingKey);
    if (!obj) {
      throw new Error(`no texture bound to ${target} on unit ${sharedState.activeTextureUnit - TEXTURE0}`);
    }
    const info = webglObjectToMemory.get(obj);
    if (!info) {
      throw new Error(`unknown texture ${obj}`);
    }
    return info;
  }

  function updateMipLevel(info, target, level, internalFormat, width, height, depth, type) {
    const oldSize = info.size;
    const newMipSize = getBytesForMip(internalFormat, width, height, depth, type);

    const faceNdx = isCubemapFace(target)
      ? target - TEXTURE_CUBE_MAP_POSITIVE_X
      : 0;

    info.mips = info.mips || [];
    info.mips[level] = info.mips[level] || [];
    const mipFaceInfo = info.mips[level][faceNdx] || {};
    info.size -= mipFaceInfo.size || 0;

    mipFaceInfo.size = newMipSize;
    mipFaceInfo.internalFormat = internalFormat;
    mipFaceInfo.type = type;
    mipFaceInfo.width = width;
    mipFaceInfo.height = height;
    mipFaceInfo.depth = depth;

    info.mips[level][faceNdx] = mipFaceInfo;
    info.size += newMipSize;

    memory.texture -= oldSize;
    memory.texture += info.size;

    info.stackUpdated = getStackTrace();
  }

  function updateTexStorage(target, levels, internalFormat, width, height, depth) {
    const info = getTextureInfo(target);
    const numFaces = target === TEXTURE_CUBE_MAP ? 6 : 1;
    const baseFaceTarget = target === TEXTURE_CUBE_MAP ? TEXTURE_CUBE_MAP_POSITIVE_X : target;
    for (let level = 0; level < levels; ++level) {
      for (let face = 0; face < numFaces; ++face) {
        updateMipLevel(info, baseFaceTarget + face, level, internalFormat, width, height, depth);
      }
      width = Math.ceil(Math.max(width / 2, 1));
      height = Math.ceil(Math.max(height / 2, 1));
      depth = target === TEXTURE_2D_ARRAY ? depth : Math.ceil(Math.max(depth / 2, 1));
    }
  }

  function handleBindVertexArray(gl, funcName, args) {
    if (sharedState.isContextLost) {
      return;
    }
    const [va] = args;
    sharedState.currentVertexArray = va ? va : sharedState.defaultVertexArray;
  }

  function handleBufferBinding(target, obj) {
    if (sharedState.isContextLost) {
      return;
    }
    switch (target) {
      case ELEMENT_ARRAY_BUFFER: {
          const info = webglObjectToMemory.get(sharedState.currentVertexArray);
          info.elementArrayBuffer = obj;
          break;
        }
      default:
        bindings.set(target, obj);
        break;
    }
  }

  const preChecks = {};
  const postChecks = {
    // WebGL1
    //   void bufferData(GLenum target, GLsizeiptr size, GLenum usage);
    //   void bufferData(GLenum target, [AllowShared] BufferSource? srcData, GLenum usage);
    // WebGL2:
    //   void bufferData(GLenum target, [AllowShared] ArrayBufferView srcData, GLenum usage, GLuint srcOffset,
    //                   optional GLuint length = 0);
    bufferData(gl, funcName, args) {
      if (sharedState.isContextLost) {
        return;
      }
      const [target, src, /* usage */, /*srcOffset = 0*/, length = undefined] = args;
      let obj;
      switch (target) {
        case ELEMENT_ARRAY_BUFFER:
          {
            const info = webglObjectToMemory.get(sharedState.currentVertexArray);
            obj = info.elementArrayBuffer;
          }
          break;
        default:
          obj = bindings.get(target);
          break;
      }
      if (!obj) {
        throw new Error(`no buffer bound to ${target}`);
      }
      let newSize = 0;
      if (length !== undefined) {
        newSize = length * src.BYTES_PER_ELEMENT;
      } else if (isBufferSource(src)) {
        newSize = src.byteLength;
      } else if (isNumber(src)) {
        newSize = src;
      } else {
        throw new Error(`unsupported bufferData src type ${src}`);
      }

      const info = webglObjectToMemory.get(obj);
      if (!info) {
        throw new Error(`unknown buffer ${obj}`);
      }

      memory.buffer -= info.size;
      info.size = newSize;
      info.stackUpdated = getStackTrace();
      memory.buffer += newSize;
    },

    bindVertexArray: handleBindVertexArray,
    bindVertexArrayOES: handleBindVertexArray,

    bindBuffer(gl, funcName, args) {
      const [target, obj] = args;
      handleBufferBinding(target, obj);
    },

    bindBufferBase(gl, funcName, args) {
      const [target, /*ndx*/, obj] = args;
      handleBufferBinding(target, obj);
    },

    bindBufferRange(gl, funcName, args) {
      const [target, /*ndx*/, obj, /*offset*/, /*size*/] = args;
      handleBufferBinding(target, obj);
    },

    bindRenderbuffer(gl, funcName, args) {
      if (sharedState.isContextLost) {
       return;
      }
      const [target, obj] = args;
      bindings.set(target, obj);
    },

    activeTexture(gl, funcName, args) {
      if (sharedState.isContextLost) {
        return;
      }
      const [unit] = args;
      sharedState.activeTextureUnit = unit;
    },

    bindTexture(gl, funcName, args) {
      if (sharedState.isContextLost) {
       return;
      }
      const [target, obj] = args;
      const bindingKey = getTextureBindingKey(target);
      bindings.set(bindingKey, obj);
    },

    // void gl.copyTexImage2D(target, level, internalformat, x, y, width, height, border);
    copyTexImage2D(ctx, funcName, args) {
      if (sharedState.isContextLost) {
        return;
      }
      const [target, level, internalFormat, /*x*/, /*y*/, width, height, /*border*/] = args;
      const info = getTextureInfo(target);
      updateMipLevel(info, target, level, internalFormat, width, height, 1, UNSIGNED_BYTE);
    },

    createBuffer: makeCreateWrapper(ctx, 'buffer'),
    createFramebuffer: makeCreateWrapper(ctx, 'framebuffer'),
    createRenderbuffer: makeCreateWrapper(ctx, 'renderbuffer'),
    createProgram: makeCreateWrapper(ctx, 'program'),
    createQuery: makeCreateWrapper(ctx, 'query'),
    createShader: makeCreateWrapper(ctx, 'shader'),
    createSampler: makeCreateWrapper(ctx, 'sampler'),
    createTexture: makeCreateWrapper(ctx, 'texture'),
    createTransformFeedback: makeCreateWrapper(ctx, 'transformFeedback'),
    createVertexArray: makeCreateWrapper(ctx, 'vertexArray'),
    createVertexArrayOES: makeCreateWrapper(ctx, 'vertexArray', 'createVertexArrayOES'),

    // WebGL 1:
    // void gl.compressedTexImage2D(target, level, internalformat, width, height, border, ArrayBufferView? pixels);
    //
    // Additionally available in WebGL 2:
    // read from buffer bound to gl.PIXEL_UNPACK_BUFFER
    // void gl.compressedTexImage2D(target, level, internalformat, width, height, border, GLsizei imageSize, GLintptr offset);
    // void gl.compressedTexImage2D(target, level, internalformat, width, height, border,
    //                              ArrayBufferView srcData, optional srcOffset, optional srcLengthOverride);
    compressedTexImage2D(ctx, funcName, args) {
      if (sharedState.isContextLost) {
        return;
      }
      const [target, level, internalFormat, width, height] = args;
      const info = getTextureInfo(target);
      updateMipLevel(info, target, level, internalFormat, width, height, 1, UNSIGNED_BYTE);
    },

    // read from buffer bound to gl.PIXEL_UNPACK_BUFFER
    // void gl.compressedTexImage3D(target, level, internalformat, width, height, depth, border, GLsizei imageSize, GLintptr offset);
    // void gl.compressedTexImage3D(target, level, internalformat, width, height, depth, border,
    //                              ArrayBufferView srcData, optional srcOffset, optional srcLengthOverride);
    compressedTexImage3D(ctx, funcName, args) {
      if (sharedState.isContextLost) {
        return;
      }
      const [target, level, internalFormat, width, height, depth] = args;
      const info = getTextureInfo(target);
      updateMipLevel(info, target, level, internalFormat, width, height, depth, UNSIGNED_BYTE);
    },

    deleteBuffer: makeDeleteWrapper('buffer', function(obj, info) {
      memory.buffer -= info.size;
    }),
    deleteFramebuffer: makeDeleteWrapper('framebuffer'),
    deleteProgram: makeDeleteWrapper('program'),
    deleteQuery: makeDeleteWrapper('query'),
    deleteRenderbuffer: makeDeleteWrapper('renderbuffer', function(obj, info) {
      memory.renderbuffer -= info.size;
    }),
    deleteSampler: makeDeleteWrapper('sampler'),
    deleteShader: makeDeleteWrapper('shader'),
    deleteSync: makeDeleteWrapper('sync'),
    deleteTexture: makeDeleteWrapper('texture', function(obj, info) {
      memory.texture -= info.size;
    }),
    deleteTransformFeedback: makeDeleteWrapper('transformFeedback'),
    deleteVertexArray: makeDeleteWrapper('vertexArray'),
    deleteVertexArrayOES: makeDeleteWrapper('vertexArray', noop, 'deleteVertexArrayOES'),

    fenceSync: function(ctx) {
      if (sharedState.isContextLost) {
        return undefined;
      }
      if (!ctx.fenceSync) {
        return undefined;
      }
      resources.sync = 0;
      return function(ctx, funcName, args, webglObj) {
        ++resources.sync;

        webglObjectToMemory.set(webglObj, {
          size: 0,
        });
      };
    }(ctx),

    generateMipmap(ctx, funcName, args) {
      if (sharedState.isContextLost) {
        return;
      }
      const [target] = args;
      const info = getTextureInfo(target);
      const baseMipNdx = info.parameters ? info.parameters.get(TEXTURE_BASE_LEVEL) || 0 : 0;
      const maxMipNdx = info.parameters ? info.parameters.get(TEXTURE_MAX_LEVEL) || 1024 : 1024;
      const mipInfo = info.mips[baseMipNdx][0];
      let {width, height, depth} = mipInfo;
      const {internalFormat, type} = mipInfo;
      let level = baseMipNdx + 1;

      const numFaces = target === TEXTURE_CUBE_MAP ? 6 : 1;
      const baseFaceTarget = target === TEXTURE_CUBE_MAP ? TEXTURE_CUBE_MAP_POSITIVE_X : target;
      while (level <= maxMipNdx && !(width === 1 && height === 1 && (depth === 1 || target === TEXTURE_2D_ARRAY))) {
        width = Math.ceil(Math.max(width / 2, 1));
        height = Math.ceil(Math.max(height / 2, 1));
        depth = target === TEXTURE_2D_ARRAY ? depth : Math.ceil(Math.max(depth / 2, 1));
        for (let face = 0; face < numFaces; ++face) {
          updateMipLevel(info, baseFaceTarget + face, level, internalFormat, width, height, depth, type);
        }
        ++level;
      }
    },

    getSupportedExtensions(ctx, funcName, args, result) {
      if (sharedState.isContextLost) {
        return;
      }
      result.push('GMAN_webgl_memory');
    },

    // void gl.renderbufferStorage(target, internalFormat, width, height);
    // gl.RGBA4: 4 red bits, 4 green bits, 4 blue bits 4 alpha bits.
    // gl.RGB565: 5 red bits, 6 green bits, 5 blue bits.
    // gl.RGB5_A1: 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
    // gl.DEPTH_COMPONENT16: 16 depth bits.
    // gl.STENCIL_INDEX8: 8 stencil bits.
    // gl.DEPTH_STENCIL
    renderbufferStorage(ctx, funcName, args) {
      const [target, internalFormat, width, height] = args;
      updateRenderbuffer(target, 1, internalFormat, width, height);
    },

    // void gl.renderbufferStorageMultisample(target, samples, internalFormat, width, height);
    renderbufferStorageMultisample(ctx, funcName, args) {
      const [target, samples, internalFormat, width, height] = args;
      updateRenderbuffer(target, samples, internalFormat, width, height);
    },

    texImage2D(ctx, funcName, args) {
      if (sharedState.isContextLost) {
        return;
      }
      // WebGL1:
      // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, ArrayBufferView? pixels);
      // void gl.texImage2D(target, level, internalformat, format, type, ImageData? pixels);
      // void gl.texImage2D(target, level, internalformat, format, type, HTMLImageElement? pixels);
      // void gl.texImage2D(target, level, internalformat, format, type, HTMLCanvasElement? pixels);
      // void gl.texImage2D(target, level, internalformat, format, type, HTMLVideoElement? pixels);
      // void gl.texImage2D(target, level, internalformat, format, type, ImageBitmap? pixels// );

      // WebGL2:
      // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, GLintptr offset);
      // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, HTMLCanvasElement source);
      // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, HTMLImageElement source);
      // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, HTMLVideoElement source);
      // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, ImageBitmap source);
      // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, ImageData source);
      // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, ArrayBufferView srcData, srcOffset);
      const [target, level, internalFormat] = args;
      let width;
      let height;
      let type;
      if (args.length === 6) {
        const src = args[5];
        width = src.width;
        height = src.height;
        type = args[4];
      } else {
        width = args[3];
        height = args[4];
        type = args[7];
      }

      const info = getTextureInfo(target);
      updateMipLevel(info, target, level, internalFormat, width, height, 1, type);
    },

    // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, GLintptr offset);
    //
    // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, HTMLCanvasElement source);
    // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, HTMLImageElement source);
    // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, HTMLVideoElement source);
    // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, ImageBitmap source);
    // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, ImageData source);
    // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, ArrayBufferView? srcData);
    // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, ArrayBufferView srcData, srcOffset);

    texImage3D(ctx, funcName, args) {
      if (sharedState.isContextLost) {
        return;
      }
      const [target, level, internalFormat, width, height, depth, /*border*/, /*format*/, type] = args;
      const info = getTextureInfo(target);
      updateMipLevel(info, target, level, internalFormat, width, height, depth, type);
    },

    texParameteri(ctx, funcName, args) {
      if (sharedState.isContextLost) {
        return;
      }
      const [target, pname, value] = args;
      const info = getTextureInfo(target);
      info.parameters = info.parameters || new Map();
      info.parameters.set(pname, value);
    },

    // void gl.texStorage2D(target, levels, internalformat, width, height);
    texStorage2D(ctx, funcName, args) {
      const [target, levels, internalFormat, width, height] = args;
      updateTexStorage(target, levels, internalFormat, width, height, 1);
    },

    // void gl.texStorage3D(target, levels, internalformat, width, height, depth);
    texStorage3D(ctx, funcName, args) {
      const [target, levels, internalFormat, width, height, depth] = args;
      updateTexStorage(target, levels, internalFormat, width, height, depth);
    },
  };

  const extraWrappers = {
    getExtension(ctx, propertyName) {
      if (sharedState.isContextLost) {
        return;
      }
      const origFn = ctx[propertyName];
      ctx[propertyName] = function(...args) {
        const extensionName = args[0].toLowerCase();
        const api = apis[extensionName];
        if (api) {
          return api.ctx;
        }
        const ext = origFn.call(ctx, ...args);
        if (ext) {
          augmentAPI(ext, extensionName, {...options, origGLErrorFn});
        }
        return ext;
      };
    },
  };

  // Makes a function that calls a WebGL function and then calls getError.
  function makeErrorWrapper(ctx, funcName) {
    const origFn = ctx[funcName];
    const preCheck = preChecks[funcName] || noop;
    const postCheck = postChecks[funcName] || noop;
    if (preCheck === noop && postChecks === noop) {
      return;
    }
    ctx[funcName] = function(...args) {
      preCheck(ctx, funcName, args);
      const result = origFn.call(ctx, ...args);
      postCheck(ctx, funcName, args, result);
      return result;
    };
    const extraWrapperFn = extraWrappers[funcName];
    if (extraWrapperFn) {
      extraWrapperFn(ctx, funcName, origGLErrorFn);
    }
  }

  // Wrap each function
  for (const propertyName in ctx) {
    if (typeof ctx[propertyName] === 'function') {
      origFuncs[propertyName] = ctx[propertyName];
      makeErrorWrapper(ctx, propertyName);
    }
  }

  apis[nameOfClass.toLowerCase()] = { ctx, origFuncs };
}

