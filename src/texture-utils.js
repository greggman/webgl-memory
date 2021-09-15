
/* PixelFormat */
const ALPHA                          = 0x1906;
const RGB                            = 0x1907;
const RGBA                           = 0x1908;
const LUMINANCE                      = 0x1909;
const LUMINANCE_ALPHA                = 0x190A;
const DEPTH_COMPONENT                = 0x1902;
const DEPTH_STENCIL                  = 0x84F9;

const R8                           = 0x8229;
const R8_SNORM                     = 0x8F94;
const R16F                         = 0x822D;
const R32F                         = 0x822E;
const R8UI                         = 0x8232;
const R8I                          = 0x8231;
const RG16UI                       = 0x823A;
const RG16I                        = 0x8239;
const RG32UI                       = 0x823C;
const RG32I                        = 0x823B;
const RG8                          = 0x822B;
const RG8_SNORM                    = 0x8F95;
const RG16F                        = 0x822F;
const RG32F                        = 0x8230;
const RG8UI                        = 0x8238;
const RG8I                         = 0x8237;
const R16UI                        = 0x8234;
const R16I                         = 0x8233;
const R32UI                        = 0x8236;
const R32I                         = 0x8235;
const RGB8                         = 0x8051;
const SRGB8                        = 0x8C41;
const RGB565                       = 0x8D62;
const RGB8_SNORM                   = 0x8F96;
const R11F_G11F_B10F               = 0x8C3A;
const RGB9_E5                      = 0x8C3D;
const RGB16F                       = 0x881B;
const RGB32F                       = 0x8815;
const RGB8UI                       = 0x8D7D;
const RGB8I                        = 0x8D8F;
const RGB16UI                      = 0x8D77;
const RGB16I                       = 0x8D89;
const RGB32UI                      = 0x8D71;
const RGB32I                       = 0x8D83;
const RGBA8                        = 0x8058;
const SRGB8_ALPHA8                 = 0x8C43;
const RGBA8_SNORM                  = 0x8F97;
const RGB5_A1                      = 0x8057;
const RGBA4                        = 0x8056;
const RGB10_A2                     = 0x8059;
const RGBA16F                      = 0x881A;
const RGBA32F                      = 0x8814;
const RGBA8UI                      = 0x8D7C;
const RGBA8I                       = 0x8D8E;
const RGB10_A2UI                   = 0x906F;
const RGBA16UI                     = 0x8D76;
const RGBA16I                      = 0x8D88;
const RGBA32I                      = 0x8D82;
const RGBA32UI                     = 0x8D70;

const DEPTH_COMPONENT16            = 0x81A5;
const DEPTH_COMPONENT24            = 0x81A6;
const DEPTH_COMPONENT32F           = 0x8CAC;
const DEPTH32F_STENCIL8            = 0x8CAD;
const DEPTH24_STENCIL8             = 0x88F0;

/* DataType */
const BYTE                         = 0x1400;
const UNSIGNED_BYTE                = 0x1401;
const SHORT                        = 0x1402;
const UNSIGNED_SHORT               = 0x1403;
const INT                          = 0x1404;
const UNSIGNED_INT                 = 0x1405;
const FLOAT                        = 0x1406;
const UNSIGNED_SHORT_4_4_4_4       = 0x8033;
const UNSIGNED_SHORT_5_5_5_1       = 0x8034;
const UNSIGNED_SHORT_5_6_5         = 0x8363;
const HALF_FLOAT                   = 0x140B;
const HALF_FLOAT_OES               = 0x8D61;  // Thanks Khronos for making this different >:(
const UNSIGNED_INT_2_10_10_10_REV  = 0x8368;
const UNSIGNED_INT_10F_11F_11F_REV = 0x8C3B;
const UNSIGNED_INT_5_9_9_9_REV     = 0x8C3E;
const FLOAT_32_UNSIGNED_INT_24_8_REV = 0x8DAD;
const UNSIGNED_INT_24_8            = 0x84FA;

