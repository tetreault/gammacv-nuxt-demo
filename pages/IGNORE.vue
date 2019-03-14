<template>
  <section class="section">
    <div class="hero is-fullheight">
      <div class="hero-head">
        <h1 class="has-text-centered title is-spaced">Pizza Joint</h1>
        <h3 class="subtitle has-text-centered">Put face close to screen</h3>
      </div>
      <div class="hero-body">
        <video 
          id="video" 
          ref="userMediaVideo" 
          autoplay 
          playsinline 
          muted/>
        <canvas 
          id="canvas" 
          ref="canvasEl" 
          width="400" 
          height="300"/>
        <a 
          href="#" 
          class="button start-btn" 
          @click.prevent="startCam">Start Scan</a>
        <p>
          Red level:
          <span ref="rednessLevel">0</span>
        </p>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      colorDeltaArray: []
    };
  },
  methods: {
    startCam() {
      const video = this.$refs.userMediaVideo;
      const canvas = this.$refs.canvasEl;
      const context = canvas.getContext("2d");
      const constraints = (window.constraints = {
        audio: false,
        video: { facingMode: "user" }
      });
      let eyePositionOld;
      let detector;

      // get the webcam feed
      try {
        navigator.mediaDevices
          .getUserMedia(constraints)
          .then(stream => {
            video.srcObject = stream;

            this.updateVideoCanvas(
              eyePositionOld,
              detector,
              context,
              video,
              canvas
            );
          })
          .catch(e => {
            alert(e);
          });
      } catch (e) {
        alert(e);
      }
    },
    updateVideoCanvas(eyePositionOld, detector, context, video, canvas) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // run objectdetect library to track eyes
      this.runDetector(video, context, detector, eyePositionOld);

      // RAF loop
      requestAnimationFrame(() => {
        this.updateVideoCanvas(
          eyePositionOld,
          detector,
          context,
          video,
          canvas
        );
      });
    },
    drawFoundEyeRegion(context, coord, video) {
      /* Draw eye coordinates on canvas */
      context.beginPath();
      context.lineWidth = "2";
      context.fillStyle = "rgba(255, 0, 0, 0.5)";
      context.fillRect(
        (coord[0] / video.videoWidth) * canvas.clientWidth,
        (coord[1] / video.videoHeight) * canvas.clientHeight,
        (coord[2] / video.videoWidth) * canvas.clientWidth,
        (coord[3] / video.videoHeight) * canvas.clientHeight
      );
      context.stroke();
    },
    runDetector(video, context, detector, eyePositionOld) {
      // Prepare the detector
      if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
        if (!detector) {
          const width = 200;
          const height = 250;
          detector = new objectdetect.detector(
            width,
            height,
            4,
            objectdetect.eye
          );
        }

        // run detection on the video frame
        let coords = detector.detect(video, 1);

        if (coords[0]) {
          // NOTE: if we're in here then we've detected eyes
          let coord = coords[0];

          //console.log(coord);

          // Rescale coordinates from detector to video coordinate space
          coord[0] *= video.videoWidth / detector.canvas.width;
          coord[1] *= video.videoHeight / detector.canvas.height;
          coord[2] *= video.videoWidth / detector.canvas.width;
          coord[3] *= video.videoHeight / detector.canvas.height;

          // draw the eyes on the canvas
          this.drawFoundEyeRegion(context, coord, video);

          // run all the color processes
          setInterval(() => {
            this.colorProcess(context, canvas, coord, video);
          }, 3000);

          // Find coordinates with maximum confidence
          for (let i = coords.length - 1; i >= 0; --i) {
            if (coords[i][4] > coord[4]) {
              coord = coords[i];
            }
          }
        } else {
          eyePositionOld = null;
        }
      }
    },
    colorProcess(context, canvas, coord, video) {
      // get image data from found eye region to use for color averaging
      const imgData = context.getImageData(
        (coord[0] / video.videoWidth) * canvas.clientWidth,
        (coord[1] / video.videoHeight) * canvas.clientHeight,
        (coord[2] / video.videoWidth) * canvas.clientWidth,
        (coord[3] / video.videoHeight) * canvas.clientHeight
      ).data;

      const imgDataLength = imgData.length;

      // average colors from videoCanvas with found eye regions from trackingjs
      console.log(this.colorDeltaArray);
      this.colorAverageInRegion(imgData, imgDataLength, this.colorDeltaArray);
    },
    rgb2lab(rgb) {
      // convert RGB color to LAB color to derive delta-E (aka perceived color difference)
      // reference: https://github.com/antimatter15/rgb-lab/blob/master/color.js
      let r = rgb[0] / 255;
      let g = rgb[1] / 255;
      let b = rgb[2] / 255;
      let x;
      let y;
      let z;

      r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
      g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
      b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

      x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
      y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
      z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

      x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
      y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
      z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

      return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
    },
    deltaE(labA) {
      // calculate the perceptual distance between colors in CIELAB
      // reference: https://github.com/antimatter15/rgb-lab/blob/master/color.js
      // reference: https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Comparisons/Cie94Comparison.cs
      const labB = [53.23, 80.11, 67.22]; // NOTE: We only care about comparing to the color red so default labB to red
      let deltaL = labA[0] - labB[0];
      let deltaA = labA[1] - labB[1];
      let deltaB = labA[2] - labB[2];
      let c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
      let c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
      let deltaC = c1 - c2;
      let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
      deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
      let sc = 1.0 + 0.045 * c1;
      let sh = 1.0 + 0.015 * c1;
      let deltaLKlsl = deltaL / 1.0;
      let deltaCkcsc = deltaC / sc;
      let deltaHkhsh = deltaH / sh;
      let i =
        deltaLKlsl * deltaLKlsl +
        deltaCkcsc * deltaCkcsc +
        deltaHkhsh * deltaHkhsh;
      return i < 0 ? 0 : Math.sqrt(i);
    },
    colorAverageInRegion(imgData, imgDataLength, colorDeltaArray) {
      // color averaging function
      // reference: https://stackoverflow.com/a/44557266/873177
      const pixelsPerChannel = imgDataLength / 4;
      let R = 0;
      let G = 0;
      let B = 0;
      let A = 0;

      for (let i = 0; i < imgDataLength; i += 4) {
        // A single pixel (R, G, B, A) will take 4 positions in the flattened array:
        R += imgData[i];
        G += imgData[i + 1];
        B += imgData[i + 2];
        A += imgData[i + 3];
      }

      // The | operator is used here to perform an integer division
      R = (R / pixelsPerChannel) | 0;
      G = (G / pixelsPerChannel) | 0;
      B = (B / pixelsPerChannel) | 0;
      // The alpha channel need to be in the [0, 1] range
      A = A / pixelsPerChannel / 255;

      if (R === 0 && G === 0 && B === 0) {
      } // skip because RGB of 0 means black color
      else {
        const labColor = this.rgb2lab([R, G, B]);
        const colorDelta = this.deltaE(labColor);

        // NOTE: clear out array if it gets too big
        if (this.colorDeltaArray.length > 400) {
          this.colorDeltaArray = [];
        }

        colorDeltaArray.push(colorDelta);
        this.calculateEyeResults(colorDeltaArray);
      }
    },
    calculateEyeResults(colorArray) {
      // very basic checking of "redness" by simply averaging numbers.
      // this is not very accurate at all but good for proof-of-concept
      const sortedDeltaE = colorArray.sort();
      let sum;
      let average;
      let rednessResult;

      if (sortedDeltaE.length < 1) return;

      sum = colorArray.reduce((a, b) => a + b);
      average = sum / colorArray.length;
      rednessResult = Math.abs(Math.floor(5 * (0.01 * average + 0.1)));

      rednessResult = rednessResult <= 0 ? 1 : rednessResult;
      this.$refs.rednessLevel.innerText = rednessResult;
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
  flex-direction: column;
}

video {
  background: black;
  width: 400px;
  height: 300px;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  margin: auto;
  opacity: 0;
}

canvas {
  border: 1px solid black;
  margin-bottom: 10px;
}

a.button {
  margin-bottom: 15px;
}
</style>
