/* global document */
import {computeDrawingbufferSize} from '../src/utils.js';

export function createContext() {
  const gl = document.createElement('canvas').getContext('webgl');
  const ext = gl.getExtension('GMAN_webgl_memory');
  return { gl, ext, drawingbufferSize: computeDrawingbufferSize(gl) };
}

export function createContext2() {
  const gl = document.createElement('canvas').getContext('webgl2');
  const ext = gl ? gl.getExtension('GMAN_webgl_memory') : null;
  return { gl, ext, drawingbufferSize: computeDrawingbufferSize(gl) };
}

function resetContext(gl) {
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.useProgram(null);
}

export function resetContexts(context) {
  const { gl, gl2, vaoExt } = context;
  if (vaoExt) {
    vaoExt.bindVertexArrayOES(null);
  }
  resetContext(gl);

  if (gl2) {
    gl2.bindVertexArray(null);
    resetContext(gl2);
  }
}

export function escapeRE(str) {
    return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function not(str) {
  return new RegExp(`^((?!${escapeRE(str)}).)*$`);
}