const RG                           = 0x8227;
const RG_INTEGER                   = 0x8228;
const RED                          = 0x1903;
const RED_INTEGER                  = 0x8D94;
const RGB_INTEGER                  = 0x8D98;
const RGBA_INTEGER                 = 0x8D99;

const formatInfo = {};
{
  // NOTE: this is named `numColorComponents` vs `numComponents` so we can let Uglify mangle
  // the name.
  const f = formatInfo;
  f[ALPHA]           = { numColorComponents: 1, };
  f[LUMINANCE]       = { numColorComponents: 1, };
  f[LUMINANCE_ALPHA] = { numColorComponents: 2, };
  f[RGB]             = { numColorComponents: 3, };
  f[RGBA]            = { numColorComponents: 4, };
  f[RED]             = { numColorComponents: 1, };
  f[RED_INTEGER]     = { numColorComponents: 1, };
  f[RG]              = { numColorComponents: 2, };
  f[RG_INTEGER]      = { numColorComponents: 2, };
  f[RGB]             = { numColorComponents: 3, };
  f[RGB_INTEGER]     = { numColorComponents: 3, };
  f[RGBA]            = { numColorComponents: 4, };
  f[RGBA_INTEGER]    = { numColorComponents: 4, };
  f[DEPTH_COMPONENT] = { numColorComponents: 1, };
  f[DEPTH_STENCIL]   = { numColorComponents: 2, };
}

/**
 * @typedef {Object} TextureFormatDetails
 * @property {number} textureFormat format to pass texImage2D and similar functions.
 * @property {boolean} colorRenderable true if you can render to this format of texture.
 * @property {boolean} textureFilterable true if you can filter the texture, false if you can ony use `NEAREST`.
 * @property {number[]} type Array of possible types you can pass to texImage2D and similar function
 * @property {Object.<number,number>} bytesPerElementMap A map of types to bytes per element
 * @private
 */

