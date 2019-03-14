/**
 * GammaCV v0.3.5
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

class GraphNode {
  static GlobalCountIncrease() {
    GraphNode.GlobalNodesCount += 1;

    return GraphNode.GlobalNodesCount;
  }

  constructor(name) {
    this.id = GraphNode.GlobalCountIncrease();
    this.name = `${name}:${this.id}`;
  }
}

GraphNode.GlobalNodesCount = 0;

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

class GLUniform {
  constructor(gl, program, name, dtype) {
    this.gl = gl;
    this.name = name;
    this.dtype = dtype;
    this.location = gl.getUniformLocation(program, this.name);
  }

  set(value) {
    const gl = this.gl;

    switch (this.dtype) {
      case 'int':
        gl.uniform1i(this.location, value);
        break;
      case 'float':
        gl.uniform1f(this.location, value);
        break;
      case 'vec2':
        gl.uniform2fv(this.location, value);
        break;
      case 'vec3':
        gl.uniform3fv(this.location, value);
        break;
      case 'vec4':
        gl.uniform4fv(this.location, value);
        break;
      case 'mat3':
        gl.uniformMatrix3fv(this.location, false, value);
        break;
      case 'mat4':
        gl.uniformMatrix4fv(this.location, false, value);
        break;
      default:
        return false;
    }

    return true;
  }
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

class GLBuffer {
  constructor(gl, program, name, dtype) {
    this.program = program;
    this.gl = gl;
    this.name = name;
    this.dtype = dtype;
    this.location = gl.getAttribLocation(this.program, this.name);
    this.ctx = gl.createBuffer();
    this.empty = new ArrayBuffer(1);
    if (dtype === 'float' || dtype === 'int') {
      this.size = 1;
    } else {
      this.size = parseInt(/\d/g.exec(dtype)[0], 10);
      gl.enableVertexAttribArray(this.location);
    }
  }

  set(data) {
    const gl = this.gl;

    this.bind(this.ctx);
    if (this.dtype === 'int') {
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
    } else {
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    }
  }

  bind() {
    const gl = this.gl;

    if (this.dtype === 'int') {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ctx);
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.ctx);
      gl.vertexAttribPointer(this.location, this.size, gl.FLOAT, false, 0, 0);
    }
  }

  unbind() {
    const gl = this.gl;

    if (this.dtype === 'int') {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.vertexAttribPointer(this.location, this.size, gl.FLOAT, false, 0, 0);
    }
  }

  disable() {
    const gl = this.gl;

    gl.disableVertexAttribArray(this.ctx);
  }

  enable() {
    const gl = this.gl;

    gl.enableVertexAttribArray(this.ctx);
  }

  delete() {
    const gl = this.gl;

    gl.deleteBuffer(this.ctx);
    this.program = null;
    this.gl = null;
    this.ctx = null;
  }
}

var vertexShader = "precision highp float;attribute vec3 aVertexPosition;attribute vec2 aTextureCoords;varying vec2 texCoords;void main(void){texCoords=aTextureCoords;gl_Position=vec4(aVertexPosition,1.0);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

const errorStart = 'Error: An error occurred compiling the shaders: ';

function getOffset(line) {
  const l = /\d+\|(\s+)/.exec(line);

  if (l) {
    return ' '.repeat(l[1].length);
  }

  return ' '.repeat(2);
}

function prepareSourceLines(source) {
  let lines = source.split('\n');
  const targetLength = (lines.length + 1).toString().length;

  lines = lines.map((text, line) => `${(line + 1).toString().padStart(targetLength)}|  ${text}`);

  return lines;
}

function calcErrorStats(errors) {
  let errCount = 0;
  let warnCount = 0;

  for (let i = 0; i < errors.length; i += 1) {
    if (/ERROR/.exec(errors[i])) {
      errCount += 1;
    }
    if (/WARNING/.exec(errors[i])) {
      warnCount += 1;
    }
  }

  return {
    errCount,
    warnCount,
  };
}

function injectAll(kernel, error, useStyles = true) {
  const lines = prepareSourceLines(kernel);
  const targetLength = (lines.length + 1).toString().length;
  let errorText = error.toString();
  const shortErrors = [];
  const fullTextStyle = [];

  if (errorText.startsWith(errorStart)) {
    errorText = errorText.substr(errorStart.length);
  }

  const errors = errorText.split('\n');
  const errorsStats = calcErrorStats(errors);

  let offset = 0;

  for (let i = 0; i < errors.length; i += 1) {
    const text = errors[i];
    const lineNo = /0:(\d+)/.exec(text);

    if (lineNo) {
      const index = +lineNo[1] + offset;
      const preErrorLine = `${' '.repeat(targetLength)}|${getOffset(lines[index - 1])}`;

      shortErrors.push(`${text}\n${lines[index - 2]}\n${lines[index - 1]}\n${preErrorLine}^\n${lines[index]}`);
      const sS = useStyles ? '%c' : '';

      lines.splice(index, 0, `${sS}${preErrorLine}^--${text}${sS}`);
      if (useStyles) {
        fullTextStyle.push('color: red;');
        fullTextStyle.push('color: inherit;');
      }
      offset += 1;
    }
  }

  return {
    fullText: lines.join('\n'),
    firstError: shortErrors[0],
    errorsStats,
    fullTextStyle,
  };
}

function processError(kernel, kernelName, error) {
  try {
    const prepared = injectAll(kernel, error);
    const stats = prepared.errorsStats;

    console.group(`Error: An error occurred compiling the shader ${kernelName}: ${stats.errCount} ERRORS, ${stats.warnCount} WARNINGS`);
    console.log(prepared.firstError);
    console.groupCollapsed('Show more');
    console.log(prepared.fullText, ...prepared.fullTextStyle);
    console.groupEnd();
    console.groupEnd();
  } catch (err) {
    console.warn('Unable to process GLSG compiling error.');
  }
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

const parameters = {};

function testFloatTextures() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');

  if (!gl) {
    return false;
  }

  if (!gl.getExtension('OES_texture_float')) {
    return false;
  }

  const frameBuffer = gl.createFramebuffer();
  const texture = gl.createTexture();

  parameters.MAX_TEXTURE_SIZE = gl.getParameter(gl.MAX_TEXTURE_SIZE);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  const frameBufferComplete =
    gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;

  let noError;

  try {
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, new Float32Array(4));
    noError = gl.getError() === gl.NO_ERROR;
  } catch (err) {
    noError = false;
  }

  return frameBufferComplete && noError;
}

const SOURCE_ENV = {
  SUPPORTS_FLOAT_TEXTURES: testFloatTextures(),
  DEBUG: false,
  MAX_TEXTURE_SIZE: parameters.MAX_TEXTURE_SIZE,
};


const ENV = Object.assign({}, SOURCE_ENV);

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

function main(op) {
  let code = `
void main(void) {
  vec2 coords = gl_FragCoord.xy - 0.5;
  vec4 result = operation(coords.y, coords.x);

  gl_FragColor = result;
}
  `;

  if (!ENV.SUPPORTS_FLOAT_TEXTURES && op.dtype === 'float32') {
    code = `
    void main(void) {
      vec2 coords = gl_FragCoord.xy;

      highp float ox = floor(coords.x / 4.0);
      float dx = floor(coords.x - ox * 4.0 + 0.5);
    
      vec4 result = operation(coords.y - 0.5, floor((coords.x - 0.5) / 4.0));

      float value;

      if (dx == 1.0) {
        value = result.r;
      } else if (dx == 2.0) {
        value = result.g;
      } else if (dx == 3.0) {
        value = result.b;
      } else if (dx == 4.0) {
        value = result.a;
      }
    
      gl_FragColor = encode_float(value);
    }
    `;
  }

  return code;
}

var floatCode = "precision highp float;highp vec4 encode_float(highp float f){if(f==1./0.){return vec4(0.0,0.0,128.0,127.0)/255.0;}highp vec4 rgba;highp float e=5.0;highp float F=abs(f);highp float sign=step(0.0,-f);highp float exponent=floor(log2(F));highp float mantissa=(exp2(-exponent)*F);exponent=floor(log2(F)+127.0)+floor(log2(mantissa));rgba[0]=128.0*sign+floor(exponent*exp2(-1.0));rgba[1]=128.0*mod(exponent,2.0)+mod(floor(mantissa*64.0*2.0),128.0);rgba[2]=floor(mod(floor(mantissa*exp2(23.0-8.0)),exp2(8.0)));rgba[3]=floor(exp2(23.0)*mod(mantissa,exp2(-15.0)));return rgba.abgr/255.0;}float decode_float(highp vec4 rgba){rgba=rgba.abgr*255.0;highp float sign=1.0-step(128.0,rgba[0])*2.0;highp float exponent=2.0*mod(rgba[0],128.0)+step(128.0,rgba[1])-127.0;exponent=floor(exponent+0.5);highp float mantissa=mod(rgba[1],128.0)*32768.0*2.0+rgba[2]*256.0+rgba[3]+float(0x800000);highp float result=sign*mantissa*exp2(-23.0)*exp2(exponent);return result;}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

function pick_value(op) {
  const inputs = Object.keys(op.input);
  const functions = [];

  for (let i = 0; i < inputs.length; i += 1) {
    const key = inputs[i];

    if (!op.input[key].shape) {
      continue;
    }
    const shape = [...op.input[key].shape];

    const w = shape[1].toFixed(1);
    const h = shape[0].toFixed(1);
    const w4 = (shape[1] * 4).toFixed(1);

    let funcBody = (type, name, selector) =>
      `${type} ${name}_${key}(float y, float x) {\n\treturn texture2D(${key}, vec2((x + 0.5) / ${w}, (y + 0.5) / ${h}))${selector};\n}`;

    if (!ENV.SUPPORTS_FLOAT_TEXTURES && op.input[key].dtype === 'float32') {
      funcBody = (type, name, selector) => `
        ${type} ${name}_${key}(float y, float x) {
          float r = decode_float(texture2D(${key}, vec2((x * 4.0 + 0.5) / ${w4}, y / ${h})));
          float g = decode_float(texture2D(${key}, vec2((x * 4.0 + 1.5) / ${w4}, y / ${h})));
          float b = decode_float(texture2D(${key}, vec2((x * 4.0 + 2.5) / ${w4}, y / ${h})));
          float a = decode_float(texture2D(${key}, vec2((x * 4.0 + 3.5) / ${w4}, y / ${h})));

          return vec4(r, g, b, a)${selector};
        }
      `;
    }

    functions.push(funcBody('vec4', 'pickValue', ''));
    functions.push(funcBody('float', 'pickScalarValue', '.x'));
  }

  return functions.join('\n');
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name GLSLChunks
 * @description WebGL chunks is a set of helper functions that help enable code reuse
 * and utilize higher-level abstractions in your GPU kernels.
 * To use chunk, you must type `operationsRegister.LoadChunk(...chunkNames)`.
 * Some chunks are used under the hood, it is:
 * - `main` - Used to wrap operations into a smart entry point.
 * - `float` - Used as a polyfill the float textures on some devices.
 */

/**
 * @name pickValue_INPUTNAME
 * @function
 * @description Returns pixel data of `texture` with the same
 * coordinates as current operation pixel.
 * @param {float} y - coordinate of needed pixel
 * @param {float} x - coordinate of needed pixel
 * @returns {vec4}
*/

const float = () => floatCode;

var chunks = /*#__PURE__*/Object.freeze({
  main: main,
  pickValue: pick_value,
  float: float
});

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

// TODO: Need to move it to kind of program_utils
function validType(dtype) {
  return [
    'bool', 'int', 'uint',
    'float', 'double',
    'vec2', 'vec3', 'vec4',
    'mat2', 'mat3', 'mat4',
    'sampler2D',
  ].indexOf(dtype) >= 0;
}

function getType(value) {
  let type = typeof value;

  value = String(value);
  const complexType = /^(vec\d|mat\d)\([^)]+\)$/.exec(value);

  if (complexType) {
    type = complexType[1];
  } else if (/^\d+$/.exec(value)) {
    type = 'int';
  } else if (/^\d+\.(\d+)?$/.exec(value)) {
    type = 'float';
  } else if (type === 'boolean') {
    type = 'bool';
  }

  return type;
}

function constructHeading(op) {
  const uniforms = Object.assign({}, op.uniform);
  const inputKeys = Object.keys(op.input);
  let head = 'precision highp float;\n';

  for (let i = 0; i < inputKeys.length; i += 1) {
    const key = inputKeys[i];

    uniforms[key] = { dtype: 'sampler2D' };
  }

  const uniformsKeys = Object.keys(uniforms);

  for (let i = 0; i < uniformsKeys.length; i += 1) {
    const key = uniformsKeys[i];

    if (!validType(uniforms[key].dtype)) {
      throw new Error(`Uniform ${key} has invalid type "${uniforms[key].dtype}"`);
    }

    head += `uniform ${uniforms[key].dtype} ${key};\n`;
  }
  head += 'varying vec2 texCoords;\n';
  const constantsKeys = Object.keys(op.constant);

  for (let i = 0; i < constantsKeys.length; i += 1) {
    const key = constantsKeys[i];
    let preparedValue = op.constant[key];
    const valueType = typeof preparedValue;

    if (valueType === 'number' && preparedValue % 1 === 0) {
      preparedValue = preparedValue.toFixed(1);
    }

    const glValueType = getType(preparedValue);

    if (!validType(glValueType)) {
      throw new Error(`Constant ${key}, has invalid type "${glValueType}"`);
    }

    head += `#define ${key} ${preparedValue}\n`;
  }

  return head;
}


function injectChunks(op) {
  const separateWidth = 35;
  const requiredChunks = [];

  if (!ENV.SUPPORTS_FLOAT_TEXTURES) {
    requiredChunks.push('float');
  }

  const dependencies = requiredChunks
    .concat(op.chunks.filter((item, pos, self) => self.indexOf(item) === pos));

  return dependencies.map((name) => {
    const midString = ` Chunk ${name} `;
    const pad = separateWidth - midString.length;
    const head = `${'-'.repeat(Math.floor(pad / 2))}${midString}${'-'.repeat(Math.ceil(pad / 2))}`;

    if (typeof chunks[name] === 'function') {
      return `/*${head}*/\n${chunks[name](op)}\n/*${'-'.repeat(separateWidth)}*/`;
    }

    throw new TypeError(`Chunk "${name}" is not a function`);
  }).join('\n');
}

