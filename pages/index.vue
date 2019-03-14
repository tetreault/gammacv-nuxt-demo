<template>
  <section 
    ref="section" 
    class="section">
    <div class="hero is-fullheight">
      <div class="hero-body">
        <!-- <img 
          ref="imgTest" 
        src="~/assets/test.png">-->
        <canvas 
          ref="normalCanvasEl" 
          width="400" 
          height="300"/>
        <canvas 
          ref="modifiedCanvasEl" 
          width="400" 
          height="300"/>
        <video 
          id="video" 
          ref="userMediaVideo" 
          autoplay 
          playsinline 
          muted/>
      </div>
      <div class="has-text-centered hero-foot">
        <br>
        <a 
          href="#" 
          class="button start-btn" 
          @click.prevent="startCam">Start Scan</a>
      </div>
    </div>
  </section>
</template>

<script>
// NOTE:
// 1) need to load gammacv plugin this way (see file: ~/plugins/gammacv),
//    otherwise it has wrong context and throws "Document is not defined" error
let gm;
if (process.browser) {
  gm = require("gammacv");
}

export default {
  data() {
    return {
      currFrameTensor: undefined,
      prevFrameTensor: undefined,
      outputTensor: undefined,
      modifiedCanvas: undefined,
      stream: undefined,
      session: undefined,
      operation: undefined
    };
  },
  mounted() {
    this.modifiedCanvas = this.$refs.modifiedCanvasEl;
    this.modifiedCanvas.width = this.modifiedCanvas.clientWidth;
    this.modifiedCanvas.height = this.modifiedCanvas.clientHeight;

    // create the tensors with the dimensions of the canvas the output will go to
    this.currFrameTensor = new gm.Tensor("uint8", [
      this.modifiedCanvas.clientHeight,
      this.modifiedCanvas.clientWidth,
      4
    ]);

    this.prevFrameTensor = new gm.Tensor("uint8", [
      this.modifiedCanvas.clientHeight,
      this.modifiedCanvas.clientWidth,
      4
    ]);
  },
  methods: {
    startCam() {
      console.log(this.currFrameTensor, this.prevFrameTensor);

      /*
       * NOTE: RELEVANT FILES
       *   - pixelwise_math: https://github.com/PeculiarVentures/GammaCV/blob/e287f92286da09748489805ebb7fceb48018c1ef/app/src/examples/math_pixelwise.js
       *   - https://github.com/PeculiarVentures/GammaCV/blob/e287f92286da09748489805ebb7fceb48018c1ef/app/src/containers/example/example_container.jsx
       */
      // gammacv
      this.session = new gm.Session();
      this.stream = new gm.CaptureVideo(
        this.modifiedCanvas.clientWidth,
        this.modifiedCanvas.clientHeight
      );
      this.frameIndex = 0;
      this.operation = gm.sub(this.currFrameTensor, this.prevFrameTensor);

      // start video from CaptureVideo() and run RAF loop
      this.stream
        .start()
        .then(() => {
          this.outputTensor = gm.tensorFrom(this.operation);
          this.session.init(this.operation);
          this.stream.getImageBuffer(this.currFrameTensor);
          this.updateVideoCanvas();
        })
        .catch(() => {
          this.stop(true);
        });
    },
    updateVideoCanvas() {
      gm.clearCanvas(this.modifiedCanvas);
      gm.tensorClone(this.currFrameTensor, this.prevFrameTensor);
      this.stream.getImageBuffer(this.currFrameTensor);
      this.session.runOp(
        this.operation,
        this.frameIndex += 1,
        this.outputTensor
      );

      gm.canvasFromTensor(this.modifiedCanvas, this.outputTensor);

      // RAF loop
      requestAnimationFrame(this.updateVideoCanvas);
    }
  }
};
</script>

<style>
section,
.hero {
  padding: 0 !important;
}

.hero-body {
  align-items: center;
  justify-content: center;
  flex-direction: row;
}

video {
  background: black;
  width: 130px;
  height: 100px;
  position: absolute;
  top: 10px;
  right: 10px;
  margin: auto;
}

canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  margin: 0px;
}

a.button {
  margin-bottom: 25px;
}
</style>