let s_textureInternalFormatInfo;
function getTextureInternalFormatInfo(internalFormat) {
  if (!s_textureInternalFormatInfo) {
    // NOTE: these properties need unique names so we can let Uglify mangle the name.
    const t = {};
    // unsized formats
    t[ALPHA]              = { bytesPerElement: [1, 2, 2, 4],        type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT], };
    t[LUMINANCE]          = { bytesPerElement: [1, 2, 2, 4],        type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT], };
    t[LUMINANCE_ALPHA]    = { bytesPerElement: [2, 4, 4, 8],        type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT], };
    t[RGB]                = { bytesPerElement: [3, 6, 6, 12, 2],    type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT, UNSIGNED_SHORT_5_6_5], };
    t[RGBA]               = { bytesPerElement: [4, 8, 8, 16, 2, 2], type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT, UNSIGNED_SHORT_4_4_4_4, UNSIGNED_SHORT_5_5_5_1], };
    t[DEPTH_COMPONENT]    = { bytesPerElement: [2, 4],              type: [UNSIGNED_INT, UNSIGNED_SHORT], };
    t[DEPTH_STENCIL]      = { bytesPerElement: [4],                 };

    // sized formats
    t[R8]                 = { bytesPerElement: [1],  };
    t[R8_SNORM]           = { bytesPerElement: [1],  };
    t[R16F]               = { bytesPerElement: [2],  };
    t[R32F]               = { bytesPerElement: [4],  };
    t[R8UI]               = { bytesPerElement: [1],  };
    t[R8I]                = { bytesPerElement: [1],  };
    t[R16UI]              = { bytesPerElement: [2],  };
    t[R16I]               = { bytesPerElement: [2],  };
    t[R32UI]              = { bytesPerElement: [4],  };
    t[R32I]               = { bytesPerElement: [4],  };
    t[RG8]                = { bytesPerElement: [2],  };
    t[RG8_SNORM]          = { bytesPerElement: [2],  };
    t[RG16F]              = { bytesPerElement: [4],  };
    t[RG32F]              = { bytesPerElement: [8],  };
    t[RG8UI]              = { bytesPerElement: [2],  };
    t[RG8I]               = { bytesPerElement: [2],  };
    t[RG16UI]             = { bytesPerElement: [4],  };
    t[RG16I]              = { bytesPerElement: [4],  };
    t[RG32UI]             = { bytesPerElement: [8],  };
    t[RG32I]              = { bytesPerElement: [8],  };
    t[RGB8]               = { bytesPerElement: [3],  };
    t[SRGB8]              = { bytesPerElement: [3],  };
    t[RGB565]             = { bytesPerElement: [2],  };
    t[RGB8_SNORM]         = { bytesPerElement: [3],  };
    t[R11F_G11F_B10F]     = { bytesPerElement: [4],  };
    t[RGB9_E5]            = { bytesPerElement: [4],  };
    t[RGB16F]             = { bytesPerElement: [6],  };
    t[RGB32F]             = { bytesPerElement: [12], };
    t[RGB8UI]             = { bytesPerElement: [3],  };
    t[RGB8I]              = { bytesPerElement: [3],  };
    t[RGB16UI]            = { bytesPerElement: [6],  };
    t[RGB16I]             = { bytesPerElement: [6],  };
    t[RGB32UI]            = { bytesPerElement: [12], };
    t[RGB32I]             = { bytesPerElement: [12], };
    t[RGBA8]              = { bytesPerElement: [4],  };
    t[SRGB8_ALPHA8]       = { bytesPerElement: [4],  };
    t[RGBA8_SNORM]        = { bytesPerElement: [4],  };
    t[RGB5_A1]            = { bytesPerElement: [2],  };
    t[RGBA4]              = { bytesPerElement: [2],  };
    t[RGB10_A2]           = { bytesPerElement: [4],  };
    t[RGBA16F]            = { bytesPerElement: [8],  };
    t[RGBA32F]            = { bytesPerElement: [16], };
    t[RGBA8UI]            = { bytesPerElement: [4],  };
    t[RGBA8I]             = { bytesPerElement: [4],  };
    t[RGB10_A2UI]         = { bytesPerElement: [4],  };
    t[RGBA16UI]           = { bytesPerElement: [8],  };
    t[RGBA16I]            = { bytesPerElement: [8],  };
    t[RGBA32I]            = { bytesPerElement: [16], };
    t[RGBA32UI]           = { bytesPerElement: [16], };
    // Sized Internal
    t[DEPTH_COMPONENT16]  = { bytesPerElement: [2],  };
    t[DEPTH_COMPONENT24]  = { bytesPerElement: [4],  };
    t[DEPTH_COMPONENT32F] = { bytesPerElement: [4],  };
    t[DEPTH24_STENCIL8]   = { bytesPerElement: [4],  };
    t[DEPTH32F_STENCIL8]  = { bytesPerElement: [4],  };

    s_textureInternalFormatInfo = t;
  }
  return s_textureInternalFormatInfo[internalFormat];
}

/**
 * Gets the number of bytes per element for a given internalFormat / type
 * @param {number} internalFormat The internalFormat parameter from texImage2D etc..
 * @param {number} type The type parameter for texImage2D etc..
 * @return {number} the number of bytes per element for the given internalFormat, type combo
 * @memberOf module:twgl/textures
 */
export function getBytesPerElementForInternalFormat(internalFormat, type) {
  const info = getTextureInternalFormatInfo(internalFormat);
  if (!info) {
    throw "unknown internal format";
  }
  if (info.type) {
    const ndx = info.type.indexOf(type);
    if (ndx < 0) {
      throw new Error(`unsupported type ${type} for internalformat ${internalFormat}`);
    }
    return info.bytesPerElement[ndx];
  }
  return info.bytesPerElement[0];
}