function hasMain(code) {
  return !!(/void main\([\s\S]+\)([\s]+)?{/.exec(code));
}

function constructKernel(op) {
  let fullKernel;

  if (hasMain(op.kernel)) {
    fullKernel = op.kernel;
  } else {
    const head = constructHeading(op);
    const dependencies = injectChunks(op);
    const end = main(op);

    fullKernel = [head, dependencies, op.kernel, end].join('\n\n');
  }

  if (ENV.DEBUG) {
    console.groupCollapsed(op.name);
    console.log(prepareSourceLines(fullKernel).join('\n'));
    console.groupEnd();
  }

  return fullKernel;
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

const AVAILABLE_GLSL_CHUNKS = ['pickCurrentValue', 'pickValue', 'float'];

const assert$$1 = (expression, msg) => {
  if (!expression) {
    throw new Error(msg);
  }
};


const assertShapesAreEqual$$1 = (a, b) => {
  if (a.shape.length !== b.shape.length) {
    return false;
  }

  for (let i = 0; i < a.shape.length; i += 1) {
    if (a.shape[i] !== b.shape[i]) {
      return false;
    }
  }

  return true;
};

const isValidShape$$1 = shape => Array.isArray(shape)
  && shape.length > 0
  && !shape.some(n => n % 1 !== 0);
const isOperation$$1 = op => op instanceof Operation;
const isTensor$$1 = tensor => tensor instanceof Tensor;
const isValidGLSLChunk$$1 = name => AVAILABLE_GLSL_CHUNKS.includes(name);
const isValidGLSLVariableName$$1 = name => /^[A-Za-z](\w+)?$/.test(name);
const isValidOperationShape$$1 = shape => shape[0] > 0 && shape[1] > 0;

class DeprecationError$$1 extends Error { }

function deprecationWarning$$1(name, msg) {
  console.warn(`GammaCV Deprecation Warning: "${name}" is deprecated${msg ? `, ${msg}` : ''}. "${name}" will be removed in next major version.`);
}

function deprecationError$$1(name, msg) {
  throw new DeprecationError$$1(`GammaCV Deprecation Error: "${name}" is deprecated${msg ? `, ${msg}` : ''}. "${name}" and was removed.`);
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

class Operation extends GraphNode {
  constructor(name) {
    assert$$1(
      typeof name !== 'undefined',
      'Operation: Operation shouldn\'t be unnamed.',
    );
    super(name);
    this.dtype = null;
    this.input = {};
    this.uniform = {};
    this.constant = {};
    this.chunks = [];
    this.inputKeys = [];
    this.isInitialized = false;
    this.lastCtx = Math.random();
    this.cache = true;
  }

  run(sess, ctx, isRecalculated) {
    assert$$1(
      this.isInitialized,
      'Operation: Unable to run unilialized operation.',
    );

    const gl = this.gl;
    const outTexture = sess.texture[this.name];

    if (
      ctx === this.lastCtx
      && this.cache
      && !isRecalculated
    ) {
      outTexture.bind(this.program, false, this.inputKeys.length);
      this.bindBuffer();

      return false;
    }

    this.lastCtx = ctx;

    gl.useProgram(this.program);

    for (let i = 0; i < this.inputKeys.length; i += 1) {
      const key = this.inputKeys[i];
      const input = this.input[key];
      const opName = input.name;
      const texture = sess.texture[opName];

      texture.bind(this.program, key, i);

      if (isTensor$$1(input)) {
        texture.set(input);
      }
    }

    outTexture.bind(this.program, false, this.inputKeys.length);
    this.bindBuffer();

    gl.viewport(0, 0, (this.dtype === 'float32' ? 4 : 1) * this.shape[1], this.shape[0]);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    return true;
  }

  unbindBuffer() {
    const gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  bindBuffer() {
    const gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  }

  init(gl) {
    if (!this.isInitialized) {
      this.gl = gl;
      this.program = gl.createProgram();
      this.framebuffer = gl.createFramebuffer();

      if (this.isInitialized) {
        return false;
      }

      this.name = this.name;
      this.shape = this.shape;
      this.constant.OUT_VIEW = `vec2(${this.shape[1]}, ${this.shape[0]})`;
      this.kernel = constructKernel(this);
      // Initialization:
      // - Kernel compilation
      // - Uniforms initialization

      // Kernel compilation.
      try {
        this.vertexShader = this.getShader('vertex', vertexShader);
        gl.attachShader(this.program, this.vertexShader);
        this.fragmentShader = this.getShader('fragment', this.kernel);
        gl.attachShader(this.program, this.fragmentShader);
        gl.linkProgram(this.program);
        gl.useProgram(this.program);
      } catch (err) {
        processError(this.kernel, this.name, err);
        throw new Error(`GPUProgram: Error during shader compilation.\n${err.message}`);
      }

      this.attributes = {
        aVertexPosition: new GLBuffer(
          this.gl,
          this.program,
          'aVertexPosition',
          'vec3',
        ),
        aTextureCoords: new GLBuffer(
          this.gl,
          this.program,
          'aTextureCoords',
          'vec2',
        ),
        aIndices: new GLBuffer(
          this.gl,
          this.program,
          'aIndices',
          'int',
        ),
      };

      // Set buffer values
      this.attributes.aVertexPosition.set([1.0, 1.0, 0.0, -1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0, 1.0, -1.0, 0.0]);
      this.attributes.aTextureCoords.set([1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0]);
      this.attributes.aIndices.set([0, 1, 2, 0, 2, 3]);

      // Init uniforms and set default values
      const uniformKeys = Object.keys(this.uniform);

      for (let j = 0; j < uniformKeys.length; j += 1) {
        const uniform = this.uniform[uniformKeys[j]];

        this.uniform[uniformKeys[j]] = new GLUniform(
          this.gl,
          this.program,
          uniform.name,
          uniform.dtype,
        );

        if (uniform.defaultValue) {
          this.uniform[uniformKeys[j]].set(uniform.defaultValue);
        }
      }

      this.isInitialized = true;
    }

    return true;
  }

  getShader(type, src) {
    const gl = this.gl;
    let shader = null;

    if (type === 'fragment') {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else {
      shader = gl.createShader(gl.VERTEX_SHADER);
    }

    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
    }

    return shader;
  }

  traverse(handler, context) {
    const inputNames = Object.keys(this.input);

    for (let i = 0; i < inputNames.length; i += 1) {
      const name = inputNames[i];

      if (this.input[name] instanceof Operation) {
        this.input[name].traverse(handler, context);
      } else {
        handler(this.input[name], context);
      }
    }

    handler(this, context);
  }

  getDependencies() {
    const path = [];
    const inputNames = Object.keys(this.input);

    for (let i = 0; i < inputNames.length; i += 1) {
      const name = inputNames[i];

      if (this.input[name] instanceof Operation) {
        const innerDeps = this.input[name].getDependencies();

        for (let j = 0; j < innerDeps.length; j += 1) {
          if (path.indexOf(innerDeps[j]) === -1) {
            path.push(innerDeps[j]);
          }
        }
      }
    }

    path.push(this.name);

    return path;
  }

  assignInput(name, input) {
    this.input[name] = input;

    if (this.inputKeys.indexOf(name) === -1) {
      this.inputKeys.push(name);
    }
  }

  cloneProp(name) {
    const names = Object.keys(this[name]);
    const prop = {};

    for (let i = 0; i < names.length; i += 1) {
      const cursor = names[i];

      prop[cursor] = this[name][cursor];
    }

    return prop;
  }

  destroy() {
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }
    if (this.vertexShader) {
      this.gl.deleteShader(this.vertexShader);
    }
    if (this.fragmentShader) {
      this.gl.deleteShader(this.fragmentShader);
    }
    if (this.framebuffer) {
      this.gl.deleteFramebuffer(this.framebuffer);
    }
  }

  clone() {
    const op = new Operation(this.name.split(':')[0]);

    op.input = this.cloneProp('input');
    op.uniform = this.cloneProp('uniform');
    op.constant = this.cloneProp('constant');
    op.dtype = this.dtype;
    op.kernel = this.kernel;
    op.chunks = this.chunks;

    return op;
  }
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

class GPUTexture {
  constructor(dtype, gl, unit, shape) {
    if (dtype === 'float32' || dtype === 'uint8') {
      this.unit = unit;
      this.dtype = dtype;
      this.gl = gl;
      this.ctx = gl.createTexture();
      this.shape = shape;

      gl.bindTexture(gl.TEXTURE_2D, this.ctx);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      this.allocate();
    } else {
      throw new Error(`GPUTexture: Invalid texture type, currently supported is: float32, uint8, but got ${dtype} `);
    }
  }

  allocate() {
    const gl = this.gl;
    let width = this.shape[1];
    let type = gl.UNSIGNED_BYTE;

    if (this.dtype === 'float32') {
      if (ENV.SUPPORTS_FLOAT_TEXTURES) {
        type = gl.FLOAT;
      } else {
        width *= 4;
      }
    }

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      this.shape[0],
      0,
      gl.RGBA,
      type,
      null,
    );
  }

  set(tensor = null) {
    const gl = this.gl;
    let width = tensor.shape[1];
    let type = gl.UNSIGNED_BYTE;
    let data = tensor.data;

    if (tensor.dtype === 'float32') {
      if (ENV.SUPPORTS_FLOAT_TEXTURES) {
        type = gl.FLOAT;
      } else {
        width *= 4;
        data = tensor.uint8View;
      }
    }

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      this.shape[0],
      0,
      gl.RGBA,
      type,
      data,
    );
  }

  bind(program, name, unit) {
    const gl = this.gl;

    if (name) {
      const location = gl.getUniformLocation(program, name);

      gl.uniform1i(location, unit);
    }

    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.ctx);

    this.unit = unit;
  }

  unbind() {
    const gl = this.gl;

    gl.activeTexture(gl.TEXTURE0 + this.unit);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  delete() {
    const gl = this.gl;

    gl.deleteTexture(this.ctx);
    this.gl = null;
    this.program = null;
    this.ctx = null;
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

function range(n) {
  const result = new Array(n);

  for (let i = 0; i < n; i += 1) {
    result[i] = i;
  }

  return result;
}

function tensorFrom(input, cast = false) {
  let out = null;

  if (input instanceof Operation) {
    out = new Tensor(cast || input.dtype, input.shape);
  }

  if (input instanceof Tensor) {
    out = new Tensor(cast || input.dtype, input.shape);
  }

  return out;
}

function tensorClone(from, to) {
  if (to.data.set) {
    to.data.set(from.data);
  } else {
    for (let i = 0; i < to.size; i += 1) {
      to.data[i] = from.data[i];
    }
  }
}

/**
 * @param {Tensor} input
 * @param {Tensor} [output]
 * @param {Array.<number>} invertShape
 */

function tensorInvert(
  input,
  output = input,
  invertShape = new Array(input.shape.length).fill(true),
) {
  const shape = input.shape;

  if (input === output) {
    input = input.clone();
  }

  if (input.shape.length !== output.shape.length) {
    throw new Error('invertTensor: Unable to invert, input and output has different shapes');
  }

  const tmpArr = new Array(shape.length); // eslint-disable-line
  let invert = () => { }; // eslint-disable-line

  eval(`invert = function (coords) { ${invertShape.map((a, key) => a ? `tmpArr[${key}] = shape[${key}] - 1 - coords[${key}]` : `tmpArr[${key}] = coords[${key}]`).join(';')}; return tmpArr; }`); // eslint-disable-line

  for (let i = 0; i < input.size; i += 1) {
    const coords = Tensor.IndexToCoord(shape, i);
    const inverted = invert(coords, tmpArr);

    output.set(...inverted, input.get(...coords));
  }

  return output;
}


const tensorAssertEqual = (actual, expected) => {
  if (!assertShapesAreEqual$$1(actual, expected)) {
    return false;
  }

  for (let i = 0; i < actual.size; i += 1) {
    if (actual.data[i] !== expected.data[i]) {
      return false;
    }
  }

  return true;
};

const tensorAssertCloseEqual = (actual, expected, delta = 1) => {
  if (!assertShapesAreEqual$$1(actual, expected)) {
    return false;
  }

  for (let i = 0; i < actual.size; i += 1) {
    if (Math.abs(actual.data[i] - expected.data[i]) > delta) {
      return false;
    }
  }

  return true;
};

const tensorAssertMSEEqual = (actual, expected, delta = 1) => {
  if (!assertShapesAreEqual$$1(actual, expected)) {
    return false;
  }

  let mse = 0;

  for (let i = 0; i < actual.size; i += 1) {
    mse += (actual.data[i] - expected.data[i]) ** 2;
  }

  mse = Math.sqrt(mse) / actual.size;

  return mse < delta;
};

/**
 * @param {Tensor} input
 * @param {Tensor} [output]
 * @param {Array.<number>} invertShape
 */

function flipTensor(
  input,
  output = input,
  invertShape = new Array(input.shape.length).fill(true),
) {
  const shape = input.shape;

  if (input === output) {
    input = input.clone();
  }

  if (input.shape.length !== output.shape.length) {
    throw new Error('invertTensor: Unable to invert, input and output has different shapes');
  }

  const tmpArr = new Array(shape.length); // eslint-disable-line
  let invert = () => { }; // eslint-disable-line

  eval(`invert = function (coords) { ${invertShape.map((a, key) => a ? `tmpArr[${key}] = shape[${key}] - 1 - coords[${key}]` : `tmpArr[${key}] = coords[${key}]`).join(';')}; return tmpArr; }`); // eslint-disable-line

  for (let i = 0; i < input.size; i += 1) {
    const coords = Tensor.IndexToCoord(shape, i);
    const inverted = invert(coords, tmpArr);

    output.set(...inverted, input.get(...coords));
  }

  return output;
}

/**
 * @deprecated
 */
function invertTensor(...args) {
  deprecationWarning$$1('invertTensor', 'use "flipTensor" instead');

  return flipTensor(...args);
}

/**
 * Map tensor by each component
 * @param {Tensor} t - input
 * @param {function} fn
 * @param {Tensor} [out] - output
 */
function tensorMap(t, fn, out = t) {
  for (let i = 0; i < t.size; i += 1) {
    out.data[i] = fn(t.data[i], i);
  }
}

/**
 * Create tensor filled with 1
 * @param {string} dtype
 * @param {array} shape
 * @returns {Tensor}
 */
function tensorOnes(dtype, shape) {
  const result = new Tensor(dtype, shape);

  tensorMap(result, () => 1);

  return result;
}

function tensorFromFlat(arr, shape = [1, arr.length, 4], dtype = 'float32', alpha) {
  const res = new Array(arr.length * 4);

  for (let i = 0; i < res.length; i += 1) {
    if ((i + 1) % 4 === 0 && typeof alpha === 'number') {
      res[i] = alpha;
    } else {
      res[i] = arr[~~(i / 4)];
    }
  }

  return new Tensor(dtype, shape, Tensor.GetTypedArray(dtype, res));
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @class Tensor
 * @description N Dimensional data view, that helps create, store, manipulate data.
 */
class Tensor extends GraphNode {
  /**
   * @param {string} dtype - the data type for tensor instance
   * @param {Array.<number>} shape - the list of integers,
   * @param {DataView|Array} [data] - initial data to store
   * @param {Array.<number>} [stride] - custom mapping from plain to NDArray
   * @param {number} [offset] - number of data elements to skip
   */
  constructor(dtype, shape, data, stride, offset = 0) {
    super('Tensor');
    this.dtype = dtype;
    this.shape = shape || [data.length];

    assert$$1(isValidShape$$1(this.shape), 'Shape is not valid');
    if (stride) {
      assert$$1(isValidShape$$1(stride), 'Stride is not valid');
      assert$$1(this.shape.length === stride.length, 'Stride length should be equal to shape length');
    }
    assert$$1(typeof offset === 'number' && offset % 1 === 0, `Offset should be integer, but got ${offset}`);

    this.size = Tensor.GetSize(this.shape);
    this.stride = stride || this._defineStride(this.shape);
    this.offset = offset;


    this._compileJITMethods();

    if (typeof data === 'undefined') {
      this.data = Tensor.Malloc(dtype, this.size);
      this.empty = Tensor.Malloc(dtype, this.size);
    } else {
      this.assign(data);
    }

    if (!ENV.SUPPORTS_FLOAT_TEXTURES && dtype === 'float32') {
      this.uint8View = new Uint8Array(this.data.buffer);
    }
  }

  _compileJITMethods() {
    const indices = range(this.shape.length);
    const argsStr = indices.map(i => `i${i}`).join(',');
    const indexStr = `${this.offset}+${indices.map(i => `${this.stride[i]}*i${i}`).join('+')}`;

    /**
     * @name get
     * @method
     * @description Get data element by coordinates
     * @param {...number} x - coordinates
     *
     * Require N number arguments, where n - dimention of a tensor.
     * @return {number}
     * @example
     * const t = new gm.Tensor('uint8', [2, 3], new Uint8Array([1, 2, 3, 4, 5, 6]));
     * t.get(0, 0); // 1
     * t.get(0, 1); // 2
     * t.get(1, 2); // 6
     */
    this.get = new Function(`return function get(${argsStr}) { return this.data[${indexStr}]; }`)(); // eslint-disable-line

    /**
     * @name set
     * @method
     * @description Put value to tensor by coordinates
     * @param {...number} x - coordinates
     * @param {number} v - value
     *
     * @example
     * const t = new gm.Tensor('uint8', [2, 3], new Uint8Array([1, 2, 3, 4, 5, 6]));
     * t.set(0, 0, 10); // 1
     * t.set(0, 1, 15); // 2
     * t.set(1, 2, 20); // 6
     *
     * console.log(t.data); // <Uint8Array[10, 15, 3, 4, 5, 20]>
     */
    this.set = new Function(`return function get(${argsStr}, v) { this.data[${indexStr}] = v; }`)(); // eslint-disable-line

    /**
     * @name index
     * @method
     * @description Get's index in plain data view of data element specified by coordinates
     * @param {...number} x - coordinates
     *
     * Require N number arguments, where n - dimention of a tensor.
     * @return {number}
     * @example
     * const t = new gm.Tensor('uint8', [2, 3], new Uint8Array([1, 2, 3, 4, 5, 6]));
     * t.index(0, 0); // 0
     * t.index(0, 1); // 1
     * t.index(1, 2); // 5
     */
    this.index = new Function(`return function get(${argsStr}, v) { return ${indexStr}; }`)(); // eslint-disable-line
  }

  _defineStride(shape) {
    const d = shape.length;
    const stride = new Array(d);

    for (let i = d - 1, sz = 1; i >= 0; i -= 1) {
      stride[i] = sz;
      sz *= this.shape[i];
    }

    return stride;
  }

  /**
   * @name Tensor.assign
   * @param {DataView|Array} data
   * @returns {Tensor} self
   */
  assign(data) {
    const nextDtype = Tensor.DefineType(data);
    const nextLength = data.length;

    assert$$1(nextDtype === this.dtype, `Different dtypes assigned: \n   expected - ${this.dtype} \n   actual - ${nextDtype}`);
    assert$$1(nextLength === this.size + this.offset, `Different sizes assigned: \n   expected - ${this.size + this.offset} \n   actual - ${nextLength}`);

    this.data = data;

    return this;
  }

  /**
   * @description Write zeros into tensor's data
   * @return {Tensor} self
   */
  relese() {
    if (this.empty) {
      this.data.set(this.empty);
    } else {
      this.data = Tensor.Malloc(this.dtype, this.size);
    }

    return this;
  }

  /**
   * @return {Tensor} a shallow copy, new instance
   */
  clone() {
    const result = new Tensor(this.dtype, this.shape, undefined, this.stride, this.offset);

    tensorClone(this, result);

    return result;
  }

  /**
   * @static
   * @param {Array.<number>} shape
   * @param {number} index
   * @return {Array.<number>} coordinets that maps to the entered index
   */
  static IndexToCoord(shape, index) {
    const res = new Array(shape.length);
    let _index = index;
    let shapeSum = shape.reduce((s, b) => s * b);

    for (let i = 0; i <= shape.length - 2; i += 1) {
      shapeSum /= shape[i];
      const r = ~~(_index / shapeSum);

      _index %= shapeSum;
      res[i] = r;
    }
    res[res.length - 1] = _index % shape[shape.length - 1];

    return res;
  }

  /**
   * @static
   * @param {Array.<number>} shape
   * @param {Array.<number>} coords
   * @return {number} index that mapped from entered coords
   */
  static CoordToIndex(shape, coords) {
    let shapeSum = 1;
    let sum = 0;

    for (let i = shape.length - 1; i >= 0; i -= 1) {
      sum += shapeSum * coords[i];
      shapeSum *= shape[i];
    }

    return sum;
  }

  /**
   * @static
   * @param {string} dtype
   * @param {number} size
   * @return {Tensor}
   */
  static Malloc(dtype, size) {
    switch (dtype) {
      case 'uint8':
        return new Uint8Array(size);
      case 'uint16':
        return new Uint16Array(size);
      case 'uint32':
        return new Uint32Array(size);
      case 'int8':
        return new Int8Array(size);
      case 'int16':
        return new Int16Array(size);
      case 'int32':
        return new Int32Array(size);
      case 'float32':
        return new Float32Array(size);
      case 'float64':
        return new Float64Array(size);
      case 'uint8c':
        return new Uint8ClampedArray(size);
      case 'array':
        return new Array(size);
      default:
        throw new Error(`Unexpected type: ${dtype}.`);
    }
  }

  /**
   * @static
   * @description Define data type of an argument
   * @param {DataView|Array} data
   * @return {string}
   * @example
   * gm.Tensor.DefineType(new Float32Array()); // float32
   */
  static DefineType(buffer) {
    const str = Object.prototype.toString.call(buffer);

    switch (str) {
      case '[object Uint8Array]':
        return 'uint8';
      case '[object Uint16Array]':
        return 'uint16';
      case '[object Uint32Array]':
        return 'uint32';
      case '[object Int8Array]':
        return 'int8';
      case '[object Int16Array]':
        return 'int16';
      case '[object Int32Array]':
        return 'int32';
      case '[object Float32Array]':
        return 'float32';
      case '[object Float64Array]':
        return 'float64';
      case '[object Uint8ClampedArray]':
        return 'uint8c';
      case '[object Array]':
        return 'array';
      default:
        throw new Error(`Unknown dtype: ${str}.`);
    }
  }

  /**
   * @static
   * @description Generate DataView
   * @param {string} dtype - data type of view
   * @param {DataView|Array} data - initial data
   * @return {DataView|Array}
   */
  static GetTypedArray(dtype, data) {
    if (dtype === Tensor.DefineType(data)) {
      return data;
    }

    switch (dtype) {
      case 'uint8':
        return new Uint8Array(data);
      case 'uint16':
        return new Uint16Array(data);
      case 'uint32':
        return new Uint32Array(data);
      case 'int8':
        return new Int8Array(data);
      case 'int16':
        return new Int16Array(data);
      case 'int32':
        return new Int32Array(data);
      case 'float32':
        return new Float32Array(data);
      case 'float64':
        return new Float64Array(data);
      case 'uint8c':
        return new Uint8ClampedArray(data);
      case 'array':
        return new Array(data);
      default:
        throw new Error(`Unknown type: ${dtype}.`);
    }
  }

  /**
   * @static
   * @param {Array.<number>} shape
   * @return {number} Number of elements that described by shape
   */
  static GetSize(shape) {
    return shape.reduce((a, b) => a * b, 1);
  }
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @class Session
 * @description This is a runtime which allows you to run computational graphs on different backends
 */
class Session {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.initWebGL(this.canvas);

    this.operation = {};
    this.texture = {};
    this.textureCount = 0;
  }

  initWebGL(canvas, opts) {
    this.canvas = canvas;
    const gl = this.canvas.getContext('webgl', opts);
    const float32Ext = gl.getExtension('OES_texture_float');

    assert$$1(
      !!gl,
      'WebGL not supported.',
    );
    assert$$1(
      !!float32Ext,
      'Unable to find extension OES_texture_float',
    );

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.gl = gl;
  }

  /**
   * @description Intialize operations for session
   * @param {Operation} node - operation chain to be used in session
   */
  init(node) {
    // Make sure we trying to initialize true Operation
    assert$$1(
      !!node,
      'Session: Unable to initialize undefined operation',
    );

    assert$$1(
      isOperation$$1(node) || isTensor$$1(node),
      'Session: Unable to initialize operation with invalid input type',
    );

    if (isOperation$$1(node)) {
      // Traversing of all the operations and flatten it to key-value storage
      node.traverse((input, sess) => {
        sess.operation[input.name] = input;
      }, this);
    }

    if (isTensor$$1(node)) {
      this.operation[node.name] = node;
    }

    this.update();
  }

  update() {
    const gl = this.gl;
    const opKeys = Object.keys(this.operation);

    for (let i = 0; i < opKeys.length; i += 1) {
      const operation = this.operation[opKeys[i]];

      if (operation instanceof Operation) {
        operation.init(this.gl);
      }

      if (!this.texture[opKeys[i]]) {
        this.texture[opKeys[i]] = new GPUTexture(
          operation.dtype,
          this.gl,
          this.textureCount,
          operation.shape,
        );

        if (operation instanceof Operation) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, operation.framebuffer);
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.texture[opKeys[i]].ctx,
            0,
          );
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        this.textureCount += 1;
      }
    }
  }

  /**
   * @description Run Operation
   * @param {Operation} op - operation to run
   * @param {*} ctx - context of a run, passing the same context twice in a raw
   *    will use cached result
   * @param {Tensor} [output] - if passed, the output is put into it.
   */
  runOp(op, ctx, output = false) {
    const sequence = op.sequence;
    let isRecalculated = false;

    for (let i = 0; i < sequence.length; i += 1) {
      const key = sequence[i];
      const operation = this.operation[key];
      const isLastOp = i === (sequence.length - 1);

      if (operation.run(this, ctx, isRecalculated)) {
        isRecalculated = true;
      } else {
        isRecalculated = false;
      }

      if (output && output instanceof Tensor && isLastOp) {
        this.readToTensor(output);
      }
    }
  }

  /**
   * @description Destroy all initialized operations,
   * texture and outher data connected this session.
   */
  destroy() {
    const glLoseContext = this.gl.getExtension('WEBGL_lose_context');
    const textures = Object.keys(this.texture);
    const operations = Object.keys(this.operation);

    if (glLoseContext) {
      glLoseContext.loseContext();
    }

    for (let i = 0; i < textures.length; i += 1) {
      this.texture[textures[i]].delete();
    }

    for (let i = 0; i < operations.length; i += 1) {
      const op = this.operation[operations[i]];

      if (op instanceof Operation) {
        op.destroy();
      }
    }

    this.canvas = null;
    this.operation = {};
    this.texture = {};
    this.gl = null;
    this.textureCount = 0;
  }

  readToTensor(tensor) {
    const gl = this.gl;
    let width = tensor.shape[1];
    let type = gl.UNSIGNED_BYTE;
    let data = tensor.data;

    if (tensor.dtype === 'float32') {
      if (ENV.SUPPORTS_FLOAT_TEXTURES) {
        type = gl.FLOAT;
      } else {
        width *= 4;
        data = tensor.uint8View;
      }
    }

    gl.readPixels(
      0,
      0,
      width,
      tensor.shape[0],
      gl.RGBA,
      type,
      data,
    );
  }
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name RegisterOperation
 */
class RegisterOperation {
  constructor(name) {
    this.op = new Operation(name);
    this.name = name;
    this.checkShape = (a) => {
      const keys = Object.keys(a);

      return a[keys[0]];
    };
    this.preCompile = () => { };
    this.postCompile = () => { };
    this.chunks = [];
  }

  GLSLKernel(kernel) {
    assert$$1(
      typeof kernel === 'string',
      'RegisterOperation: The kernel should be a string but it is not.',
    );
    this.op.kernel = kernel;

    return this;
  }

  LoadChunk(...chunks) {
    for (const chunk of chunks) {
      assert$$1(
        isValidGLSLChunk$$1(chunk),
        `There is no available GLSL chunk supported: ${chunk}`,
      );
    }

    this.op.chunks = this.op.chunks.concat(chunks);

    return this;
  }

  Input(name, dtype) {
    assert$$1(isValidGLSLVariableName$$1(name));
    this.op.input[name] = { name, dtype };

    return this;
  }

  Output(dtype) {
    assert$$1(
      this.op.dtype === null,
      'RegisterOperation: The operation allows a single output.',
    );

    this.op.dtype = dtype;

    return this;
  }

  Constant(name, value) {
    assert$$1(isValidGLSLVariableName$$1(name));
    this.op.constant[name] = value;

    return this;
  }

  SetShapeFn(fn) {
    assert$$1(typeof fn === 'function', 'SetShapeFn should receive function in first argument');
    this.checkShape = fn;

    return this;
  }

  PreCompile(fn) {
    assert$$1(typeof fn === 'function', 'PreCompile should receive function in first argument');
    this.preCompile = fn;

    return this;
  }

  PostCompile(fn) {
    assert$$1(typeof fn === 'function', 'PostCompile should receive function in first argument');
    this.postCompile = fn;

    return this;
  }

  Uniform(name, dtype, defaultValue) {
    assert$$1(isValidGLSLVariableName$$1(name));
    this.op.uniform[name] = { name, dtype, defaultValue };

    return this;
  }

  Compile(input) {
    const op = this.op.clone();
    const inputShapes = {};
    const keys = Object.keys(input);

    this.preCompile(op);

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const inputNode = input[key];

      assert$$1(
        !!inputNode,
        `RegisterOperation:${op.name}.${key}:
         Can't compile operation with undefined input.`,
      );

      assert$$1(
        isTensor$$1(inputNode) || isOperation$$1(inputNode),
        `RegisterOperation:${op.name}.${key}:
         Can't compile operation with invalid input type.
         You can only use Tensor or another Operation to be an input`,
      );

      inputShapes[key] = input[key].shape;
      op.assignInput(key, input[key]);
    }

    op.shape = this.checkShape(inputShapes);
    op.sequence = op.getDependencies();

    return op;
  }
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

function initDrawable(canvas, output, updater) {
  let flag = false;

  canvas.onmousedown = () => { flag = true; };
  canvas.onmouseup = () => { flag = false; };
  canvas.onmousemove = (e) => {
    if (flag) {
      output.set(e.offsetY, e.offsetX, 255);

      if (updater) {
        updater();
      }
    }
  };

  return () => {
    canvas.onmousedown = null;
    canvas.onmouseup = null;
    canvas.onmousemove = null;
  };
}

function initMouseTracking(canvas, handler) {
  canvas.onmousemove = e => handler(e.offsetX, e.offsetY);

  return () => {
    canvas.onmousemove = null;
  };
}


/**
 * toImageData
 * @param {Tensor} img
 * @param {boolean} rgba
 * @return {ImageData}
 */

function toImageData(img, rgba = false, transposed = false) {
  const imageData = new ImageData(img.shape[1], img.shape[0]);
  const size = img.shape[0] * img.shape[1];

  if (rgba && img.dtype === 'uint8') {
    imageData.data.set(img.data);

    return imageData;
  }

  if (!rgba) {
    for (let i = 0; i < size; i += 1) {
      const y = ~~(i / img.shape[0]);
      const x = i - (y * img.shape[1]);
      const val = img.data[i];
      let offset = 0;

      if (!transposed) {
        offset = ((y * img.shape[1]) + x) * 4;
      } else {
        offset = ((x * img.shape[0]) + y) * 4;
      }

      imageData.data[offset + 0] = val;
      imageData.data[offset + 1] = val;
      imageData.data[offset + 2] = val;
      imageData.data[offset + 3] = 255;
    }

    return imageData;
  }

  if (img.dtype === 'float32') {
    for (let i = 0; i < img.size; i += 1) {
      imageData.data[i] = img.data[i] * 255;
    }
  } else {
    for (let i = 0; i < img.size; i += 1) {
      imageData.data[i] = img.data[i];
    }
  }

  return imageData;
}

function getImageData(canvas, x = 0, y = 0, w = canvas.width, h = canvas.height) {
  return canvas.getContext('2d').getImageData(x, y, w, h);
}

function putImageData(
  canvas,
  imageData,
  x = 0, y = 0, dx = 0, dy = 0, dw = imageData.width, dh = imageData.height,
  clear,
) {
  if (imageData.width !== canvas.width || imageData.height !== canvas.height || clear) {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }

  return canvas.getContext('2d').putImageData(imageData, x, y, dx, dy, dw, dh);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Tensor} img
 * @param {boolean} rgba
 */

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

function canvasFromTensor(canvas, img, rgba = false, transposed = false) {
  if (!(img instanceof Tensor)) {
    throw Error('tensorToCanvas: Input tensor invalid');
  }

  if (img.shape[2] && img.shape[2] === 4) {
    rgba = true;
  }

  const imageData = toImageData(img, rgba, transposed);

  canvas.getContext('2d').putImageData(imageData, 0, 0);
}

function canvasToTensor(canvas, dst) {
  const imgData = canvas.getContext('2d').getImageData(0, 0, dst.shape[1], dst.shape[0]);

  if (dst) {
    switch (dst.dtype) {
      case 'uint8': {
        dst.assign(new Uint8Array(imgData.data));
        break;
      }
      case 'uint8c': {
        dst.assign(imgData.data);
        break;
      }
      case 'float32':
      default: {
        dst.assign(new Float32Array(imgData.data));
        break;
      }
    }
  }
}

const canvasDrawLine = (canvas, line, color = 'rgba(255, 0, 0, 0.5)', width = 1) => {
  const context = canvas.getContext('2d');

  context.beginPath();
  if (Array.isArray(line)) {
    context.moveTo(line[0], line[1]);
    context.lineTo(line[2], line[3]);
  } else {
    context.moveTo(line.data[0], line.data[1]);
    context.lineTo(line.data[2], line.data[3]);
  }
  context.strokeStyle = color;
  context.lineWidth = width;
  context.stroke();
  context.closePath();
};

const canvasDrawCircle = (canvas, coords, radius = 5, stroke = '#ff0000') => {
  const context = canvas.getContext('2d');

  context.beginPath();
  context.arc(coords[0], coords[1], radius, 0, (2 * Math.PI));
  context.strokeStyle = stroke;
  context.stroke();
};

const canvasFillCircle = (canvas, coords, radius, fill = '#ff0000') => {
  const context = canvas.getContext('2d');

  context.beginPath();
  context.arc(coords[0], coords[1], radius, 0, (2 * Math.PI));
  context.fillStyle = fill;
  context.fill();
};

const clearCanvas = (canvas) => {
  const context = canvas.getContext('2d');

  context.clearRect(0, 0, canvas.width, canvas.height);
};

const canvasDrawRect = (canvas, rect, color = 'rgba(255, 0, 0, 1)', width = 1, cross = false, fill = false) => {
  const context = canvas.getContext('2d');

  context.beginPath();
  context.moveTo(rect.ax, rect.ay);
  context.lineTo(rect.bx, rect.by);
  context.lineTo(rect.cx, rect.cy);
  context.lineTo(rect.dx, rect.dy);
  context.lineTo(rect.ax, rect.ay);

  if (cross) {
    context.lineTo(rect.ax, rect.ay);
    context.lineTo(rect.cx, rect.cy);
    context.lineTo(rect.bx, rect.by);
    context.lineTo(rect.dx, rect.dy);
    context.lineTo(rect.ax, rect.ay);
  }

  context.strokeStyle = color;
  if (fill) {
    context.fillStyle = color;
    context.fill();
  }
  context.stroke();
  context.lineWidth = width;
  context.closePath();
};

function canvasFill(canvas, color) {
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

const canvasClear = (canvas) => {
  canvas.width = canvas.width;
  canvas.height = canvas.height;
};

const canvasInit = (id, width, height) => {
  const canvas = document.querySelector(id);

  canvas.width = width;
  canvas.height = height;

  return canvas;
};

const canvasCreate = (width, height) => {
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  return canvas;
};

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

function imageTensorFromURL(url, type = 'uint8', outShape, cors = false) {
  return new Promise((reolve, reject) => {
    const image = document.createElement('img');
    const canvas = document.createElement('canvas');

    const context = canvas.getContext('2d');

    let width;
    let height;

    image.src = url;

    if (cors) {
      image.crossOrigin = 'Anonimus';
    }

    image.onload = () => {
      if (outShape) {
        width = outShape[1];
        height = outShape[0];
      } else {
        width = image.width;
        height = image.height;
      }
      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);

      let data;
      const imgData = context.getImageData(0, 0, width, height);

      switch (type) {
        case 'uint8': {
          data = new Uint8Array(imgData.data.buffer);
          break;
        }
        case 'float32': {
          data = new Float32Array(imgData.data);
          break;
        }
        default: {
          data = imgData.data;
        }
      }

      const dst = new Tensor(type, [height, width, 4], data);

      reolve(dst);
    };

    image.onerror = reject;
  });
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */
/**
 *
 * @param {Ratio} r
 * @param {number} height
 */
function getWidth(r, h) {
  return r * h;
}

/**
 *
 * @param {Ratio} r
 * @param {number} width
 */
function getHeight(r, w) {
  return w / r;
}

/**
 *
 * @param {Ratio} r
 * @param {number} maxWidth
 * @param {number} [maxHeight]
 * @return {Size}
 */
function getMaxAvailableSize(r, maxWidth, maxHeight) {
  if (maxWidth) {
    const _height = getHeight(r, maxWidth);

    if (_height <= maxHeight) {
      return {
        width: maxWidth,
        height: _height,
      };
    }
  }

  return {
    width: getWidth(r, maxHeight),
    height: maxHeight,
  };
}

/**
 *
 * @param {Ratio} r
 * @param {number} minWidth
 * @param {number} [minHeight]
 * @return {Size}
 */
function getMinAvailableSize(r, minWidth, minHeight) {
  if (minWidth) {
    const _height = getHeight(r, minWidth);

    if (_height > minHeight) {
      return {
        width: minWidth,
        height: _height,
      };
    }
  }

  return {
    width: getWidth(r, minHeight),
    height: minHeight,
  };
}

class CaptureVideo {
  static IsAvailable() {
    const cfg = {
      video: {
        width: { min: 480, ideal: 1080, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1920 },
      },
    };

    navigator.getUserMedia = navigator.getUserMedia
      || navigator.webkitGetUserMedia
      || navigator.mozGetUserMedia
      || navigator.msGetUserMedia
      || navigator.oGetUserMedia;

    const ua = navigator.userAgent;

    if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) {
      delete cfg.video.width;
      delete cfg.video.height;
    }

    let getStream = Promise.resolve();

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      getStream = getStream.then(() => navigator.mediaDevices.getUserMedia(cfg));
    } else if (navigator.getUserMedia) {
      getStream = getStream.then(() => new Promise(res => navigator.getUserMedia(cfg, res)));
    }

    return getStream
      .then((stream) => {
        const tracks = stream.getTracks();
        const deviceID = tracks[0].getSettings().deviceId;

        tracks.forEach(track => track.stop());

        return deviceID || true;
      })
      .catch(() => Promise.resolve(false));
  }

  static getDevices() {
    if ('mediaDevices' in navigator && 'enumerateDevices' in navigator.mediaDevices) {
      return navigator.mediaDevices.enumerateDevices()
        .then(devices => devices.filter(device => device.kind === 'videoinput'));
    }

    return Promise.resolve(null);
  }

  constructor(width, height) {
    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
    this.canvas = document.createElement('canvas');
    this.canvasCtx = this.canvas.getContext('2d');
    this.sourceCanvas = document.createElement('canvas');
    this.sourceCanvasCtx = this.sourceCanvas.getContext('2d');

    this.width = width;
    this.height = height;

    this.sourceWidth = width;
    this.sourceHeight = height;

    this.setSize(width, height);
    this.track = null;
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.sourceCanvas.width = width;
    this.sourceCanvas.height = height;
    this.sourceMinWidth = width;
    this.sourceMinHeight = height;
  }

  setSourceSize(width, height) {
    const scaledSize = getMinAvailableSize(width / height, this.width, this.height);
    const size = getMaxAvailableSize(this.width / this.height, width, height);
    const scaledMinSize = getMinAvailableSize(width / height, size.width, size.height);

    this.sourceMinWidth = scaledSize.width;
    this.sourceMinHeight = scaledSize.height;

    this.sourceWidth = scaledMinSize.width;
    this.sourceHeight = scaledMinSize.height;

    this.sourceCanvas.width = size.width;
    this.sourceCanvas.height = size.height;
  }

  getDevice() {
    if (this.track) {
      return this.track.getSettings().deviceId;
    }

    return null;
  }

  start(deviceID, exactFacingMode = '') {
    this.started = true;
    const cfg = {
      video: {
        width: { min: 240, ideal: 1080, max: 1920 },
        height: { min: 240, ideal: 1080, max: 1920 },
        aspectRatio: { exact: this.width / this.height },
        deviceId: deviceID ? { ideal: deviceID } : undefined,
        facingMode: exactFacingMode ? { exact: exactFacingMode } : null,
      },
    };

    const ua = navigator.userAgent;

    const isPortrait =
      !(window.orientation === -90
        || window.orientation === 90
        || window.offsetWidth > window.offsetHeight);

    if (/android/i.test(ua) && isPortrait) {
      cfg.video.aspectRatio.exact = 1 / cfg.video.aspectRatio.exact;
    }

    if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) {
      delete cfg.video.width;
      delete cfg.video.height;
      delete cfg.video.aspectRatio;
    }

    navigator.getUserMedia = navigator.getUserMedia
      || navigator.webkitGetUserMedia
      || navigator.mozGetUserMedia
      || navigator.msGetUserMedia
      || navigator.oGetUserMedia;

    let getStream = Promise.resolve();


    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      getStream = getStream.then(() => navigator.mediaDevices.getUserMedia(cfg));
    } else if (navigator.getUserMedia) {
      getStream = getStream.then(() => new Promise(res => navigator.getUserMedia(cfg, res)));
    }

    return getStream.then((stream) => {
      if (stream) {
        const tracks = stream.getTracks();

        if (!this.started) {
          tracks.forEach(t => t.stop());

          return null;
        }
        if ('srcObject' in this.video) {
          this.video.srcObject = stream;

          // MSCHF NOTE: hook up stream to existing video in the markup
          document.getElementById('video').srcObject = stream;
        } else {
          this.video.src = window.URL.createObjectURL(stream);
        }

        this.track = tracks[0];

        return this.video.play()
          .then(() => this.setSourceSize(this.video.videoWidth, this.video.videoHeight));
      }
      throw new Error('getUserMedia not found or no stream was created');
    });
  }

  stop() {
    this.started = false;
    if (this.track) {
      this.track.stop();
      this.track = null;
    }
  }

  drawImage(ctx, w, h, ow, oh) {
    ctx.drawImage(
      this.video,
      (ow - w) / -2,
      (oh - h) / -2,
      ow,
      oh,
    );
  }

  getImageBuffer(
    type,
    ctx = this.canvasCtx,
    width = this.width,
    height = this.height,
    x = 0,
    y = 0,
    w = width,
    h = height,
    originW = this.sourceMinWidth,
    originH = this.sourceMinHeight,
  ) {
    this.drawImage(ctx, w, h, originW, originH);
    const imgData = ctx.getImageData(x, y, w, h);

    if (type instanceof Tensor) {
      type.data.set(imgData.data);

      return type;
    }

    switch (type) {
      case 'uint8': {
        return new Uint8Array(imgData.data);
      }
      case 'uint8c': {
        return imgData.data;
      }
      case 'float32': {
        return new Float32Array(imgData.data);
      }
      default: {
        return imgData;
      }
    }
  }

  getImageBufferTo(
    type,
    ctx = this.canvasCtx,
    width = this.width,
    height = this.height,
    x = 0,
    y = 0,
    w = width,
    h = height,
    to,
  ) {
    ctx.drawImage(
      this.video,
      (this.sourceWidth - this.width) / -2,
      (this.sourceHeight - this.height) / -2,
      this.sourceWidth,
      this.sourceHeight,
    );
    const imgData = ctx.getImageData(x, y, w, h);

    to.data = imgData.data.buffer;
  }

  getSourceImageBuffer(type, x, y, w, h) {
    return this.getImageBuffer(
      type,
      this.sourceCanvasCtx,
      this.sourceCanvas.width,
      this.sourceCanvas.height,
      x,
      y,
      w,
      h,
      this.sourceWidth,
      this.sourceHeight,
    );
  }
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

var kernel = "const vec3 k=vec3(0.2128,0.7148,0.0724);vec4 operation(float y,float x){float value=dot(pickValue_tSrc(y,x).rgb,k);return vec4(value,value,value,1.0);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name Grayscale
 * @description
 *  Grayscale of the input image by formula of luminosity
 *  R * 0.2126 + G * 0.7152 + B * 0.0722
 * @example
 *  grayscale(inputImage);
 * @param {Tensor} tSrc - The source image to be grayscaled.
 */

var index = tSrc => new RegisterOperation('Grayscale')
  .Input('tSrc', 'uint8')
  .Output('uint8')
  .LoadChunk('pickValue')
  .GLSLKernel(kernel)
  .Compile({ tSrc });

var kernel$1 = "const float hWidth=(KERNEL_WIDTH-1.0)/2.0;const float hHeight=(KERNEL_HEIGHT-1.0)/2.0;vec4 operation(float y,float x){vec3 finalColour=vec3(0.0);for(float dy=-hHeight;dy<=hHeight;dy+=1.0){for(float dx=-hWidth;dx<=hWidth;dx+=1.0){vec3 k=pickValue_tKernel(float(dy+hHeight),float(dx+hWidth)).rgb;finalColour+=pickValue_tSrc(y+dy,x+dx).rgb*k;}}return vec4(finalColour*factor+bias,1.0);}";

/**
 * @param {number} kernelSize
 * @param {number} sigma
 * @returns {Tensor}
 */
function gaussianBlur(kernelSize = 3, sigma = 1) {
  const dstKernel = new Tensor('float32', [kernelSize, kernelSize]);
  const mean = (kernelSize - 1) / 2;
  const resultKernel = new Tensor('float32', [kernelSize, kernelSize, 4]);
  let sum = 0.0;

  for (let y = 0; y < kernelSize; y += 1) {
    for (let x = 0; x < kernelSize; x += 1) {
      const v = Math.exp(-0.5 * (((x - mean) / sigma) ** 2
        + ((y - mean) / sigma) ** 2)) / (2 * Math.PI * sigma * sigma);

      dstKernel.set(x, y, v);
      sum += dstKernel.get(x, y);
    }
  }

  // Normalize the kernel
  for (let y = 0; y < kernelSize; y += 1) {
    for (let x = 0; x < kernelSize; x += 1) {
      resultKernel.set(x, y, 0, dstKernel.get(x, y) / sum);
      resultKernel.set(x, y, 1, dstKernel.get(x, y) / sum);
      resultKernel.set(x, y, 2, dstKernel.get(x, y) / sum);
    }
  }

  return resultKernel;
}

/**
 * @param {*} kernelSize
 * @returns {Tensor}
 */
function boxBlur(kernelSize = 3) {
  const resultKernel = new Tensor('float32', [kernelSize, kernelSize, 4]);
  const fullSize = kernelSize ** 2;

  for (let i = 0; i < resultKernel.data.length; i += 1) {
    resultKernel.data[i] = 1 / fullSize;
  }

  return resultKernel;
}

/**
 * @param {number} amount - multiplier for basic sharpen
 * @returns {Tensor}
 */
function sharpen(amount = 1) {
  const d = -1 * amount;
  const k = 1 + 4 * amount;

  return tensorFromFlat([
    0, d, 0,
    d, k, d,
    0, d, 0,
  ], [3, 3, 4], 'float32');
}

/**
 * Generate kernel that inverts image. Require bias value to be `1`
 * @returns {Tensor}
 */
function invert() {
  return tensorFromFlat([
    0, 0, 0,
    0, -1, 0,
    0, 0, 0,
  ], [3, 3, 4], 'float32');
}

/**
 * @returns {Tensor}
 */
function edgeDetection() {
  return tensorFromFlat([
    1, 0, -1,
    0, 0, 0,
    -1, 0, 1,
  ], [3, 3, 4], 'float32');
}

/**
 * @returns {Tensor}
 */
function edgeDetection2() {
  return tensorFromFlat([
    0, 1, 0,
    1, -4, 1,
    0, 1, 0,
  ], [3, 3, 4], 'float32');
}

/**
 * @returns {Tensor}
 */
function edgeDetection3() {
  return tensorFromFlat([
    -1, -1, -1,
    -1, 8, -1,
    -1, -1, -1,
  ], [3, 3, 4], 'float32');
}

/**
 * @param {number} kernelSize
 * @param {number} sigma - gaussian blur parameter
 * @param {number} amount - sharpen parameter
 * @returns {Tensor}
 */
function unsharpMasking(kernelSize = 3, sigma = 1, amount = 1) {
  const base = gaussianBlur(kernelSize, sigma);
  const c = ~~((kernelSize - 1) / 2);
  const vr = 1 + 1 * amount - base.get(c, c, 0);
  const vg = 1 + 1 * amount - base.get(c, c, 1);
  const vb = 1 + 1 * amount - base.get(c, c, 2);

  for (let i = 0; i < base.size; i += 1) {
    base.data[i] = -base.data[i];
  }

  base.set(c, c, 0, vr);
  base.set(c, c, 1, vg);
  base.set(c, c, 2, vb);

  return base;
}

var convolutionKernels = /*#__PURE__*/Object.freeze({
  gaussianBlur: gaussianBlur,
  boxBlur: boxBlur,
  sharpen: sharpen,
  invert: invert,
  edgeDetection: edgeDetection,
  edgeDetection2: edgeDetection2,
  edgeDetection3: edgeDetection3,
  unsharpMasking: unsharpMasking
});

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name Convolution
 * @description
 *  Doing convlolution between a kernel and an image,
 *  see [wiki](https://en.wikipedia.org/wiki/Kernel_(image_processing)).
 * @example
 *  gm.conv2d(inputImage, gm.kernels.boxBlur());
 * @param {Tensor} tSrc - The source image to be convolved.
 * @param {Tensor} tKernel - Kernel body, tensor with shape [n, m, 4],
 *  where alpha component of each pixel is kernel cell value.
 * @param {number} [factor] - a scaling quantity that is multiplied by the result
 * @param {number} [bias] - is added on after the factor has been accounted for
 */

var Convolutiion = (tSrc, tKernel, factor = 1, bias = 0) => new RegisterOperation('Convolution2d')
  .Input('tSrc', tSrc.dtype)
  .Input('tKernel', 'float32')
  .Output(tSrc.dtype)
  .LoadChunk('pickValue')
  .Constant('KERNEL_WIDTH', tKernel.shape[1])
  .Constant('KERNEL_HEIGHT', tKernel.shape[0])
  .Uniform('bias', 'float', bias)
  .Uniform('factor', 'float', factor)
  .GLSLKernel(kernel$1)
  .Compile({ tSrc, tKernel });

const kernels = convolutionKernels;

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name GaussianBlur
 * @description
 *  This operation is default blur operation which actually
 *  convolution with Gaussian kernel.
 * @example
 *  gaussianBlur(inputImage, 5, 3);
 * @param {Tensor} tSrc - The source image to be grayscaled.
 * @param {number} kernelSize - Size of the kernel.
 * @param {number} sigma - Sigma coeficient value.
 */

var index$1 = (tSrc, kernelSize = 3, sigma = 3) => {
  assert$$1(
    kernelSize >= 3,
    'Kernel size should be greater equal 3',
  );

  assert$$1(
    sigma > 0,
    'Sigma should be greater then 0',
  );

  return Convolutiion(tSrc, gaussianBlur(kernelSize, sigma));
};

var kernel$2 = "vec4 operation(float y,float x){vec4 value=vec4(0.0);for(float dx=0.0;dx<K;dx+=1.0){for(float dy=0.0;dy<K;dy+=1.0){vec4 v=pickValue_tSrc((y*K)+dy,(x*K)+dx);if(S==0.0){value=v;}if(S==1.0){value+=v;}}}if(S==1.0){value/=K*K;}return value;}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name Downsample
 * @description
 *  Performance is always important, but some algorithms are very expensive to apply
 *  to large picture sizes. To accommodate for this in Computer Vision we often need
 *  reduce an original image to a smaller size before we apply a given algorithm,
 *  GammaCV support a few different ways to reduce the dimension of a image,
 *  for example we support "meaning pixels" and an approach known as "MaxPooling".
 * @example
 *  // this line reduces an input image in 3x
 *  downsample(inputImage, 3, 0);
 * @param {Tensor} tSrc - The source image to be downsampled.
 * @param {number} coeficient - Downsampling coeficient.
 * @param {number} type - Downsampling support two possible variants of processing
 *  pixels to be downsampled 'max', 'mean'.
 */

var index$2 = (tSrc, coeficient = 2, type = 'mean') => {
  assert$$1(
    type === 'mean' || type === 'max',
    'DownsampleOp: Unsupported type of operation. Currently supported only "mean" and "max"',
  );

  let t = 0;

  if (type === 'max') {
    t = 0;
  } else if (type === 'mean') {
    t = 1;
  }

  return new RegisterOperation('Downsample')
    .Input('tSrc', tSrc.dtype)
    .Output(tSrc.dtype)
    .Constant('K', coeficient)
    .Constant('S', t)
    .SetShapeFn(() => {
      const shape = [~~(tSrc.shape[0] / coeficient), ~~(tSrc.shape[1] / coeficient), 4];

      assert$$1(
        isValidOperationShape$$1(shape),
        'DownsampleOperation: Invalid operation shape',
      );

      return shape;
    })
    .LoadChunk('pickValue')
    .GLSLKernel(kernel$2)
    .Compile({ tSrc });
};

var kernel$3 = "vec4 operation(float y,float x){float wk=1.0;float hk=1.0;float dx=0.0;float dy=0.0;dx+=-1.0*pickScalarValue_tSrc(y-hk,x-wk);dx+=-2.0*pickScalarValue_tSrc(y,x-wk);dx+=-1.0*pickScalarValue_tSrc(y+wk,x-wk);dx+=+1.0*pickScalarValue_tSrc(y-wk,x+wk);dx+=+2.0*pickScalarValue_tSrc(y,x+wk);dx+=+1.0*pickScalarValue_tSrc(y+wk,x+wk);dy+=-1.0*pickScalarValue_tSrc(y-wk,x-wk);dy+=-2.0*pickScalarValue_tSrc(y-wk,x);dy+=-1.0*pickScalarValue_tSrc(y-wk,x+wk);dy+=+1.0*pickScalarValue_tSrc(y+wk,x-wk);dy+=+2.0*pickScalarValue_tSrc(y+wk,x);dy+=+1.0*pickScalarValue_tSrc(y+wk,x+wk);float magniture=sqrt((dx*dx)+(dy*dy));float theta=atan(dy/dx);return vec4(magniture,dx,dy,theta);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name SobelOperator
 * @description
 *  Calculating image gradient and magnitude by applying of Sobel Operator.
 *  Output description:
 *    0 - GX
 *    1 - GY
 *    2 - Magnitude
 * @example
 *  sobelOperator(inputImage);
 * @param {Tensor} tSrc - Input image.
 */

var index$3 = tSrc => new RegisterOperation('SobelOperator')
  .Input('tSrc', tSrc.dtype)
  .Output('float32')
  .Uniform('uWidth', 'float', tSrc.shape[0])
  .Uniform('uHeight', 'float', tSrc.shape[1])
  .Constant('PI', Math.PI)
  .GLSLKernel(kernel$3)
  .LoadChunk('pickValue')
  .Compile({ tSrc });

var dirrectionKernel = "vec4 operation(float y,float x){float dx=pickValue_tSrc(y,x+1.0).r-pickValue_tSrc(y,x-1.0).r;float dy=pickValue_tSrc(y+1.0,x).r-pickValue_tSrc(y-1.0,x).r;float magniture=sqrt((dx*dx)+(dy*dy));return vec4(magniture,atan(dy/dx),dx,dy);}";

var groupKernel = "float A=180.0/9.0;float S=3.0;vec4 operation(float y,float x){float my=y-(S*floor(y/S));float mx=x-(S*floor(x/S));x=x/S;y=y/S;float index=mx+(my*S);float sum=0.0;for(float dx=0.0;dx<K;dx+=1.0){for(float dy=0.0;dy<K;dy+=1.0){vec4 v=pickValue_tSrc(((y*K)+dy),((x*K)+dx));float theta=abs(PI/2.0-v.g);float deg=theta*(180.0/PI);float i=floor(deg/A);if(i==index){sum+=v.r;}}}float rad=(index/9.0*PI);return vec4(sum,rad,0.0,0.0);}";

var groupMaxKernel = "const int w=int(W);const int h=int(H);const int k=int(K);const float S=3.0;float A=180.0/9.0;vec4 getPixel(float y,float x){float x1=x/float(w);float y1=y/float(h);return pickValue_tSrc(floor(y1*uSrcHeight),floor(x1*uSrcWidth));}vec4 getPixel(float y,float x,float xOffset,float yOffset){float x1=x/float(w);float y1=y/float(h);return pickValue_tSrc(floor(y1*uSrcHeight)+yOffset,floor(x1*uSrcWidth)+xOffset);}vec4 operation(float y,float x){float x1=x/W;float y1=y/H;float res=0.0;float tmpx=x/S;float tmpy=y/S;float sum[9];int count=0;vec4 value=getPixel(y,x);for(int _x=0;_x<k;_x+=1){for(int _y=0;_y<k;_y+=1){vec4 v=getPixel(y,x,float(_y),float(_x));float theta=abs(PI/2.0-v.g);float deg=theta*(180.0/PI);int i=int(floor(deg/A));if(i==1){sum[1]+=v.r;}if(i==2){sum[2]+=v.r;}if(i==3){sum[3]+=v.r;}if(i==4){sum[4]+=v.r;}if(i==5){sum[5]+=v.r;}if(i==6){sum[6]+=v.r;}if(i==7){sum[7]+=v.r;}if(i==8){sum[8]+=v.r;}}}int maxI=0;float maxV=0.0;for(int i=0;i<9;i++){if(maxV<sum[i]){maxI=i;maxV=sum[i];}}return vec4(maxI,maxV,0.0,0.0);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

const hogDirrection = tSrc => new RegisterOperation('HOGDirection')
  .Input('tSrc', 'uint8')
  .Output('float32')
  .Uniform('uWidth', 'float', tSrc.shape[1])
  .Uniform('uHeight', 'float', tSrc.shape[0])
  .LoadChunk('pickValue')
  .GLSLKernel(dirrectionKernel)
  .Compile({ tSrc });

const hogGroup = (tSrc, k) => new RegisterOperation('HOG')
  .Input('tSrc', 'uint8')
  .Output('float32')
  .Uniform('uSrcWidth', 'float', tSrc.shape[1])
  .Uniform('uSrcHeight', 'float', tSrc.shape[0])
  .Uniform('uWidth', 'float', ~~(tSrc.shape[1] / k) * 3)
  .Uniform('uHeight', 'float', ~~(tSrc.shape[0] / k) * 3)
  .Constant('PI', Math.PI)
  .Constant('W', ~~(tSrc.shape[1] / k))
  .Constant('H', ~~(tSrc.shape[0] / k))
  .Constant('K', k)
  .LoadChunk('pickValue')
  .SetShapeFn(() => [~~(tSrc.shape[0] / k) * 3, ~~(tSrc.shape[1] / k) * 3, 4])
  .GLSLKernel(groupKernel)
  .Compile({ tSrc });

const hogGroupMax = (tSrc, k) => new RegisterOperation('HOGMax')
  .Input('tSrc', 'uint8')
  .Output('float32')
  .Uniform('uSrcWidth', 'float', tSrc.shape[1])
  .Uniform('uSrcHeight', 'float', tSrc.shape[0])
  .Uniform('uWidth', 'float', ~~(tSrc.shape[1] / k))
  .Uniform('uHeight', 'float', ~~(tSrc.shape[0] / k))
  .Constant('PI', Math.PI)
  .Constant('W', ~~(tSrc.shape[1] / k))
  .Constant('H', ~~(tSrc.shape[0] / k))
  .Constant('K', k)
  .LoadChunk('pickValue')
  .SetShapeFn(() => [~~(tSrc.shape[0] / k), ~~(tSrc.shape[1] / k), 4])
  .GLSLKernel(groupMaxKernel)
  .Compile({ tSrc });

/**
 * @name HOG
 * @description
 *  This operation allows to extract Histogram of Oriented Gradients features.
 *  Currently availiable two types:
 *    - `visualize`: will return 9 bin histogram for each segment
 *    - `max`: will return angle with maximum intencity in histogram
 * @example
 *   gm.hog(inputImage, 5, 3);
 * @param {Tensor} tSrc - The source image to be grayscaled.
 * @param {number} k - region size.
 * @param {string} type - Type of HOG features extractor, currently availiable max and visualize.
 */

var index$4 = (tSrc, k = 10, type = 'max') => {
  assert$$1(
    type === 'max' || type === 'visualize',
    `Unsupported type of HOG operation.
     Currently availiable max and visualize.`,
  );

  let operation = null;

  if (type === 'max') {
    operation = hogGroupMax(hogDirrection(tSrc), k);
  }

  if (type === 'visualize') {
    operation = hogGroup(hogDirrection(tSrc), k);
  }

  return operation;
};

var kernel$4 = "vec4 operation(float y,float x){return pickValue_tSrc(y,x);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name Cast
 * @description
 *  Change the texture data type
 * @example
 *  cast(inputImage, 'float32');
 * @param {Tensor} tSrc - The source to be changed.
 * @param {string} dtype - The destination data type
 */

var index$5 = (tSrc, dtype = tSrc.dtype) => new RegisterOperation('Cast')
  .Input('tSrc', tSrc.dtype)
  .Output(dtype)
  .LoadChunk('pickValue')
  .GLSLKernel(kernel$4)
  .Compile({ tSrc });

var nmsKernel = "\n#define STROKE uSize\nvec4 operation(float y,float x){vec4 M=pickValue_tSrc(y,x);float N=pickValue_tSrc(y+STROKE,x).r;float S=pickValue_tSrc(y-STROKE,x).r;float W=pickValue_tSrc(y,x-STROKE).r;float E=pickValue_tSrc(y,x+STROKE).r;float SE=pickValue_tSrc(y-STROKE,x+STROKE).r;float NW=pickValue_tSrc(y+STROKE,x-STROKE).r;float NE=pickValue_tSrc(y+STROKE,x+STROKE).r;float SW=pickValue_tSrc(y-STROKE,x-STROKE).r;float H=0.0;float V=M.r;float dx=M.g;float dy=M.b;float theta=atan(dy/dx);float deg=theta*(180.0/PI);float angle=0.0;if(deg<0.0){deg=180.0+deg;}if(deg<22.5||deg>=157.5){if(V>W&&V>E){H+=1.0;}}if(deg<67.5&&deg>=22.5){if(V>SW&&V>NE){H+=1.0;}}if(deg<112.5&&deg>=67.5){if(V>N&&V>S){H+=1.0;}}if(deg<157.5&&deg>=112.5){if(V>NW&&V>SE){H+=1.0;}}if(H==1.0){return vec4(V,V,V,255);}else{return vec4(0,0,0,255);}}";

var hysteresisKernel = "\n#define STROKE uSize\nvec4 operation(float y,float x){vec4 M=pickValue_tSrc(y,x);float N=pickValue_tSrc(y+STROKE,x).r;float S=pickValue_tSrc(y-STROKE,x).r;float W=pickValue_tSrc(y,x-STROKE).r;float E=pickValue_tSrc(y,x+STROKE).r;float SE=pickValue_tSrc(y-STROKE,x+STROKE).r;float NW=pickValue_tSrc(y+STROKE,x-STROKE).r;float NE=pickValue_tSrc(y+STROKE,x+STROKE).r;float SW=pickValue_tSrc(y-STROKE,x-STROKE).r;float V=M.r;float H=0.0;if(V>uThresholdHigh){H+=1.0;}if(V>uThresholdLow&&V<uThresholdHigh){if(N>0.0||S>0.0||W>0.0||E>0.0||SE>0.0||NW>0.0||NE>0.0||SW>0.0){H+=1.0;}}if(H==1.0){return vec4(255,255,255,255);}else{return vec4(0,0,0,255);}}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

const CannyNMS = tSrc => new RegisterOperation('ImageCannyEdgesNMS')
  .Input('tSrc', tSrc.dtype)
  .Output(tSrc.dtype)
  .LoadChunk('pickValue')
  .Uniform('uSize', 'float', 1)
  .Constant('PI', Math.PI)
  .GLSLKernel(nmsKernel)
  .Compile({ tSrc });

const CannyHysteresis = (tSrc, low, high) => {
  assert$$1(
    low >= 0,
    'Canny low threshold should be greater equal 0',
  );

  assert$$1(
    high <= 1,
    'Canny high threshold should be less equal 1',
  );

  return new RegisterOperation('ImageCannyEdgesHysteresis')
    .Input('tSrc', tSrc.dtype)
    .Output(tSrc.dtype)
    .LoadChunk('pickValue')
    .Uniform('uSize', 'float', 1)
    .Uniform('uThresholdLow', 'float', low)
    .Uniform('uThresholdHigh', 'float', high)
    .GLSLKernel(hysteresisKernel)
    .Compile({ tSrc });
};

/**
 * @name CannyEdges
 * @description
 *  The Canny edge detector is an edge detection operator that uses
 *  a multi-stage algorithm to detect a wide range of edges in images.
 *  [Read more on Wiki](https://en.wikipedia.org/wiki/Canny_edge_detector).
 * @example
 *  cannyEdges(inputImage, 0.25, 0.75);
 * @param {Tensor} sobel - Sobel derivatives operation output [sobelOperator](https://en.wikipedia.org/wiki/Canny_edge_detector).
 * @param {number} low - Low threshold to be applied.
 * @param {number} high - High threshold to be applied.
 */

var index$6 = (input, low = 0.25, high = 0.75) => CannyHysteresis(CannyNMS(input), low, high);

var kernel$5 = "const float _step=1.0/CLUSTERS;vec4 operation(float y,float x){float minDistance=256.0;float label=0.0;vec3 value=pickValue_tSrc(y,x).rgb;for(int i=0;i<int(CLUSTERS);i+=1){vec3 curr=pickValue_tCentroids(float(i),0.0).rgb;float distance=sqrt(((value.r-curr.r)*(value.r-curr.r)));if(distance<minDistance){minDistance=distance;label=float(i)/CLUSTERS;}}return vec4(label,label,label,1.0);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name ColorSegmentation
 * @description
 *  Color segmentation of given image with simple Euclidian
 *  distance estimation.
 * @example
 *  // segmentation of input image to 5 clusters
 *  colorSegmentation(inputImage, 5);
 * @param {Tensor} tSrc - Current frame.
 * @param {number} clusters - Number of clusters the input image to be clustered.
 */

var index$7 = (tSrc, clusters = 3) => {
  assert$$1(
    tSrc.dtype === 'uint8',
    'Color Segmentation currently available for uint8 image input',
  );

  assert$$1(
    clusters > 1,
    'Number of clusters should be greater than 1',
  );

  return new RegisterOperation('ImageColorSegmentation')
    .Input('tSrc', 'uint8')
    .Input('tCentroids', 'uint8')
    .Output('uint8')
    .LoadChunk('pickValue')
    .Constant('CLUSTERS', clusters)
    .GLSLKernel(kernel$5)
    .PreCompile((op) => {
      const k = ~~(256 / clusters);

      op.centroids = new Tensor('uint8', [clusters, 1, 4]);

      for (let i = 0; i < clusters; i += 1) {
        op.centroids.set(i, 0, 0, i * k);
      }

      op.assignInput('tCentroids', op.centroids);
    })
    .Compile({ tSrc });
};

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

function parallelReductionCheckSteps(size = 1, steps = [1]) {
  let s = size;

  for (let i = 0; i < steps.length; i += 1) {
    s /= steps[i];
  }

  return s === 1;
}

function parallelReductionCheckSteps2d(size = [1, 1], steps = [[1, 1]]) {
  return parallelReductionCheckSteps(size[0], steps.map(n => n[0]))
    && parallelReductionCheckSteps(size[0], steps.map(n => n[1]));
}

function parallelReductionGetSteps(
  size = 1,
  layersCount = 1,
  ignoreOne = true,
  maxLayerSize = size,
) {
  const base = size ** (1 / layersCount);

  if (size % 1 !== 0) {
    throw new RangeError(`Can't get parallel reduction steps for non-integer, got "${size}"`);
  }

  if (maxLayerSize < 1) {
    throw new RangeError(`Can't get parallel reduction steps for maxLayerSize below less than 1, got "${maxLayerSize}"`);
  }

  if (base % 1 === 0 && base < maxLayerSize) {
    return new Array(layersCount).fill(base);
  }

  const result = [];
  let _size = size;
  let _base = base;

  for (let i = 0; i < layersCount; i += 1) {
    _base = _size ** (1 / (layersCount - i));
    let v = Math.ceil(_base);

    while ((_size % v !== 0 || _size / v > maxLayerSize) && _size / v !== 1) {
      v += 1;
    }
    if (v === 1 && ignoreOne) {
      break;
    }
    _size /= v;

    result.push(v);
  }

  return result;
}

function parallelReductionGetSteps2d(
  size = [1, 1],
  layersCount = 1,
  ignoreOne = true,
  maxLayerSize = size,
) {
  const s1 = parallelReductionGetSteps(size[0], layersCount, ignoreOne, maxLayerSize[0]);
  const s2 = parallelReductionGetSteps(size[1], layersCount, ignoreOne, maxLayerSize[1]);
  const result = [];

  for (let i = 0; i < layersCount && (s1[i] || s2[i]); i += 1) {
    result.push([s1[i] || 1, s2[i] || 1]);
  }

  return result;
}

/**
 * Convolution calc ouput shape.
 * @param {number} inputLength - the source size
 * @param {number} kernelSide
 * @param {number} [stride]
 * @returns {number} - Count of windows.
 */

function clacConvolution(inputLength, kernelSide, stride = 1) {
  return Math.ceil(((inputLength - kernelSide) + 1) / stride);
}

var getMean = "const int kx=int(KX);const int ky=int(KY);const int w=int(WIDTH);const int h=int(HEIGHT);vec4 operation(float gly,float glx){float size=KY*KX;float mean=0.0;float std=0.0;vec3 color=vec3(0.0,0.0,0.0);for(int y=0;y<ky;y+=1){for(int x=0;x<kx;x+=1){vec3 value=pickValue_tSrc(gly*KY+float(y),glx*KX+float(x)).rgb;color+=value.rgb;}}color/=size;mean=color.r;for(int y=0;y<ky;y+=1){for(int x=0;x<kx;x+=1){vec3 value=pickValue_tSrc(gly*KY+float(y),glx*KX+float(x)).rgb;std+=(value.r-mean)*(value.r-mean);}}std/=size;std=sqrt(std);if(std==0.0){std=1.0;}return vec4(color,255.0);}";

var getStd = "const int kx=int(KX);const int ky=int(KY);const int w=int(WIDTH);const int h=int(HEIGHT);vec4 operation(float gly,float glx){float size=KX*KY;vec3 std=vec3(0.0,0.0,0.0);vec3 mean=pickValue_tMean(0.0,0.0).rgb;for(int y=0;y<ky;y+=1){for(int x=0;x<kx;x+=1){vec3 value=pickValue_tSrc(gly*KY+float(y),glx*KX+float(x)).rgb;std+=(value-mean)*(value-mean);}}std/=size;std=sqrt(std);if(std.r==0.0){std.r=255.0;}if(std.g==0.0){std.g=255.0;}if(std.b==0.0){std.b=255.0;}return vec4(std,255.0);}";

var reduceStd = "const int kx=int(KX);const int ky=int(KY);const int w=int(WIDTH);const int h=int(HEIGHT);vec4 operation(float gly,float glx){float size=KX*KY;vec3 std=vec3(0.0,0.0,0.0);for(int y=0;y<ky;y+=1){for(int x=0;x<kx;x+=1){vec3 mstd=pickValue_tStd(gly*KY+float(y),glx*KX+float(x)).rgb;std+=mstd*mstd;}}std/=size;std=sqrt(std);if(std.r==0.0){std.r=255.0;}if(std.g==0.0){std.g=255.0;}if(std.b==0.0){std.b=255.0;}return vec4(std,255.0);}";

var joinKernel = "vec4 operation(float gly,float glx){if(gly==0.0){return texture2D(tMean,vec2(0,0));}else{return texture2D(tStd,vec2(0,0));}}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

const ImageReduceStd = (tStd, k) => new RegisterOperation('ImageReduceStd')
  .Input('tStd', tStd.dtype)
  .Output(tStd.dtype)
  .Constant('WIDTH', tStd.shape[1])
  .Constant('HEIGHT', tStd.shape[0])
  .Uniform('uWidth', 'float', tStd.shape[1] / k[1])
  .Uniform('uHeight', 'float', tStd.shape[0] / k[0])
  .Constant('KX', k[1])
  .Constant('KY', k[0])
  .LoadChunk('pickValue')
  .SetShapeFn(() => [~~(tStd.shape[0] / k[0]), ~~(tStd.shape[1] / k[1]), 4])
  .GLSLKernel(reduceStd)
  .Compile({ tStd });

const ImageExtractStd = (tSrc, tMean, k) => new RegisterOperation('ImageExtractStd')
  .Input('tSrc', tSrc.dtype)
  .Input('tMean', tMean.dtype)
  .Output(tSrc.dtype)
  .Constant('WIDTH', tSrc.shape[1])
  .Constant('HEIGHT', tSrc.shape[0])
  .Uniform('uWidth', 'float', tSrc.shape[1] / k[1])
  .Uniform('uHeight', 'float', tSrc.shape[0] / k[0])
  .Constant('KX', k[1])
  .Constant('KY', k[0])
  .LoadChunk('pickValue')
  .SetShapeFn(() => [~~(tSrc.shape[0] / k[0]), ~~(tSrc.shape[1] / k[1]), 4])
  .GLSLKernel(getStd)
  .Compile({ tSrc, tMean });

const ImageExtractMean = (tSrc, k) => new RegisterOperation('ImageExtractMean')
  .Input('tSrc', tSrc.dtype)
  .Output(tSrc.dtype)
  .Constant('WIDTH', tSrc.shape[1])
  .Constant('HEIGHT', tSrc.shape[0])
  .Uniform('uWidth', 'float', tSrc.shape[1] / k[1])
  .Uniform('uHeight', 'float', tSrc.shape[0] / k[0])
  .Constant('KX', k[1])
  .Constant('KY', k[0])
  .LoadChunk('pickValue')
  .SetShapeFn(() => [~~(tSrc.shape[0] / k[0]), ~~(tSrc.shape[1] / k[1]), 4])
  .GLSLKernel(getMean)
  .Compile({ tSrc });

const JoinOp = (tMean, tStd) => new RegisterOperation('ImageJoin')
  .Input('tMean', tMean.dtype)
  .Input('tStd', tStd.dtype)
  .Output(tMean.dtype)
  .SetShapeFn(() => [2, 1, 4])
  .GLSLKernel(joinKernel)
  .Compile({ tMean, tStd });

/**
 * @name MeanStd
 * @description
 *  Extract mean and std of pixel values of the image
 *  Returns 2 pixels in a column, in which the top is the mean, and the bottom is the std values.
 * @param {Tensor} tSrc - Inptut image
 * @param {number} layers - Number of layers for a parallel reduction
 * @param {boolean} [ignoreStd] - if true, operatino will return only one pixel with mean values
 */

var meanStdOp = (tSrc, layers = 1, ignoreStd) => {
  let steps = [[
    tSrc.shape[0],
    tSrc.shape[1],
  ]];

  if (Array.isArray(layers)) {
    assert$$1(
      parallelReductionCheckSteps2d(tSrc.shape, layers),
      'ImageMeanStd: Provided steps doesn\'t converge in 1 px in ImageExtractMeanStd operation',
    );

    steps = layers;
  } else if (typeof layers === 'number' && layers > 0) {
    steps = parallelReductionGetSteps2d(tSrc.shape, layers);
  }

  let meanPipe = ImageExtractMean(tSrc, steps[0]);

  for (let i = 1; i < steps.length; i += 1) {
    meanPipe = ImageExtractMean(meanPipe, steps[i]);
  }

  if (ignoreStd) {
    return meanPipe;
  }

  let stdPipe = ImageExtractStd(tSrc, meanPipe, steps[0]);

  for (let i = 1; i < steps.length; i += 1) {
    stdPipe = ImageReduceStd(stdPipe, steps[i]);
  }

  return JoinOp(meanPipe, stdPipe);
};

var getHistogramKernel = "const int kx=int(KX);const int ky=int(KY);precision highp float;vec4 operation(float gly,float iglx){float size=KX*KY;float glx=floor(iglx/COUNT);float currentIndex=iglx-(glx*COUNT);vec4 count=vec4(0.0);vec4 ones=vec4(1.0);vec4 twos=vec4(2.0);vec4 currentIndex4=vec4(currentIndex);vec4 value;for(int y=0;y<ky;y+=1){for(int x=0;x<kx;x+=1){value=pickValue_tSrc(gly*KY+float(y),glx*KX+float(x));vec4 index=floor((value-MIN)/STEP+0.5);count+=step(twos,ones/(abs(index-currentIndex4)));}}return count;}";

var reduceKernel = "const int kx=int(KX);const int ky=int(KY);vec4 operation(float gly,float iglx){float size=KX*KY;float glx=floor(iglx/COUNT);float currentIndex=iglx-(glx*COUNT);vec4 count=vec4(0.0);for(int y=0;y<ky;y+=1){for(int x=0;x<kx;x+=1){count+=pickValue_tSrc(gly*KY+float(y),(glx*KX+float(x))*COUNT+currentIndex);}}return count;}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

const ImageExtractHistogram = (tSrc, k, min, max, step, count) => new RegisterOperation('ImageExtractHistogram')
  .Input('tSrc', tSrc.dtype)
  .Output('float32')
  .Constant('KX', k[1])
  .Constant('KY', k[0])
  .LoadChunk('pickValue')
  .Constant('MIN', min)
  .Constant('MAX', max)
  .Constant('STEP', step)
  .Constant('COUNT', count)
  .SetShapeFn(() => [~~(tSrc.shape[0] / k[0]), ~~(tSrc.shape[1] / k[1]) * count, 4])
  .GLSLKernel(getHistogramKernel)
  .Compile({ tSrc });

const ImageReduceHistogram = (tSrc, k, count) => new RegisterOperation('ImageReduceHistogram')
  .Input('tSrc', 'float32')
  .Output('float32')
  .Constant('KX', k[1])
  .Constant('KY', k[0])
  .LoadChunk('pickValue')
  .Constant('COUNT', count)
  .SetShapeFn(() => [~~(tSrc.shape[0] / k[0]), ~~(tSrc.shape[1] / k[1]), 4])
  .GLSLKernel(reduceKernel)
  .Compile({ tSrc });

/**
 * @name Histogram
 * @description
 *  Extract histogram for given image and parameters
 * @param {Tensor} tSrc - Input image
 * @param {number} layers - Number of layers for a parallel reduction
 * @param {number} [min] - Minimal value of image values
 * @param {number} [max] - Maximum values of image values
 * @param {number} [step] - Step between min and max values.
 * @todo Enhance operation to be not sensible to input size and layers count,
 *  now we have danger limit (input width / first layer k) to be less then MAX_TEXUTRE_SIZE.
 */

var histogramOp = (tSrc, layers = 1, min = 0, max = 1, step = 1 / 255) => {
  // TODO: Probably we should refactor arguments priority and add assertation for them
  let steps = [[
    tSrc.shape[0],
    tSrc.shape[1],
  ]];

  const count = ~~((max - min + step) / step);

  if (Array.isArray(layers)) {
    assert$$1(
      parallelReductionCheckSteps2d(tSrc.shape, layers),
      'ImageExtractHistogram: Provided steps doesn\'t converge in 1 px in operation',
    );

    steps = layers;
  } else if (typeof layers === 'number' && layers > 0) {
    steps = parallelReductionGetSteps2d(
      tSrc.shape,
      layers,
      true,
      [ENV.MAX_TEXTURE_SIZE, ENV.MAX_TEXTURE_SIZE / 256 / (ENV.SUPPORTS_FLOAT_TEXTURES ? 1 : 4)],
    );
  }

  let histogramPipe = ImageExtractHistogram(tSrc, steps[0], min, max, step, count);

  for (let i = 1; i < steps.length; i += 1) {
    histogramPipe = ImageReduceHistogram(histogramPipe, steps[i], count);
  }

  return histogramPipe;
};

var getMinMax = "const int kx=int(KX);const int ky=int(KY);const float INF=1.0/0.0;const float h2=OUT_VIEW.y/2.0;vec4 operation(float igly,float glx){float size=KX*KY;vec3 minV=vec3(INF);vec3 maxV=vec3(-INF);float gly=igly;if(gly>=h2){gly-=h2;}for(int y=0;y<ky*2;y+=1){for(int x=0;x<kx;x+=1){vec3 value=pickValue_tSrc(gly*KY+float(y),glx*KX+float(x)).rgb;minV=min(minV,value.rgb);maxV=max(maxV,value.rgb);}}if(igly<h2){return vec4(minV,255.0);}else{return vec4(maxV,255.0);}}";

var reduceMinMax = "const int kx=int(KX);const int ky=int(KY);const float INF=1.0/0.0;const float h2=OUT_VIEW.y/2.0;vec4 operation(float gly,float glx){float size=KX*KY;vec3 minV=vec3(INF);vec3 maxV=vec3(-INF);vec3 value;for(int y=0;y<ky;y+=1){for(int x=0;x<kx;x+=1){value=pickValue_tSrc(gly*KY+float(y),glx*KX+float(x)).rgb;minV=min(minV,value);maxV=max(maxV,value);}}if(gly<h2){return vec4(minV,255.0);}return vec4(maxV,255.0);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

const ImageExtractMinMax = (tSrc, k) => new RegisterOperation('ImageExtractMinMax')
  .Input('tSrc', tSrc.dtype)
  .Output(tSrc.dtype)
  .Constant('KX', k[1])
  .Constant('KY', k[0])
  .LoadChunk('pickValue')
  .SetShapeFn(() => [~~(tSrc.shape[0] / k[0]) * 2, ~~(tSrc.shape[1] / k[1]), 4])
  .GLSLKernel(getMinMax)
  .Compile({ tSrc });

const ImageReduceMinMax = (tSrc, k) => new RegisterOperation('ImageReduceMinMax')
  .Input('tSrc', tSrc.dtype)
  .Output(tSrc.dtype)
  .Constant('KX', k[1])
  .Constant('KY', k[0])
  .LoadChunk('pickValue')
  .SetShapeFn(() => [~~(tSrc.shape[0] / k[0]), ~~(tSrc.shape[1] / k[1]), 4])
  .GLSLKernel(reduceMinMax)
  .Compile({ tSrc });

/**
 * @name MinMax
 * @description
 *  Extract min and max for given image
 * @param {Tensor} tSrc - Input image
 * @param {number} layers - Number of layers for a parallel reduction
 */

var minMaxOp = (tSrc, layers = 1) => {
  let steps = [[
    tSrc.shape[0],
    tSrc.shape[1],
  ]];

  if (Array.isArray(layers)) {
    assert$$1(
      parallelReductionCheckSteps2d(tSrc.shape, layers),
      'ImageMeanStd: Provided steps doesn\'t converge in 1 px in ImageExtractMeanStd operation',
    );

    steps = layers;
  } else if (typeof layers === 'number' && layers > 0) {
    steps = parallelReductionGetSteps2d(tSrc.shape, layers);
  }

  let minMaxPipe = ImageExtractMinMax(tSrc, steps[0]);

  for (let i = 1; i < steps.length; i += 1) {
    minMaxPipe = ImageReduceMinMax(minMaxPipe, steps[i]);
  }

  return minMaxPipe;
};

var kernel$6 = "vec4 operation(float y,float x){vec4 prev=pickValue_tPrev(y,x);vec4 curr=pickValue_tCurr(y,x);float v=sqrt((curr.x-prev.x)*(curr.x-prev.x)+(curr.y-prev.y)*(curr.y-prev.y)+(curr.w-prev.w)*(curr.w-prev.w));return vec4(v,v,v,1.0);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name MotionDetect
 * @description
 *  Promitive motion detector based on subsctruction
 *  of frames.
 * @example
 *  motionDetect(currentImage, previousImage);
 * @param {Tensor} tCurr - Current frame.
 * @param {Tensor} tPrev - Previous frame.
 */

var index$8 = (tCurr, tPrev) => {
  assert$$1(
    assertShapesAreEqual$$1(tCurr, tPrev),
    'MotionDetect: Current and previous input should have the same shape.',
  );

  return new RegisterOperation('MotionDetect')
    .Input('tCurr', tCurr.dtype)
    .Input('tPrev', tPrev.dtype)
    .Output(tCurr.dtype)
    .LoadChunk('pickValue')
    .GLSLKernel(kernel$6)
    .Compile({ tCurr, tPrev });
};

var kernel$7 = "vec4 operation(float y,float x){vec4 col=pickValue_tSrc(y,x)*255.0;float res=0.0;if((col.r>uRThreshold)&&(col.g>uGThreshold)&&(col.b>uBThreshold)&&(col.r>col.g)&&(col.r>col.b)&&(col.r-min(col.g,col.b)>uRtoMinDiffThreshold)&&(abs(col.r-col.g)>uRtoGDiffThreshold)){res=1.0;}return vec4(res,0.0,0.0,1.0);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name SkinTest
 * @description
 *  To enhance face/human detection we need an ability to test image for color that match skin
 *  color. This operation returns exact the same size image with fully red pisels
 *  rgba(255, 0, 0, 1) for pixels that match skin color and black rgba(0, 0, 0, 1) otherwise.
 * @example
 *  skinTestOp(inputImage);
 * @param {Tensor} tSrc - input image
 * @param {Object} [ths] - thresholds
 *
 * TODO: Please describe a mask formula in descriprion (@worldthirteen)
 */

var index$9 = (tSrc, ths = {}) => new RegisterOperation('SkinTest')
  .Input('tSrc', tSrc.dtype)
  .Output(tSrc.dtype)
  .Uniform('uRThreshold', 'float', ths.uRThreshold || 95.0)
  .Uniform('uGThreshold', 'float', ths.uGThreshold || 40.0)
  .Uniform('uBThreshold', 'float', ths.uBThreshold || 20.0)
  .Uniform('uRtoMinDiffThreshold', 'float', ths.uRtoMinDiffThreshold || 15.0)
  .Uniform('uRtoGDiffThreshold', 'float', ths.uRtoGDiffThreshold || 15.0)
  .LoadChunk('pickValue')
  .GLSLKernel(kernel$7)
  .Compile({ tSrc });

var kernel$8 = "vec4 operation(float gly,float glx){float x;float y;if(SWAP_COORDS){x=gly;y=glx;}else{x=glx;y=gly;}float _sy=floor(x/SX);float _sx=x-(_sy*SX);float _y=floor(y/WIN_SIZE_X);float _x=y-(_y*WIN_SIZE_X);return pickValue_tSrc(_sy*STRIDE_Y+_y,_sx*STRIDE_X+_x);}";

var kernelFlat = "\n#define WIN_LENGTH WIN_SIZE_X * WIN_SIZE_Y\nvec4 operation(float gly,float glx){float i;if(SWAP_COORDS){i=gly;}else{i=glx;}float x=floor(i/WIN_LENGTH);float y=i-x*WIN_LENGTH;float _sy=floor(x/SX);float _sx=x-(_sy*SX);float _y=floor(y/WIN_SIZE_X);float _x=y-(_y*WIN_SIZE_X);return pickValue_tSrc(_sy*STRIDE_Y+_y,_sx*STRIDE_X+_x);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

function getParam(param, name) {
  if (typeof param === 'number' && param > 0 && isFinite(param)) {
    return [param, param];
  }

  if (Array.isArray(param) && param.length === 2) {
    return param;
  }

  throw new Error(`Invalid parameter "${name}", expected a positive finite number or array with 2 those numbers, but got ${String(param)}`);
}

/**
 * @name SlidingWindow
 * @description
 *  We want to keep our algorythms clear, so to prepare a data for another
 *  algorythm we need a kind of getting data in different view. SlidingWindow is a helper
 *  in searching objects in an image, putting each window snaphot as a column,
 *  this makes easier to apply another algorythms that should wokrs with that data.
 * @example
 *  // this operation will output data in next stragtegy:
 *  // |xyzw|    |xyzqwe|
 *  // |qwer| -> |yzwwer|
 *  // |asdf|    |qweasd|
 *  //           |wersdf|
 *  // where each column is a one state of sliding window,
 *  // and each pixel in a row is a one pixel in a sliding window.
 *  slidingWindowOp(inputImage, 2, 1, 0);
 * @param {Tensor} tSrc - The source data to be processed.
 * @param {number|Array.<number>} windowSize
 * @param {number|Array.<number>} [stride] - window stride.
 * @param {number} [strategy] - output shape strategy.
 *  ENUM:
 *    0(default): [WH * WW, N, 4];
 *    1: [N, WH * WW, 4];
 *    2: [1, WH * WW * N, 4];
 *    2: [WH * WW * N, 1, 4];
 *  LEGEND:
 *    WH - window height,
 *    WW - window width,
 *    N - number of possible windows.
 *
 * TODO: Reviw description (@worldthirteen, @apilguk)
 * TODO: Review strategy API
 */

const slidingWindowOp = (tSrc, windowSize, stride = 1, stragtegy = 0) => {
  const win = getParam(windowSize, 'windowSize');
  const str = getParam(stride, 'stride');
  const SX = clacConvolution(tSrc.shape[1], win[0], str[0]);
  const SY = clacConvolution(tSrc.shape[0], win[1], str[1]);

  let outputShape;
  let kernelCode;
  let SWAP_COORDS;

  switch (stragtegy) {
    case 1:
      outputShape = [SX * SY, win[0] * win[1], 4];
      SWAP_COORDS = true;
      kernelCode = kernel$8;
      break;
    case 2:
      outputShape = [1, SX * SY * win[0] * win[1], 4];
      SWAP_COORDS = false;
      kernelCode = kernelFlat;
      break;
    case 3:
      outputShape = [SX * SY * win[0] * win[1], 1, 4];
      SWAP_COORDS = true;
      kernelCode = kernelFlat;
      break;
    case 0:
    default:
      outputShape = [win[0] * win[1], SX * SY, 4];
      SWAP_COORDS = false;
      kernelCode = kernel$8;
  }

  return new RegisterOperation('SlidingWindow')
    .Input('tSrc', 'float32')
    .Output('float32')
    .Constant('WIDTH', tSrc.shape[1])
    .Constant('HEIGHT', tSrc.shape[0])
    .Constant('SX', SX)
    .Constant('SY', SY)
    .Constant('STRIDE_Y', str[1])
    .Constant('STRIDE_X', str[0])
    .Constant('WIN_SIZE_X', win[0])
    .Constant('WIN_SIZE_Y', win[1])
    .Constant('SWAP_COORDS', SWAP_COORDS)
    .LoadChunk('pickValue')
    .SetShapeFn(() => outputShape)
    .GLSLKernel(kernelCode)
    .Compile({ tSrc });
};

var kernel$9 = "vec4 findForAngle(float theta,bool invert,float gly,float glx){const float thetaTreshold=PI/6.0;float PER_STEP=(uStrokeMax-uStrokeMin)/STEPS;if(invert){theta+=PI;}float sn=sin(theta);float cs=cos(theta);float tx=cs*PER_STEP;float ty=sn*PER_STEP;float minX=cs*uStrokeMin;float minY=sn*uStrokeMin;float strokeWidth=0.0;int intersect=0;int cx=0;int cy=0;for(int i=int(STEPS);i>0;i-=1){int nx=int(glx+minX+tx*float(i));int ny=int(gly+minY+ty*float(i));float dist=sqrt(float((nx-int(glx))*(nx-int(glx)))+float((ny-int(gly))*(ny-int(gly))));float cannyValue=pickValue_tCanny(float(ny),float(nx)).r;vec4 sobelValue=pickValue_tSobel(float(ny),float(nx));float theta2=atan(sobelValue.b,sobelValue.g);if(invert){theta2+=PI;}if(cannyValue>0.0&&dist>uStrokeMin&&dist<uStrokeMax&&abs(abs(theta-theta2)-PI)<thetaTreshold){strokeWidth=dist;cx=nx;cy=ny;}}return vec4(strokeWidth,cx,cy,theta);}vec4 operation(float _y,float _x){vec4 sobel=pickValue_tSobel(_y,_x);vec4 canny=pickValue_tCanny(_y,_x);float dx=sobel.g;float dy=sobel.b;float _theta=atan(dy,dx);vec4 result=findForAngle(_theta,INVERT>0.0,_y,_x);float strokeWidth=result.r;int cx=int(result.g);int cy=int(result.b);float theta=result.a;float a=float(cx)-_x;float b=float(cy)-_y;if(C>0.0){if(canny.r>0.0&&cx>0&&cy>0){return vec4(strokeWidth,theta,int(cx),int(cy));}else{return vec4(0,0,0,0);}}if(canny.r>0.0&&cx>0&&cy>0){return vec4(strokeWidth,theta,0,1.0);}else{return vec4(0,0,0,0);}}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name StrokeWidthTransform
 * @description
 *  Find text on image, using stroke width transform.
 *  [Paper](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/1509.pdf).
 * @example
 *  // this line reduces an input image in 3x
 *  downsampleOp(inputImage, 3, 0);
 * @param {Tensor} tSobel - The output from @ImageSobelOperator
 * @param {Tensor} tCanny - The output from @ImageCannyEdgesHysteresis
 * @param {number} [min] - Minimum stroke width
 * @param {number} [max] - Maximum stroke width
 * @param {number} [steps] - How much pixels count between min and max to determine
 * @param {boolean} [retrunCoords] - Pass coordinates as output
 * @param {boolean} [invert] - Find black text on white backgound when true,
 *  and white on black when false.
 */

var index$a = (
  tSobel,
  tCanny,
  min = 3,
  max = 10,
  steps = 10,
  returnCoords = false,
  invert = true,
) => new RegisterOperation('ImageStrokeWidthTransform')
  .Input('tSobel', 'float32')
  .Input('tCanny', 'uint8')
  .Output('float32')
  .LoadChunk('pickValue')
  .Uniform('uStrokeMin', 'float', min)
  .Uniform('uStrokeMax', 'float', max)
  .Uniform('uWidth', 'float', tSobel.shape[0])
  .Uniform('uHeight', 'float', tSobel.shape[1])
  .Constant('STEPS', steps)
  .Constant('C', returnCoords ? 1 : 0)
  .Constant('INVERT', invert ? 1 : 0)
  .Constant('PI', Math.PI)
  .GLSLKernel(kernel$9)
  .Compile({ tCanny, tSobel });

var kernel$a = "vec4 operation(float y,float x){vec4 chanels1=pickValue_tA(y,x);vec4 chanels2=pickValue_tB(y,x);return RESULT;}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name Concat
 * @description
 *  Concat two inputs in one image
 * @example
 *  Concat(inputImage1, inputImage2, ['1.r', '1.g', '2.b', '2.a']);
 * @param {Tensor} tA - The first input
 * @param {Tensor} tB - The second input
 * @param {Array.<string>} [mask] - Array that should describe the needed output.
 *  This should be an array of strings in format "{number of input}.{vector component}",
 *  see example for more.
 *
 *  ⚠️ STILL UNDER DEVELOPMENT (EXPERIMENTAL, API COULD BE CHANGED OR DEPRECATED)
 */

var index$b = (tA, tB, mask = ['1.r', '1.g', '2.b', '2.a']) => {
  assert$$1(
    tA.dtype === tB.dtype,
    `Concat operation: inputs should have the same dtype, got ${tA.dtype} and ${tB.dtype}`,
  );

  assert$$1(
    mask.length === 4,
    'Concat operation: wrong input',
  );

  for (let i = 0; i < mask.length; i += 1) {
    assert$$1(
      typeof mask[i] === 'string' || !/^\d\.(r|g|b|a|x|y|z|w)$/.test(mask[i]),
      'Concat operation: wrong input',
    );
  }

  return new RegisterOperation('Concat')
    .Input('tA', tA)
    .Input('tB', tB)
    .Output(tA.dtype)
    .LoadChunk('pickValue')
    .GLSLKernel(kernel$a.replace('RESULT', `vec4(${mask.map(s => `chanels${s}`).join(', ')})`))
    .Compile({ tA, tB });
};

var l2Kernel = "vec4 operation(float y,float x){vec3 chanels=pickValue_tSrc(y,x).rgb;vec3 mean=pickValue_tStdMean(0.0,0.0).rgb;vec3 std=pickValue_tStdMean(1.0,0.0).rgb;vec3 value=(chanels-mean)/std;return vec4(value,1.0);}";

var minMaxKernel = "vec4 operation(float y,float x){vec3 chanels=pickValue_tSrc(y,x).rgb;vec3 minV=pickValue_tMinMax(0.0,0.0).rgb;vec3 maxV=pickValue_tMinMax(1.0,0.0).rgb;vec3 value=(chanels-minV)/(maxV-minV);return vec4(value,1.0);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

const l2Norm = (tSrc, tStdMean) => new RegisterOperation('l2Norm')
  .Input('tSrc', 'uint8')
  .Input('tStdMean', 'uint8')
  .Output('uint8')
  .LoadChunk('pickValue')
  .GLSLKernel(l2Kernel)
  .Compile({ tSrc, tStdMean });

const minMaxNorm = (tSrc, tMinMax) => new RegisterOperation('minMaxNorm')
  .Input('tSrc', 'uint8')
  .Input('tMinMax', 'uint8')
  .Output('uint8')
  .LoadChunk('pickValue')
  .GLSLKernel(minMaxKernel)
  .Compile({ tSrc, tMinMax });

/**
* @name Normalization
* @description Normalize given data by picked normalization type
* @param {Tensor} tSrc - Input data
* @param {string} type - normalization type, currently supported ['l2', 'minmax']
* @param {number} parallelReductionLayers -
*  Number of layers for a parallel reduction
*/
var index$c = (tSrc, type, parallelReductionLayers = 2) => {
  assert$$1(
    type === 'l2' || type === 'minmax',
    `Unsupported type of normalization operation.
     Currently availiable max and visualize.`,
  );

  let operation = null;

  if (type === 'l2') {
    operation = l2Norm(tSrc, meanStdOp(tSrc, parallelReductionLayers));
  }

  if (type === 'minmax') {
    operation = minMaxNorm(tSrc, minMaxOp(tSrc, parallelReductionLayers));
  }

  return operation;
};

var histKernel = "const float norm=1.0/(OUT_VIEW.x*OUT_VIEW.y);vec4 operation(float y,float x){vec4 histBase=pickValue_tSrc(y,x)*255.0;float r=pickValue_tHist(0.0,histBase.r).r;float g=pickValue_tHist(0.0,histBase.g).g;float b=pickValue_tHist(0.0,histBase.b).b;float a=pickValue_tHist(0.0,histBase.a).a;return vec4(r,g,b,255.0/norm)*norm;}";

var histCumulateKernel = "vec4 operation(float y,float x){vec4 sum=vec4(0.0);for(float i=0.0;i<255.0;i+=1.0){vec4 value=pickValue_tSrc(0.0,i);if(i<=x){sum+=value;}else{break;}}return sum;}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

const cumulateHistEq = tSrc => new RegisterOperation('histogramCumulation')
  .Input('tSrc', 'float32')
  .Output('float32')
  .LoadChunk('pickValue')
  .GLSLKernel(histCumulateKernel)
  .Compile({ tSrc });

const histEq = (tSrc, tHist) => new RegisterOperation('histogramEqualization')
  .Input('tSrc', 'uint8')
  .Input('tHist', 'float32')
  .Output('uint8')
  .LoadChunk('pickValue')
  .GLSLKernel(histKernel)
  .Compile({ tSrc, tHist });


/**
 * @name Histogram Equalization
 * @description
 *  Equalize histogram for given image
 * @param {Tensor} tSrc - Input image
 * @param {number} parallelReductionLayers -
 *  Number of layers for a parallel reduction of histogram extraction
 */

var index$d = (tSrc, parallelReductionLayers = 2) =>
  histEq(tSrc, cumulateHistEq(histogramOp(tSrc, parallelReductionLayers)));

var kernel$b = "vec4 getPoint(vec2 p){return pickValue_tSrc(p.y,p.x);}mat3 getTransformMatrix(){vec3 r1=pickValue_tTransform(0.0,0.0).rgb;vec3 r2=pickValue_tTransform(1.0,0.0).rgb;vec3 r3=pickValue_tTransform(3.0,0.0).rgb;return mat3(r1,r2,r3);}vec4 operation(float y,float x){mat3 m=getTransformMatrix();float off=0.0;float ixs=0.0;float iys=0.0;float xs=0.0;float ys=0.0;float xs0=0.0;float ys0=0.0;float ws=0.0;float sc=0.0;float a=0.0;float b=0.0;xs0=m[0][1]*y+m[0][2];ys0=m[1][1]*y+m[1][2];ws=m[2][1]*y+m[2][2];xs0+=m[0][0]*x;ys0+=m[1][0]*x;ws+=m[2][0]*x;sc=1.0/ws;xs=xs0*sc;ys=ys0*sc;ixs=xs;iys=ys;a=max(xs-ixs,0.0);b=max(ys-iys,0.0);vec2 mvec=vec2(ixs,iys);vec2 ox=vec2(1.0,0.0);vec2 oy=vec2(1.0,1.0);vec4 p0=getPoint(mvec)+a*(getPoint(mvec+ox)-getPoint(mvec));vec4 p1=getPoint(mvec+oy)+a*(getPoint(mvec+ox+oy)-getPoint(mvec+oy));vec4 pres=p0+b*(p1-p0);return pres;}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

var index$e = (tSrc, tTransform, shape = [10, 10, 4], dtype = tSrc.dtype) => new RegisterOperation('PerspectiveProjection')
  .Input('tSrc', tSrc.dtype)
  .Input('tTransform', 'float32')
  .Output(dtype)
  .LoadChunk('pickValue')
  .Uniform('uSrcWidth', 'float', tSrc.shape[1])
  .Uniform('uSrcHeight', 'float', tSrc.shape[0])
  .Uniform('uWidth', 'float', shape[1])
  .Uniform('uHeight', 'float', shape[0])
  .SetShapeFn(() => shape)
  .GLSLKernel(kernel$b)
  .Compile({ tSrc, tTransform });

var transformKernel = "precision highp float;float intersectionX(vec4 line,float x){return((x-line.x)/(line.z-line.x)*(line.w-line.y)+line.y);}float intersectionY(vec4 line,float y){return((y-line.y)/(line.w-line.y)*(line.z-line.x)+line.x);}vec4 findSide(float x1,float y1,float x2,float y2){int i=0;vec2 i0=vec2(0,0);vec2 i1=vec2(0,0);float ax=0.0;float ay=intersectionY(vec4(x1,y1,x2,y2),ax);float by=0.0;float bx=intersectionX(vec4(x1,y1,x2,y2),by);float cx=MAX_DIST;float cy=intersectionY(vec4(x1,y1,x2,y2),cx);float dy=MAX_DIST;float dx=intersectionX(vec4(x1,y1,x2,y2),dy);if(ay<=MAX_DIST&&ay>=0.0){if(i==0){i0=vec2(ax,ay);i+=1;}}if(cy<=MAX_DIST&&cy>=0.0){if(i==0){i0=vec2(cx,cy);i+=1;}else{i1=vec2(cx,cy);}}if(bx<=MAX_DIST&&bx>=0.0){if(i==0){i0=vec2(bx,by);i+=1;}else{i1=vec2(bx,by);}}if(dx<=MAX_DIST&&dx>=0.0){if(i==0){i0=vec2(dx,dy);i+=1;}else{i1=vec2(dx,dy);}}return vec4(i0.x,i0.y,i1.x,i1.y);}float pow(float a){return a*a;}vec4 getStraight(float aIndex,float v,float dist,float angles){float y1;float y2;if(aIndex>angles){aIndex-=angles;y1=MAX_ANGLE-(angles*v/aIndex);y2=(-1.0+angles/aIndex)*uWidth+y1;}else{aIndex=angles-aIndex;y1=(angles*v/aIndex);y2=(1.0-angles/aIndex)*uWidth+y1;}return vec4(0.0,y1,uWidth,y2);}float getValue(float i,float lx,float ly,vec4 side){float xx=0.0;float yy=0.0;if(lx<ly){xx=i;yy=intersectionY(side,xx);}else{yy=i;xx=intersectionX(side,yy);}if(xx>0.0&&xx<uWidth&&yy>0.0&&yy<uHeight){float a=pickScalarValue_tSrc(floor(yy),floor(xx));if(a>0.0){return 1.0;}}return 0.0;}vec4 operation(float y,float x){float v_out=0.0;vec4 straight=getStraight(x,y,MAX_DIST,MAX_ANGLE/2.0);vec4 side=findSide(straight.x,straight.y,straight.z,straight.w);float lx=abs(side.z-side.x);float ly=abs(side.w-side.y);float k=1.0/D;for(float i=0.0;i<=D;i+=STEP){float a=getValue(i,lx,ly,side);if(a>0.0){v_out+=k;}}return vec4(v_out,v_out,v_out,255.0);}";

var enhanceKernel = "\n#define X_STEPS 10.0\n#define Y_STEPS 10.0\nvec4 operation(float y,float x){float value=pickValue_tSrc(y,x).r;float c=value*value;float sum=0.0;for(float j=0.0;j<Y_STEPS;j+=1.0){for(float i=0.0;i<X_STEPS;i+=1.0){sum+=pickValue_tSrc((y-Y_STEPS/2.0)+j,(x-X_STEPS/2.0)+i).r;}}float v=(c/sum)*X_STEPS*Y_STEPS;return vec4(v,v,v,1);}";

var peaksKernel = "const int w=int(W);const int h=int(H);vec4 operation(float _y,float _x){float mmax=0.0;float maxX=0.0;float maxY=0.0;float sy=_y*H;float sx=_x*W;float yLimit=O_HEIGHT-sy;float xLimit=O_WIDTH-sx;vec4 value;for(float y=0.0;y<H;y+=1.0){if(y>=yLimit){break;}for(float x=0.0;x<W;x+=1.0){if(x>=xLimit){break;}value=pickValue_tSrc(y+sy,x+sx);if(value.r>=mmax){mmax=value.r;if(uF<0.5){maxX=x+sx;maxY=y+sy;}else{maxX=value.g;maxY=value.b;}}}}return vec4(mmax,maxX,maxY,255.0);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

const pcLinesReduceMax = (tSrc, k = 10, f = 0) => {
  const h = ~~(tSrc.shape[0] / k);
  const w = ~~(tSrc.shape[1] / k);
  const _k = Math.ceil(Math.max(tSrc.shape[0] / h, tSrc.shape[1] / w));

  return new RegisterOperation('ReduceMax')
    .Input('tSrc', f ? 'float32' : 'uint8')
    .Output('float32')
    .Uniform('uF', 'float', f)
    .LoadChunk('pickValue')
    .Constant('W', _k)
    .Constant('H', _k)
    .Constant('O_WIDTH', tSrc.shape[1])
    .Constant('O_HEIGHT', tSrc.shape[0])
    .Constant('K', 1 / _k)
    .SetShapeFn(() => [Math.ceil(tSrc.shape[0] / _k), Math.ceil(tSrc.shape[1] / _k), 4])
    .GLSLKernel(peaksKernel)
    .Compile({ tSrc });
};

const pcLinesEnhance = tSrc => new RegisterOperation('PCLinesEnhanced')
  .Input('tSrc', 'uint8')
  .Output('uint8')
  .Uniform('uWidth', 'float', tSrc.shape[0])
  .Uniform('uHeight', 'float', tSrc.shape[0])
  .LoadChunk('pickValue')
  .GLSLKernel(enhanceKernel)
  .Compile({ tSrc });

const pcLinesTransform = (tSrc, step = 3) => {
  const size = Math.max(tSrc.shape[0], tSrc.shape[1]);

  return new RegisterOperation('PCLinesTransform')
    .Input('tSrc', 'float32')
    .Output('uint8')
    .Uniform('uWidth', 'float', tSrc.shape[1])
    .Uniform('uHeight', 'float', tSrc.shape[0])
    .Constant('PI', Math.PI)
    .Constant('D', size)
    .Constant('STEP', step)
    .Constant('MAX_DIST', size)
    .Constant('MAX_ANGLE', size)
    .LoadChunk('pickValue')
    .SetShapeFn(() => [size, size, 4])
    .GLSLKernel(transformKernel)
    .Compile({ tSrc });
};

/**
 * @name PCLinesTransform
 * @description Implementation of Hough transform algorithm in parallel line space,
 *  also known as PC Lines.
 * @param {Tensor} input - Image edges image should be binarized to [0, 1],
 *  could be used with Canny Edges.
 * @param {number} layers - count of parallel reduction layers
 * @param {number} dStep - discretization step
 * @param {number} dCoeficient - reduction coefficient
 */

var index$f = (input, layersCount = 2, dStep = 2, dCoeficient = 2) => {
  let pipeline = pcLinesTransform(input, dStep);

  pipeline = pcLinesReduceMax(pipeline, dCoeficient);

  for (let i = 0; i < layersCount; i += 1) {
    pipeline = pcLinesReduceMax(pipeline, dCoeficient, 1);
  }

  return pipeline;
};

var RGBToHSVKernel = "vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)),d/(q.x+e),q.x);}vec4 operation(float y,float x){return vec4(rgb2hsv(pickValue_tSrc(y,x).rgb),1);}";

var HSVToRGBKernel = "vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.0,2.0/3.0,1.0/3.0,3.0);vec3 p=abs(fract(c.xxx+K.xyz)*6.0-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.0,1.0),c.y);}vec4 operation(float y,float x){return vec4(hsv2rgb(pickValue_tSrc(y,x).rgb),1);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name HSVColorConverter
 * @description
 *  Convert RGB color to HSV spave and vice versa,
 *  [original code](http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl).
 * @example
 *  // this line convert RGB space to HSV
 *  gm.HSVColor(inputImage, 'rgb_to_hsv');
 * @param {Tensor} tSrc - The input image
 * @param {Tensor} type - Operation supports two types of conversion: `rgb_to_hsv`, `hsv_to_rgb`.
 */

var index$g = (tSrc, type = 'rgb_to_hsv') => {
  assert$$1(
    type === 'rgb_to_hsv' || type === 'hsv_to_rgb',
    `Unsupported type ${type}, currenlty avaliable: rgb_to_hsv, hsv_to_rgb.`,
  );

  let kernel = null;

  if (type === 'rgb_to_hsv') {
    kernel = RGBToHSVKernel;
  }

  if (type === 'hsv_to_rgb') {
    kernel = HSVToRGBKernel;
  }

  return new RegisterOperation('HSV')
    .Input('tSrc', tSrc.dtype)
    .Output(tSrc.dtype)
    .LoadChunk('pickValue')
    .GLSLKernel(kernel)
    .Compile({ tSrc });
};

var kernel$c = "vec4 operation(float y,float x){vec4 pixel=pickValue_tSrc(y,x);if(pixel[int(C)]>uT){return vec4(1.0,1.0,1.0,1.0);}else{return vec4(0.0,0.0,0.0,1.0);}}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name Threshold
 * @description
 *  Applyes a threshold to the input image,
 *  threshold will be applied to the given channel.
 * @example
 *  gm.threshold(inputImage, 0.5);
 * @param {Tensor} tSrc - The source to be thresholded.
 * @param {number} threshold - Value to be applied
 * @param {number} channel - Channel to be applied
 */

var index$h = (tSrc, threshold = 0.5, channel = 0) => {
  assert$$1(
    typeof threshold === 'number',
    'Only number available as a threshold value.',
  );

  assert$$1(
    channel === 0 || channel === 1 || channel === 2 || channel === 3,
    'Only RGBA available: 0, 1, 2, 3',
  );

  return new RegisterOperation('Threshold')
    .Input('tSrc', tSrc.dtype)
    .Output(tSrc.dtype)
    .Constant('C', channel)
    .Uniform('uT', 'float', threshold)
    .LoadChunk('pickValue')
    .GLSLKernel(kernel$c)
    .Compile({ tSrc });
};

var kernel$d = "float HKW=floor(KW/2.0);float HKH=floor(KW/2.0);vec4 operation(float y,float x){float R=10000.0;float G=10000.0;float B=10000.0;y=y+HKH;x=x+HKW;for(float dx=0.0;dx<KW;dx+=1.0){for(float dy=0.0;dy<KH;dy+=1.0){vec4 v=pickValue_tSrc((y-dy),(x-dx));vec4 m=pickValue_tKernel(dy,dx);if(v.r<R&&m.r>0.0){R=v.r;}if(v.g<G&&m.g>0.0){G=v.g;}if(v.b<B&&m.b>0.0){B=v.b;}}}return vec4(R,G,B,1.0);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name Erosion
 * @description
 *  Erosion is one of two fundamental operations (the other being dilation)
 *  in morphological image processing from which all other morphological operations are based.
 *  It was originally defined for binary images, later being extended to grayscale images,
 *  and subsequently to complete lattices.
 *  [Wiki](https://en.wikipedia.org/wiki/Erosion_(morphology))
 * @example
 *  gm.erode(inputImage, [3, 3]);
 * @param {Tensor} tSrc - The source image to be downsampled.
 * @param {Array.<number>} kernelSize - Size of structure element.
 * @param {Tensor} tKernel - Optional kernel.
 */


var erode = (
  tSrc,
  kernelSize = [2, 2],
  tKernel = false,
) => {
  assert$$1(
    kernelSize.length === 2,
    'Erosion: Kernel size should be shape of rank 2',
  );

  if (isTensor$$1(tKernel)) {
    assert$$1(
      kernelSize[0] === tKernel.shape[0] && kernelSize[1] === tKernel.shape[1],
      'Erosion: Structure element has wrong size',
    );
  }

  if (!tKernel) {
    tKernel = new Tensor('float32', [kernelSize[0], kernelSize[1], 4]);

    for (let x = 0; x < kernelSize[0]; x += 1) {
      for (let y = 0; y < kernelSize[1]; y += 1) {
        tKernel.set(x, y, 0, 1);
        tKernel.set(x, y, 1, 1);
        tKernel.set(x, y, 2, 1);
        tKernel.set(x, y, 3, 1);
      }
    }
  }

  return new RegisterOperation('Erosion')
    .Input('tSrc', tSrc.dtype)
    .Input('tKernel', 'float32')
    .Output(tSrc.dtype)
    .Constant('KW', kernelSize[0])
    .Constant('KH', kernelSize[1])
    .LoadChunk('pickValue')
    .GLSLKernel(kernel$d)
    .Compile({ tSrc, tKernel });
};

var kernel$e = "float HKW=floor(KW/2.0);float HKH=floor(KW/2.0);vec4 operation(float y,float x){float R=0.0;float G=0.0;float B=0.0;y=y+HKH;x=x+HKW;for(float dx=0.0;dx<KW;dx+=1.0){for(float dy=0.0;dy<KH;dy+=1.0){vec4 v=pickValue_tSrc((y-dy),(x-dx));vec4 m=pickValue_tKernel(dy,dx);if(v.r>R&&m.r>0.0){R=v.r;}if(v.g>G&&m.g>0.0){G=v.g;}if(v.b>B&&m.b>0.0){B=v.b;}}}return vec4(R,G,B,1.0);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name Dilation
 * @description
 *  Dilation is one of the basic operations in mathematical morphology.
 *  Originally developed for binary images, it has been expanded first to grayscale images,
 *  and then to complete lattices. The dilation operation usually uses a structuring element
 *  for probing and expanding the shapes contained in the input image.
 *  [Wiki](https://en.wikipedia.org/wiki/Dilation_(morphology))
 * @example
 *  gm.dilate(inputImage, [3, 3]);
 * @param {Tensor} tSrc - The source image to be downsampled.
 * @param {Array.<number>} kernelSize - Size of structure element.
 * @param {Tensor} tKernel - Optional kernel.
 */

var dilate = (
  tSrc,
  kernelSize = [2, 2],
  tKernel = false,
) => {
  assert$$1(
    kernelSize.length === 2,
    'Dilation: Kernel size should be shape of rank 2',
  );

  if (isTensor$$1(tKernel)) {
    assert$$1(
      kernelSize[0] === tKernel.shape[0] && kernelSize[1] === tKernel.shape[1],
      'Dilation: Structure element has wrong size',
    );
  }

  if (!tKernel) {
    tKernel = new Tensor('float32', [kernelSize[0], kernelSize[1], 4]);

    for (let x = 0; x < kernelSize[0]; x += 1) {
      for (let y = 0; y < kernelSize[1]; y += 1) {
        tKernel.set(x, y, 0, 1);
        tKernel.set(x, y, 1, 1);
        tKernel.set(x, y, 2, 1);
        tKernel.set(x, y, 3, 1);
      }
    }
  }

  return new RegisterOperation('Dilation')
    .Input('tSrc', tSrc.dtype)
    .Input('tKernel', 'float32')
    .Output(tSrc.dtype)
    .Constant('KW', kernelSize[0])
    .Constant('KH', kernelSize[1])
    .LoadChunk('pickValue')
    .GLSLKernel(kernel$e)
    .Compile({ tSrc, tKernel });
};

var kernelSub = "vec4 operation(float y,float x){vec4 A=pickValue_tA(y,x);vec4 B=pickValue_tB(y,x);return vec4(A.rgb-B.rgb,1.0);}";

var kernelAdd = "vec4 operation(float y,float x){vec4 A=pickValue_tA(y,x);vec4 B=pickValue_tB(y,x);return vec4(A.rgb+B.rgb,1.0);}";

var kernelMult = "vec4 operation(float y,float x){vec4 A=pickValue_tA(y,x);vec4 B=pickValue_tB(y,x);return vec4(A.rgb*B.rgb,1.0);}";

var kernelDiv = "vec4 operation(float y,float x){vec4 A=pickValue_tA(y,x);vec4 B=pickValue_tB(y,x);return vec4(A.rgb/B.rgb,1.0);}";

var kernelSubScalar = "vec4 operation(float y,float x){vec4 A=pickValue_tA(y,x);return vec4(A.rgb-uScalar,1.0);}";

var kernelAddScalar = "vec4 operation(float y,float x){vec4 A=pickValue_tA(y,x);return vec4(A.rgb+uScalar,1.0);}";

var kernelMultScalar = "vec4 operation(float y,float x){vec4 A=pickValue_tA(y,x);return vec4(A.rgb*uScalar,1.0);}";

var kernelDivScalar = "vec4 operation(float y,float x){vec4 A=pickValue_tA(y,x);return vec4(A.rgb/uScalar,1.0);}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

const pixelwiseMathOpValidation = (name, tA, tB) => {
  assert$$1(
    isTensor$$1(tA) || isOperation$$1(tA),
    `${name}: A input is not a Tensor or Operation instance`,
  );

  assert$$1(
    isTensor$$1(tB) || isOperation$$1(tB),
    `${name}: B input is not a Tensor or Operation instance`,
  );

  assert$$1(
    tA.dtype === tB.dtype,
    `${name}: inputs should have the same dtype, got ${tA.dtype} and ${tB.dtype}`,
  );

  assert$$1(
    tA.shape[0] === tB.shape[0] && tA.shape[1] === tB.shape[1] && tA.shape[3] === tB.shape[3],
    `${name}: inputs should have the same shapes, got ${tA.shape} and ${tB.shape}`,
  );
};

const scalarMathOpValidation = (name, tA, scalar) => {
  assert$$1(
    typeof scalar === 'number',
    `${name}: scalar value is not a number`,
  );

  assert$$1(
    isTensor$$1(tA) || isOperation$$1(tA),
    `${name}: A input is not a Tensor or Operation instance`,
  );
};

/**
 * @name Basic
 * @description
 *  Basic mathematical operations
 */

/**
 * @name Sub
 * @description
 *  Pixel-wise substruction A - B
 * @example
 *  gm.sub(A, B);
 * @param {Tensor} tA - The first input
 * @param {Tensor} tB - The second input
 */

const sub = (tA, tB) => {
  const name = 'Sub';

  pixelwiseMathOpValidation(name, tA, tB);

  return new RegisterOperation(name)
    .Input('tA', tA)
    .Input('tB', tB)
    .Output(tA.dtype)
    .LoadChunk('pickValue')
    .GLSLKernel(kernelSub)
    .Compile({ tA, tB });
};

/**
 * @name Add
 * @description
 *  Pixel-wise sum A + B
 * @example
 *  gm.add(A, B);
 * @param {Tensor} tA - The first input
 * @param {Tensor} tB - The second input
 */

const add = (tA, tB) => {
  const name = 'Add';

  pixelwiseMathOpValidation(name, tA, tB);

  return new RegisterOperation(name)
    .Input('tA', tA)
    .Input('tB', tB)
    .Output(tA.dtype)
    .LoadChunk('pickValue')
    .GLSLKernel(kernelAdd)
    .Compile({ tA, tB });
};

/**
 * @name Div
 * @description
 *  Pixel-wise divide A / B
 * @example
 *  gm.div(A, B);
 * @param {Tensor} tA - The first input
 * @param {Tensor} tB - The second input
 */

const div = (tA, tB) => {
  const name = 'Div';

  pixelwiseMathOpValidation(name, tA, tB);

  return new RegisterOperation(name)
    .Input('tA', tA)
    .Input('tB', tB)
    .Output(tA.dtype)
    .LoadChunk('pickValue')
    .GLSLKernel(kernelDiv)
    .Compile({ tA, tB });
};

/**
 * @name Mult
 * @description
 *  Pixel-wise muliply A * B
 * @example
 *  gm.mult(A, B);
 * @param {Tensor} tA - The first input
 * @param {Tensor} tB - The second input
 */

const mult = (tA, tB) => {
  const name = 'Mult';

  pixelwiseMathOpValidation(name, tA, tB);

  return new RegisterOperation(name)
    .Input('tA', tA)
    .Input('tB', tB)
    .Output(tA.dtype)
    .LoadChunk('pickValue')
    .GLSLKernel(kernelMult)
    .Compile({ tA, tB });
};

/**
 * @name SubScalar
 * @description
 *  A - scalar
 * @example
 *  gm.subScalar(A, 0.5);
 * @param {Tensor} tA - Input
 * @param {number} scalar - Scalar
 */

const subScalar = (tA, scalar) => {
  const name = 'SubScalar';

  scalarMathOpValidation(name, tA, scalar);

  return new RegisterOperation(name)
    .Input('tA', tA)
    .Output(tA.dtype)
    .Uniform('uScalar', 'float', scalar)
    .LoadChunk('pickValue')
    .GLSLKernel(kernelSubScalar)
    .Compile({ tA });
};

/**
 * @name AddScalar
 * @description
 *  A + scalar
 * @example
 *  gm.addScalar(A, 0.5);
 * @param {Tensor} tA - Input
 * @param {number} scalar - Scalar
 */

const addScalar = (tA, scalar) => {
  const name = 'AddScalar';

  scalarMathOpValidation(name, tA, scalar);

  return new RegisterOperation(name)
    .Input('tA', tA)
    .Output(tA.dtype)
    .Uniform('uScalar', 'float', scalar)
    .LoadChunk('pickValue')
    .GLSLKernel(kernelAddScalar)
    .Compile({ tA });
};

/**
 * @name DivScalar
 * @description
 *  A / scalar
 * @example
 *  gm.divScalar(A, 0.5);
 * @param {Tensor} tA - Input
 * @param {number} scalar - Scalar
 */

const divScalar = (tA, scalar) => {
  const name = 'DivScalar';

  scalarMathOpValidation(name, tA, scalar);

  return new RegisterOperation(name)
    .Input('tA', tA)
    .Output(tA.dtype)
    .Uniform('uScalar', 'float', scalar)
    .LoadChunk('pickValue')
    .GLSLKernel(kernelDivScalar)
    .Compile({ tA });
};

/**
 * @name MultScalar
 * @description
 *  A * scalar
 * @example
 *  gm.multScalar(A, 0.5);
 * @param {Tensor} tA - Input
 * @param {number} scalar - Scalar
 */

const multScalar = (tA, scalar) => {
  const name = 'MultScalar';

  scalarMathOpValidation(name, tA, scalar);

  return new RegisterOperation(name)
    .Input('tA', tA)
    .Output(tA.dtype)
    .Uniform('uScalar', 'float', scalar)
    .LoadChunk('pickValue')
    .GLSLKernel(kernelMultScalar)
    .Compile({ tA });
};

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name MorphTransform
 * @example
 *  gm.morphologyEx(inputImage, 'open', [3, 3]);
 * @param {Tensor} tSrc - The source image to be downsampled.
 * @param {string} type - Size of structure element.
 * @param {Array.<number>} kernelSize - Size of structure element
 * @param {Tensor} tKernel - Optional kernel.
 */

var index$i = (
  tSrc,
  type = 'open',
  kernelSize = [2, 2],
  tKernel = false,
) => {
  switch (type) {
    case 'open':
      return dilate(erode(tSrc, kernelSize, tKernel), kernelSize, tKernel);
    case 'close':
      return erode(dilate(tSrc, kernelSize, tKernel), kernelSize, tKernel);
    case 'gradient':
      return sub(
        dilate(tSrc, kernelSize, tKernel),
        erode(tSrc, kernelSize, tKernel),
      );
    case 'tophat':
      return sub(
        tSrc,
        dilate(erode(tSrc, kernelSize, tKernel), kernelSize, tKernel),
      );
    case 'blackhat':
      return sub(
        erode(dilate(tSrc, kernelSize, tKernel), kernelSize, tKernel),
        tSrc,
      );
    default:
      return new Error(`MorphTransform: unsopported operation type ${type}`);
  }
};

var kernel$f = "vec4 operation(float y,float x){vec4 value;if(S==0.0){value=pickValue_tSrc(floor(y/K),floor(x/K));}else{float _y=y/K-0.501;float _x=x/K-0.501;float fy=floor(_y);float fx=floor(_x);float cy=ceil(_y);float cx=ceil(_x);float dcy=cy-_y;float dcx=cx-_x;float dfy=_y-fy;float dfx=_x-fx;value=pickValue_tSrc(fy,fx)*(dcy*dcx)+pickValue_tSrc(cy,fx)*(dfy*dcx)+pickValue_tSrc(cy,cx)*(dfy*dfx)+pickValue_tSrc(fy,cx)*(dcy*dfx);}return value;}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name Upsample
 * @description
 *  Your algoritms or other operations may rely on larger input than you have.
 *  You may use this operation to solve this, or for any other purposes.
 * @example
 *  // this line enlarge an input image in 3x
 *  upsample(inputImage, 3);
 * @param {Tensor} tSrc - The source image to be upsampled.
 * @param {number} coeficient - Upsampling coeficient.
 * @param {number} interpolation - Upsampling support two possible variants of interpolation
 *  'nearest', 'linear'.
 */

var index$j = (tSrc, coeficient = 2, interpolation = 'nearest') => {
  assert$$1(
    interpolation === 'nearest' || interpolation === 'linear',
    'UpsampleOp: Unsupported interpolation type. Currently supported "nearest" and "linear"',
  );

  let t = 0;

  if (interpolation === 'nearest') {
    t = 0;
  } else if (interpolation === 'linear') {
    t = 1;
  }

  return new RegisterOperation('Upsample')
    .Input('tSrc', tSrc.dtype)
    .Output(tSrc.dtype)
    .Constant('K', coeficient)
    .Constant('S', t)
    .SetShapeFn(() => {
      const shape = [~~(tSrc.shape[0] * coeficient), ~~(tSrc.shape[1] * coeficient), 4];

      assert$$1(
        isValidOperationShape$$1(shape),
        'UpsampleOperation: Invalid operation shape',
      );

      return shape;
    })
    .LoadChunk('pickValue')
    .GLSLKernel(kernel$f)
    .Compile({ tSrc });
};

var kernelX = "vec4 operation(float y,float x){vec4 res=pickValue_tSrc(y,x);for(float I=1.0;I<=SAMPLES_PER_PASS;I+=1.0){float cx=x-ceil(pow(1.0+SAMPLES_PER_PASS,PASSI)*I);if(cx<0.0){break;}res+=pickValue_tSrc(y,cx);}return res;}";

var kernelSQXS = "vec4 operation(float y,float x){vec4 res=pickValue_tSrc(y,x);res=res*res;vec4 v=vec4(0.0);for(float I=1.0;I<=SAMPLES_PER_PASS;I+=1.0){float cx=x-ceil(pow(1.0+SAMPLES_PER_PASS,PASSI)*I);if(cx<0.0){break;}v=pickValue_tSrc(y,cx);res+=v*v;}return res;}";

var kernelY = "vec4 operation(float y,float x){vec4 res=pickValue_tSrc(y,x);for(float I=1.0;I<=SAMPLES_PER_PASS;I+=1.0){float cy=y-ceil(pow(1.0+SAMPLES_PER_PASS,PASSI)*I);if(cy<0.0){break;}res+=pickValue_tSrc(cy,x);}return res;}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

const sumOp = (tSrc, c = 'x', passIndex = 0, samplesPerPass = 1) =>
  new RegisterOperation('SummedAreaTable')
    .Input('tSrc', tSrc.dtype)
    .Output('float32')
    .LoadChunk('pickValue')
    .Constant('PASSI', passIndex)
    .Constant('LAST', false)
    .Constant('SAMPLES_PER_PASS', samplesPerPass)
    .GLSLKernel(c === 'x' ? kernelX : kernelY)
    .Compile({ tSrc });

const sqsumOp = (tSrc, passIndex = 0, samplesPerPass = 1) =>
  new RegisterOperation('SquaredSummedAreaTable')
    .Input('tSrc', tSrc.dtype)
    .Output('float32')
    .LoadChunk('pickValue')
    .Constant('PASSI', passIndex)
    .Constant('LAST', false)
    .Constant('SAMPLES_PER_PASS', samplesPerPass)
    .GLSLKernel(kernelSQXS)
    .Compile({ tSrc });


const summedAreaTableBase = (tSrc, passesPerAxis = 2, squared = false) => {
  const samplesPerPassX = Math.ceil(tSrc.shape[1] ** (1 / passesPerAxis));
  const samplesPerPassY = Math.ceil(tSrc.shape[0] ** (1 / passesPerAxis));

  let pipeline = tSrc;
  const lX = Math.log(tSrc.shape[1]) / Math.log(Math.max(samplesPerPassX + 1, 2));
  const lY = Math.log(tSrc.shape[0]) / Math.log(Math.max(samplesPerPassY + 1, 2));

  if (squared) {
    pipeline = sqsumOp(pipeline, 0, Math.min(samplesPerPassX, tSrc.shape[1] - 1));
  }

  for (let i = squared ? 1 : 0; i < lX; i += 1) {
    pipeline = sumOp(pipeline, 'x', i, Math.min(samplesPerPassX, tSrc.shape[1] - 1));
  }

  for (let i = 0; i < lY; i += 1) {
    pipeline = sumOp(pipeline, 'y', i, Math.min(samplesPerPassY, tSrc.shape[0] - 1));
  }

  return pipeline;
};

/**
 * @name SummedAreaTable
 * @description
 *  A summed-area table operation is quickly and efficiently generate
 *  the sum of values in a rectangular subset of a grid.
 *  [More on wiki](https://en.wikipedia.org/wiki/Summed-area_table).
 *
 *  [Interactive Summed-Area Table Generation... (AMD)](http://developer.amd.com/wordpress/media/2012/10/GDC2005_SATEnvironmentReflections.pdf)
 * @example
 *  gm.sat(inputImage);
 * @param {Tensor} tSrc - The source image to be grayscaled.
 * @param {number} [passesPerAxis] - Performance configurator of passes/samplesPerPass
 */
const sat = (tSrc, passesPerAxis = 2) =>
  summedAreaTableBase(tSrc, passesPerAxis, false);

/**
 * @name SquaredSummedAreaTable
 * @description
 *  A squared summed-area table operation is quickly and efficiently generate
 *  the sum of squared values in a rectangular subset of a grid.
 *  [More on wiki](https://en.wikipedia.org/wiki/Summed-area_table).
 *
 *  [Interactive Summed-Area Table Generation... (AMD)](http://developer.amd.com/wordpress/media/2012/10/GDC2005_SATEnvironmentReflections.pdf)
 * @example
 *  gm.sqsat(inputImage);
 * @param {Tensor} tSrc - The source image to be grayscaled.
 * @param {number} [passesPerAxis] - Performance configurator of passes/samplesPerPass
 */
const sqsat = (tSrc, passesPerAxis = 2) =>
  summedAreaTableBase(tSrc, passesPerAxis, true);

var kernel$g = "const int Channel=int(C);float pickValue(float y,float x){if(y<0.0||x<0.0){return 0.0;}return pickValue_tIntegralImage(y,x)[Channel];}vec4 operation(float y,float x){vec4 pixel=pickValue_tSrc(y,x);float huS=uS/2.0;vec2 p1=max(floor(vec2(x,y)-huS),vec2(0.0));vec2 p2=min(floor(vec2(x,y)+huS),OUT_VIEW-1.0);vec2 pd=p2+1.0-p1;float s=pd.x*pd.y;p1-=1.0;float sum=pickValue(p2.y,p2.x)-pickValue(p1.y,p2.x)-pickValue(p2.y,p1.x)+pickValue(p1.y,p1.x);if(pixel[Channel]*s<=sum*(100.0-uT)/100.0){return vec4(0.0,0.0,0.0,1.0);}else{return vec4(1.0,1.0,1.0,1.0);}}";

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @name AdaptiveThreshold
 * @description
 *  Applyes an adaptive threshold to the input image,
 *  threshold will be applied to the given channel.
 *  [Original paper](https://www.researchgate.net/publication/220494200_Adaptive_Thresholding_using_the_Integral_Image)
 * @example
 *  gm.adaptiveThreshold(inputImage);
 * @param {Tensor} tSrc - The source to be thresholded.
 * @param {Tensor} [uS] - Size of the avarange box
 * @param {number} [threshold] - Percent of the diff to mark black
 * @param {number} [channel] - Channel to be applied
 * @param {Tensor|Operation} [tIntegralImage] - summed area table of the input
 */

var index$k = (
  tSrc,
  uS = 5,
  threshold = 50,
  channel = 0,
  tIntegralImage = sat(tSrc),
) => {
  assert$$1(
    typeof threshold === 'number',
    'Only number available as a threshold value.',
  );

  assert$$1(
    typeof uS === 'number',
    'Only number available as a size value.',
  );

  assert$$1(
    channel === 0 || channel === 1 || channel === 2 || channel === 3,
    'Only RGBA available: 0, 1, 2, 3',
  );

  return new RegisterOperation('Threshold')
    .Input('tSrc', tSrc.dtype)
    .Input('tIntegralImage', tIntegralImage.dtype)
    .Output(tSrc.dtype)
    .Constant('C', channel)
    .Uniform('uS', 'float', uS)
    .Uniform('uT', 'float', threshold)
    .LoadChunk('pickValue')
    .GLSLKernel(kernel$g)
    .Compile({ tSrc, tIntegralImage });
};

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

const eps = 0.0000001;

function between(a, b, c) {
  return a - eps <= b && b <= c + eps;
}

class Line {
  static Intersection(l1, l2) {
    const x1 = l1.x1;
    const y1 = l1.y1;
    const x2 = l1.x2;
    const y2 = l1.y2;
    const x3 = l2.x1;
    const y3 = l2.y1;
    const x4 = l2.x2;
    const y4 = l2.y2;

    const x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) /
      ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    const y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) /
      ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));

    if (isNaN(x) || isNaN(y)) {
      return false;
    }

    if (x1 >= x2) {
      if (!between(x2, x, x1)) { return false; }
    } else if (!between(x1, x, x2)) { return false; }

    if (y1 >= y2) {
      if (!between(y2, y, y1)) { return false; }
    } else if (!between(y1, y, y2)) { return false; }

    if (x3 >= x4) {
      if (!between(x4, x, x3)) { return false; }
    } else if (!between(x3, x, x4)) { return false; }

    if (y3 >= y4) {
      if (!between(y4, y, y3)) { return false; }
    } else if (!between(y3, y, y4)) { return false; }

    return [x, y];
  }
  /**
   * @param {ArrayBuffer|Array|number} [a] - Source buffer to link, array to create from, or x value
   * @param {number} [b] - buffer's offset or y value
   */
  constructor(a, b, c, d, x, y) {
    if (a instanceof ArrayBuffer) {
      this.data = new Float32Array(a, b, 8);
    } else if (Array.isArray(a)) {
      if (a.length < 8) {
        for (let i = a.length; i <= 8; i += 1) {
          a.push(0);
        }
      }
      this.data = new Float32Array(a);
    } else if (a !== undefined && b !== undefined) {
      this.data = new Float32Array([a, b, c, d, x, y, 0, 0]);
    } else {
      this.data = new Float32Array(8);
    }
  }

  set(a, b, c, d, x, y) {
    this.data[0] = a;
    this.data[1] = b;
    this.data[2] = c;
    this.data[3] = d;
    this.data[4] = x;
    this.data[5] = y;
    this.data[6] = 0;
    this.data[7] = 0;
  }

  fromParallelCoords(x, y, w, h, maxDistance, maxAngles) {
    const x1 = 0;
    const x2 = w;
    let y1;
    let y2;

    if (x > maxAngles) {
      x -= maxAngles; // eslint-disable-line

      y1 = maxDistance - (maxAngles * y / x);
      y2 = (-1 + maxAngles / x) * w + y1;
    } else {
      x = maxAngles - x; // eslint-disable-line

      y1 = (maxAngles * y / x);
      y2 = (1 - maxAngles / x) * w + y1;
    }

    this.set(x1, y1, x2, y2, x, y);
  }

  get length() {
    if (this.data[6]) {
      return this.data[6];
    }

    const dx = this.data[2] - this.data[0];
    const dy = this.data[3] - this.data[1];
    const length = Math.sqrt(dx ** 2 + dy ** 2);

    this.data[6] = length;

    return length;
  }

  get angle() {
    if (this.data[7]) {
      return this.data[7];
    }
    const dx = this.data[2] - this.data[0];
    const dy = this.data[3] - this.data[1];
    let angle = (Math.atan(dy / dx)) / Math.PI * 180;

    if (angle < 0) {
      angle = 180 + angle;
    }

    this.data[7] = angle;

    return angle;
  }

  get x1() {
    return this.data[0];
  }

  get y1() {
    return this.data[1];
  }

  get x2() {
    return this.data[2];
  }

  get y2() {
    return this.data[3];
  }

  get px() {
    return this.data[4];
  }

  get py() {
    return this.data[5];
  }

  set x1(v) {
    this.data[0] = v;
  }

  set y1(v) {
    this.data[1] = v;
  }

  set x2(v) {
    this.data[2] = v;
  }

  set y2(v) {
    this.data[3] = v;
  }

  set px(v) {
    this.data[4] = v;
  }

  set py(v) {
    this.data[5] = v;
  }

  clear() {
    this.data[0] = 0;
    this.data[1] = 0;
    this.data[2] = 0;
    this.data[3] = 0;
    this.data[4] = 0;
    this.data[5] = 0;
    this.data[6] = 0;
    this.data[7] = 0;
  }

  fromArray(arr) {
    this.data.set(arr);
  }

  toArray() {
    return Array.prototype.slice.call(this.data);
  }
}

Line.BYTES_PER_ELEMENT = 36;

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

function sortPoints(points, canvas) { // eslint-disable-line
  // How it works?
  const center = [0, 0];
  let A = null;
  let B = null;
  let C = null;
  let D = null;

  center[0] += points[0][0];
  center[0] += points[1][0];
  center[0] += points[2][0];
  center[0] += points[3][0];
  center[1] += points[0][1];
  center[1] += points[1][1];
  center[1] += points[2][1];
  center[1] += points[3][1];

  center[0] /= 4;
  center[1] /= 4;

  for (let i = 0; i < points.length; i += 1) {
    if (points[i][0] >= center[0] && points[i][1] >= center[1]) {
      C = points[i];
    }

    if (points[i][0] <= center[0] && points[i][1] <= center[1]) {
      A = points[i];
    }

    if (points[i][0] >= center[0] && points[i][1] <= center[1]) {
      B = points[i];
    }

    if (points[i][0] <= center[0] && points[i][1] >= center[1]) {
      D = points[i];
    }
  }

  return [A, B, C, D];
}

function angleBetweenLines(line1, line2) {
  const dx1 = line1[2] - line1[0];
  const dy1 = line1[3] - line1[1];
  const dx2 = line2[2] - line2[0];
  const dy2 = line2[3] - line2[1];

  const d = dx1 * dx2 + dy1 * dy2;
  const l2 = (dx1 * dx1 + dy1 * dy1) * (dx2 * dx2 + dy2 * dy2);

  return Math.acos(d / Math.sqrt(l2));
}

function transfromPoint(px, py, transformation) {
  const m = transformation;
  let xs = 0.0;
  let ys = 0.0;
  let xs0 = 0.0;
  let ys0 = 0.0;
  let ws = 0.0;
  let sc = 0.0;

  xs0 = m.get(0, 1) * py + m.get(0, 2);
  ys0 = m.get(1, 1) * py + m.get(1, 2);
  ws = m.get(2, 1) * py + m.get(2, 2);

  xs0 += m.get(0, 0) * px;
  ys0 += m.get(1, 0) * px;
  ws += m.get(2, 0) * px;


  sc = 1.0 / ws;
  xs = xs0 * sc;
  ys = ys0 * sc;

  return [xs, ys];
}

/* eslint-disable */

/**
 * Fill transformMatrix with transformation values for fixing rect's perspective to be full viewed in view bounds.
 * @param {Rect} rect
 * @param {Array} dstBounds
 * @param {Tensor} transformMatrix
 */

function generateTransformMatrix(rect, dstBounds, transformMatrix, pad = 0) {
  perspective_4point_transform(
    transformMatrix,
    pad, pad, rect.ax, rect.ay,
    dstBounds[1] - pad, pad, rect.bx, rect.by,
    dstBounds[1] - pad, dstBounds[0] - pad, rect.cx, rect.cy,
    pad, dstBounds[0] - pad, rect.dx, rect.dy,
    transformMatrix.shape.length === 3 && transformMatrix.shape[2] === 4,
  );

  return transformMatrix;
}

/**
 * Get perspective transformation matrix
 * @param {Tensor} dst
 * @param src_x0
 * @param src_y0
 * @param dst_x0
 * @param dst_y0
 * @param src_x1
 * @param src_y1
 * @param dst_x1
 * @param dst_y1
 * @param src_x2
 * @param src_y2
 * @param dst_x2
 * @param dst_y2
 * @param src_x3
 * @param src_y3
 * @param dst_x3
 * @param dst_y3
 */
function perspective_4point_transform(
  dst, src_x0, src_y0, dst_x0, dst_y0,
  src_x1, src_y1, dst_x1, dst_y1,
  src_x2, src_y2, dst_x2, dst_y2,
  src_x3, src_y3, dst_x3, dst_y3,
  nd4 = false // if we should apply for 4d based vector.
) {
  let t1 = src_x0;
  let t2 = src_x2;
  let t4 = src_y1;
  let t5 = t1 * t2 * t4;
  let t6 = src_y3;
  let t7 = t1 * t6;
  let t8 = t2 * t7;
  let t9 = src_y2;
  let t10 = t1 * t9;
  let t11 = src_x1;
  let t14 = src_y0;
  let t15 = src_x3;
  let t16 = t14 * t15;
  let t18 = t16 * t11;
  let t20 = t15 * t11 * t9;
  let t21 = t15 * t4;
  let t24 = t15 * t9;
  let t25 = t2 * t4;
  let t26 = t6 * t2;
  let t27 = t6 * t11;
  let t28 = t9 * t11;
  let t30 = 1.0 / (t21 - t24 - t25 + t26 - t27 + t28);
  let t32 = t1 * t15;
  let t35 = t14 * t11;
  let t41 = t4 * t1;
  let t42 = t6 * t41;
  let t43 = t14 * t2;
  let t46 = t16 * t9;
  let t48 = t14 * t9 * t11;
  let t51 = t4 * t6 * t2;
  let t55 = t6 * t14;
  const Hr0 = -(t8 - t5 + t10 * t11 - t11 * t7 - t16 * t2 + t18 - t20 + t21 * t2) * t30;
  const Hr1 = (t5 - t8 - t32 * t4 + t32 * t9 + t18 - t2 * t35 + t27 * t2 - t20) * t30;
  const Hr2 = t1;
  const Hr3 = (-t9 * t7 + t42 + t43 * t4 - t16 * t4 + t46 - t48 + t27 * t9 - t51) * t30;
  const Hr4 = (-t42 + t41 * t9 - t55 * t2 + t46 - t48 + t55 * t11 + t51 - t21 * t9) * t30;
  const Hr5 = t14;
  const Hr6 = (-t10 + t41 + t43 - t35 + t24 - t21 - t26 + t27) * t30;
  const Hr7 = (-t7 + t10 + t16 - t43 + t27 - t28 - t21 + t25) * t30;

  t1 = dst_x0;
  t2 = dst_x2;
  t4 = dst_y1;
  t5 = t1 * t2 * t4;
  t6 = dst_y3;
  t7 = t1 * t6;
  t8 = t2 * t7;
  t9 = dst_y2;
  t10 = t1 * t9;
  t11 = dst_x1;
  t14 = dst_y0;
  t15 = dst_x3;
  t16 = t14 * t15;
  t18 = t16 * t11;
  t20 = t15 * t11 * t9;
  t21 = t15 * t4;
  t24 = t15 * t9;
  t25 = t2 * t4;
  t26 = t6 * t2;
  t27 = t6 * t11;
  t28 = t9 * t11;
  t30 = 1.0 / (t21 - t24 - t25 + t26 - t27 + t28);
  t32 = t1 * t15;
  t35 = t14 * t11;
  t41 = t4 * t1;
  t42 = t6 * t41;
  t43 = t14 * t2;
  t46 = t16 * t9;
  t48 = t14 * t9 * t11;
  t51 = t4 * t6 * t2;
  t55 = t6 * t14;
  const Hl0 = -(t8 - t5 + t10 * t11 - t11 * t7 - t16 * t2 + t18 - t20 + t21 * t2) * t30;
  const Hl1 = (t5 - t8 - t32 * t4 + t32 * t9 + t18 - t2 * t35 + t27 * t2 - t20) * t30;
  const Hl2 = t1;
  const Hl3 = (-t9 * t7 + t42 + t43 * t4 - t16 * t4 + t46 - t48 + t27 * t9 - t51) * t30;
  const Hl4 = (-t42 + t41 * t9 - t55 * t2 + t46 - t48 + t55 * t11 + t51 - t21 * t9) * t30;
  const Hl5 = t14;
  const Hl6 = (-t10 + t41 + t43 - t35 + t24 - t21 - t26 + t27) * t30;
  const Hl7 = (-t7 + t10 + t16 - t43 + t27 - t28 - t21 + t25) * t30;

  // the following code computes R = Hl * inverse Hr
  t2 = Hr4 - Hr7 * Hr5;
  t4 = Hr0 * Hr4;
  t5 = Hr0 * Hr5;
  t7 = Hr3 * Hr1;
  t8 = Hr2 * Hr3;
  t10 = Hr1 * Hr6;
  const t12 = Hr2 * Hr6;
  t15 = 1.0 / (t4 - t5 * Hr7 - t7 + t8 * Hr7 + t10 * Hr5 - t12 * Hr4);
  t18 = -Hr3 + Hr5 * Hr6;
  const t23 = -Hr3 * Hr7 + Hr4 * Hr6;
  t28 = -Hr1 + Hr2 * Hr7;
  const t31 = Hr0 - t12;
  t35 = Hr0 * Hr7 - t10;
  t41 = -Hr1 * Hr5 + Hr2 * Hr4;
  const t44 = t5 - t8;
  const t47 = t4 - t7;
  t48 = t2 * t15;
  const t49 = t28 * t15;
  const t50 = t41 * t15;
  const mat = dst.data;

  if (nd4) {
    mat[0] = Hl0 * t48 + Hl1 * (t18 * t15) - Hl2 * (t23 * t15);
    mat[1] = Hl0 * t49 + Hl1 * (t31 * t15) - Hl2 * (t35 * t15);
    mat[2] = -Hl0 * t50 - Hl1 * (t44 * t15) + Hl2 * (t47 * t15);
    mat[4] = Hl3 * t48 + Hl4 * (t18 * t15) - Hl5 * (t23 * t15);
    mat[5] = Hl3 * t49 + Hl4 * (t31 * t15) - Hl5 * (t35 * t15);
    mat[6] = -Hl3 * t50 - Hl4 * (t44 * t15) + Hl5 * (t47 * t15);
    mat[8] = Hl6 * t48 + Hl7 * (t18 * t15) - t23 * t15;
    mat[9] = Hl6 * t49 + Hl7 * (t31 * t15) - t35 * t15;
    mat[10] = -Hl6 * t50 - Hl7 * (t44 * t15) + t47 * t15;
  } else {
    mat[0] = Hl0 * t48 + Hl1 * (t18 * t15) - Hl2 * (t23 * t15);
    mat[1] = Hl0 * t49 + Hl1 * (t31 * t15) - Hl2 * (t35 * t15);
    mat[2] = -Hl0 * t50 - Hl1 * (t44 * t15) + Hl2 * (t47 * t15);
    mat[3] = Hl3 * t48 + Hl4 * (t18 * t15) - Hl5 * (t23 * t15);
    mat[4] = Hl3 * t49 + Hl4 * (t31 * t15) - Hl5 * (t35 * t15);
    mat[5] = -Hl3 * t50 - Hl4 * (t44 * t15) + Hl5 * (t47 * t15);
    mat[6] = Hl6 * t48 + Hl7 * (t18 * t15) - t23 * t15;
    mat[7] = Hl6 * t49 + Hl7 * (t31 * t15) - t35 * t15;
    mat[8] = -Hl6 * t50 - Hl7 * (t44 * t15) + t47 * t15;
  }
}

function calcIntegralSum(img, x, y, w, h) {
  const yb = (y - 1) * img.stride[0];
  const yhb = (y + h) * img.stride[0];
  const xb = (x - 1) * 4;
  const xwb = (x + w) * 4;

  const a = img.data[yhb + xwb];
  const b = y > 0 ? img.data[yb + xwb] : 0;
  const c = x > 0 ? img.data[yhb + xb] : 0;
  const d = (y > 0 && x > 0) ? img.data[yb + xb] : 0;

  return (a - b - c) + d;
}

function calcHAARFeature(img, feature, size, dx, dy, dStep) {
  let sum = 0;
  const sizeK = size / dStep;

  for (let i = 0; i < feature.length; i += 1) {
    sum += calcIntegralSum(img,
      ~~(feature[i][0] * sizeK) + dx,
      ~~(feature[i][1] * sizeK) + dy,
      ~~(feature[i][2] * sizeK) - 1,
      ~~(feature[i][3] * sizeK) - 1,
    ) * feature[i][4];
  }

  return sum;
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * Rect data has the next view:
 * 0: A.x
 * 1: A.y
 * 2: B.x
 * 3: B.y
 * 4: C.x
 * 5: C.y
 * 6: D.x
 * 7: D.y
 *
 * Where:
 * A------B
 * |      |
 * D------C
 */
class Rect {
  static Distance(r1, r2) {
    let distance = 0;

    for (let i = 0; i < 8; i += 2) {
      const vecLength = Math.sqrt((r1.data[i] - r2.data[i]) ** 2
        + (r1.data[i + 1] - r2.data[i + 1]) ** 2);

      distance += vecLength ** 2;
    }

    distance = Math.sqrt(distance / 8);

    return distance === Infinity ? 0 : distance;
  }

  /**
   * Helper method to calculate triangle area from 3 points
   * @param {number} ax
   * @param {number} ay
   * @param {number} bx
   * @param {number} by
   * @param {number} cx
   * @param {number} cy
   * @returns {number} Area
   */
  static TriangleS(ax, ay, bx, by, cx, cy) {
    return Math.abs(ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) / 2;
  }

  /**
   * @param {ArrayBuffer|Array|number} [a] - Source buffer to link, array to create from, or x value
   * @param {number} [b] - buffer's offset or y value
   */
  constructor(...args) {
    if (args[0] instanceof ArrayBuffer) {
      this.data = new Float32Array(args[0], args[1], Rect.NUM_ELEMENTS);
    } else if (Array.isArray(args[0])) {
      this.data = new Float32Array(args[0]);
    } else if (args[0] && args.length === Rect.NUM_ELEMENTS) {
      this.data = new Float32Array(args);
    } else {
      this.data = new Float32Array(Rect.NUM_ELEMENTS);
    }
  }

  /**
   * Define if point with given coordinates is inside rectangle.
   * @param {number} x
   * @param {number} y
   * @returns {boolean} Is insinde rect
   */
  isInRect(x, y) {
    const s1 = Rect.TriangleS(x, y, this.ax, this.ay, this.bx, this.by);
    const s2 = Rect.TriangleS(x, y, this.cx, this.cy, this.bx, this.by);
    const s3 = Rect.TriangleS(this.cx, this.cy, x, y, this.dx, this.dy);
    const s4 = Rect.TriangleS(this.dx, this.dy, x, y, this.ax, this.ay);

    if ((s1 + s2 + s3 + s4) - this.area > 0) {
      return false;
    }

    return true;
  }

  isNotEmpty() {
    if (
      this.data[0] > 0 &&
      this.data[1] > 0 &&
      this.data[2] > 0 &&
      this.data[3] > 0 &&
      this.data[4] > 0 &&
      this.data[5] > 0 &&
      this.data[6] > 0 &&
      this.data[7] > 0
    ) {
      return true;
    }

    return false;
  }

  clone() {
    return new Rect(this.toArray());
  }

  set(ax, ay, bx, by, cx, cy, dx, dy) {
    this.data[0] = ax;
    this.data[1] = ay;
    this.data[2] = bx;
    this.data[3] = by;
    this.data[4] = cx;
    this.data[5] = cy;
    this.data[6] = dx;
    this.data[7] = dy;
  }

  assign(rect) {
    this.data.set(rect.data);

    return this;
  }

  scale(x, y) {
    this.data[0] *= x;
    this.data[1] *= y;
    this.data[2] *= x;
    this.data[3] *= y;
    this.data[4] *= x;
    this.data[5] *= y;
    this.data[6] *= x;
    this.data[7] *= y;

    return this;
  }

  fromLines(l1, l2, l3, l4) {
    const sorted = sortPoints([
      Line.Intersection(l1, l2),
      Line.Intersection(l2, l3),
      Line.Intersection(l3, l4),
      Line.Intersection(l4, l1),
    ]);

    if (
      !sorted[0] ||
      !sorted[1] ||
      !sorted[2] ||
      !sorted[3]
    ) {
      return false;
    }

    this.data[0] = sorted[0][0];
    this.data[1] = sorted[0][1];
    this.data[2] = sorted[1][0];
    this.data[3] = sorted[1][1];
    this.data[4] = sorted[2][0];
    this.data[5] = sorted[2][1];
    this.data[6] = sorted[3][0];
    this.data[7] = sorted[3][1];

    return true;
  }

  get ax() {
    return this.data[0];
  }

  get ay() {
    return this.data[1];
  }

  get bx() {
    return this.data[2];
  }

  get by() {
    return this.data[3];
  }

  get cx() {
    return this.data[4];
  }

  get cy() {
    return this.data[5];
  }

  get dx() {
    return this.data[6];
  }

  get dy() {
    return this.data[7];
  }

  set ax(v) {
    this.data[0] = v;
  }

  set ay(v) {
    this.data[1] = v;
  }

  set bx(v) {
    this.data[2] = v;
  }

  set by(v) {
    this.data[3] = v;
  }

  set cx(v) {
    this.data[4] = v;
  }

  set cy(v) {
    this.data[5] = v;
  }

  set dx(v) {
    this.data[6] = v;
  }

  set dy(v) {
    this.data[7] = v;
  }

  get distA() {
    return Math.sqrt((this.data[6] - this.data[0]) ** 2 + (this.data[7] - this.data[1]) ** 2);
  }

  get distB() {
    return Math.sqrt((this.data[4] - this.data[2]) ** 2 + (this.data[5] - this.data[3]) ** 2);
  }

  get distC() {
    return Math.sqrt((this.data[0] - this.data[2]) ** 2 + (this.data[1] - this.data[3]) ** 2);
  }

  get distD() {
    return Math.sqrt((this.data[6] - this.data[4]) ** 2 + (this.data[7] - this.data[5]) ** 2);
  }

  get distE() {
    return Math.sqrt((this.data[0] - this.data[4]) ** 2 + (this.data[1] - this.data[5]) ** 2);
  }

  get distF() {
    return Math.sqrt((this.data[6] - this.data[2]) ** 2 + (this.data[7] - this.data[3]) ** 2);
  }

  get angleA() {
    return angleBetweenLines(
      [this.data[6], this.data[7], this.data[0], this.data[1]],
      [this.data[0], this.data[1], this.data[2], this.data[3]],
    );
  }

  get angleB() {
    return angleBetweenLines(
      [this.data[0], this.data[1], this.data[2], this.data[3]],
      [this.data[2], this.data[3], this.data[4], this.data[5]],
    );
  }

  get angleC() {
    return angleBetweenLines(
      [this.data[2], this.data[3], this.data[4], this.data[5]],
      [this.data[4], this.data[5], this.data[6], this.data[7]],
    );
  }

  get angleD() {
    return angleBetweenLines(
      [this.data[4], this.data[5], this.data[6], this.data[7]],
      [this.data[6], this.data[7], this.data[0], this.data[1]],
    );
  }

  get area() {
    const A = this.distA;
    const B = this.distB;
    const C = this.distC;
    const D = this.distD;
    const p = (A + B + C + D) / 2;

    return Math.sqrt((p - A) * (p - B) * (p - C) * (p - D));
  }

  get P() {
    return this.distA + this.distB + this.distC + this.distD;
  }

  mul(num) {
    this.data[0] *= num;
    this.data[1] *= num;
    this.data[2] *= num;
    this.data[3] *= num;
    this.data[4] *= num;
    this.data[5] *= num;
    this.data[6] *= num;
    this.data[7] *= num;

    return this;
  }

  scaleAt(num) {
    this.data[0] -= num;
    this.data[1] -= num;
    this.data[2] -= num;
    this.data[3] += num;
    this.data[4] += num;
    this.data[5] += num;
    this.data[6] += num;
    this.data[7] -= num;

    return this;
  }

  clear() {
    this.data[0] = 0;
    this.data[1] = 0;
    this.data[2] = 0;
    this.data[3] = 0;
    this.data[4] = 0;
    this.data[5] = 0;
    this.data[6] = 0;
    this.data[7] = 0;
  }

  fromDeep(arr) {
    this.data[0] = arr[0][0];
    this.data[1] = arr[0][1];
    this.data[2] = arr[1][0];
    this.data[3] = arr[1][1];
    this.data[4] = arr[2][0];
    this.data[5] = arr[2][1];
    this.data[6] = arr[3][0];
    this.data[7] = arr[3][1];

    return this;
  }

  perspective(matrix) {
    const p1 = transfromPoint(this.data[0], this.data[1], matrix);
    const p2 = transfromPoint(this.data[2], this.data[3], matrix);
    const p3 = transfromPoint(this.data[4], this.data[5], matrix);
    const p4 = transfromPoint(this.data[6], this.data[7], matrix);

    this.data[0] = p1[0];
    this.data[1] = p1[1];
    this.data[2] = p2[0];
    this.data[3] = p2[1];
    this.data[4] = p3[0];
    this.data[5] = p3[1];
    this.data[6] = p4[0];
    this.data[7] = p4[1];

    return this;
  }

  fromArray(arr) {
    this.data.set(arr);

    return this;
  }

  toArray() {
    return Array.prototype.slice.call(this.data);
  }

  isInside(rect) {
    return (
      rect.ax > this.ax
      && rect.ay > this.ay
      && rect.bx < this.bx
      && rect.by > this.by
      && rect.cx < this.cx
      && rect.cy < this.cy
      && rect.dx > this.dx
      && rect.dy < this.dy
    );
  }

  toJSON() {
    return this.toArray();
  }
}

Rect.NUM_ELEMENTS = 8;
Rect.BYTES_PER_ELEMENT = Rect.NUM_ELEMENTS * Float32Array.BYTES_PER_ELEMENT;

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

class TypedPool {
  constructor(Type, poolSize) {
    this.dataStore = new ArrayBuffer(poolSize * Type.BYTES_PER_ELEMENT);
    this.data = new Array(poolSize);
    this.size = poolSize;

    for (let i = 0; i < poolSize; i += 1) {
      this.data[i] = new Type(this.dataStore, i * Type.BYTES_PER_ELEMENT);
    }

    this.length = 0;
  }

  map(cb, ctx) {
    return this.data.map(cb, ctx);
  }

  push(type) {
    if (this.length < this.size) {
      this.data[this.length].data.set(type.data);
      this.length += 1;
    } else {
      throw new Error('Typed Pool size exceed');
    }
  }

  at(i) {
    if (i >= this.size) {
      throw new Error('Out of range requested');
    }

    return this.data[i];
  }

  release(clear) {
    this.length = 0;

    if (clear) {
      for (let i = 0; i < this.size; i += 1) {
        this.data[i].clear();
      }
    }
  }
}

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

/**
 * @license MIT
 * @author Arkadiy Pilguk(apilguk@gmail.com)
 * @author Mihail Zachepilo(mihailzachepilo@gmail.com)
 * Copyright 2018 Peculiar Ventures and Pentatonica.
 * All rights reserved.
 */

export { Session, GPUTexture as GLTexture, RegisterOperation, Tensor, Operation, initDrawable, initMouseTracking, toImageData, getImageData, putImageData, canvasFromTensor, canvasToTensor, canvasDrawLine, canvasDrawCircle, canvasFillCircle, clearCanvas, canvasDrawRect, canvasFill, canvasClear, canvasInit, canvasCreate, imageTensorFromURL, CaptureVideo, assert$$1 as assert, assertShapesAreEqual$$1 as assertShapesAreEqual, isValidShape$$1 as isValidShape, isOperation$$1 as isOperation, isTensor$$1 as isTensor, isValidGLSLChunk$$1 as isValidGLSLChunk, isValidGLSLVariableName$$1 as isValidGLSLVariableName, isValidOperationShape$$1 as isValidOperationShape, DeprecationError$$1 as DeprecationError, deprecationWarning$$1 as deprecationWarning, deprecationError$$1 as deprecationError, index as grayscale, index$1 as gaussianBlur, index$2 as downsample, index$3 as sobelOperator, index$4 as hog, index$5 as cast, index$6 as cannyEdges, index$7 as colorSegmentation, meanStdOp as meanStd, histogramOp as histogram, minMaxOp as minMax, index$8 as motionDetect, index$9 as skinTest, slidingWindowOp as slidingWindow, index$a as swt, index$b as concat, index$c as norm, index$d as histogramEqualization, index$e as perspectiveProjection, index$f as pcLines, pcLinesEnhance, pcLinesReduceMax, pcLinesTransform, index$g as HSVColor, index$h as threshold, Convolutiion as conv2d, kernels, erode, dilate, index$i as morphologyEx, index$j as upsample, sat, sqsat, index$k as adaptiveThreshold, sub, div, mult, add, subScalar, divScalar, multScalar, addScalar, range, tensorFrom, tensorClone, tensorInvert, tensorAssertEqual, tensorAssertCloseEqual, tensorAssertMSEEqual, flipTensor, invertTensor, tensorMap, tensorOnes, tensorFromFlat, Line, Rect, TypedPool, calcHAARFeature, calcIntegralSum, generateTransformMatrix };
