export default class CACanvas {
    constructor(canvas, ofHeight = 100) {
      this.canvas = canvas;
      this.ctx = this.canvas.getContext("2d");
      this.cellSize = 2;
      this.ofHeight = ofHeight;
      this.cols = 0;
      this.rows = 0;
    }

    resizeAndReset() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.cellSize = Math.floor(height / this.ofHeight);
        this.cols = Math.floor(width / this.cellSize);
        this.rows = Math.floor(height / this.cellSize);
        this.canvas.width = this.cols * this.cellSize;
        this.canvas.height = this.rows * this.cellSize;
        this.clear("#eeeeee");
    }

    clear(backGround = "#eeeeee") {
        this.ctx.fillStyle = backGround;
        this.ctx.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height,
        );
    }

    drawSquareAt(x, y, colour = "#333333", border = false ) {
        this.ctx.fillStyle =colour ;
        this.ctx.fillRect(
            x * this.cellSize,
            y * this.cellSize,
            this.cellSize,
            this.cellSize,
        );
        if(border){
          this.ctx.strokeStyle = '#eeeeee';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize)
        }
    }

    drawImageAt(x,y,img){
        if (img) {
          const imgSize = this.cellSize * 0.8;
          const offsetX = (this.cellSize - imgSize) / 2;
          const offsetY = (this.cellSize - imgSize) / 2;
          this.ctx.drawImage(img, x * this.cellSize + offsetX, y * this.cellSize + offsetY, imgSize, imgSize);
        }
    }
}
