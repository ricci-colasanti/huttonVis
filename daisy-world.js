export class Cell {
  constructor(xpos, ypos, occupant = "", temp = 0.0, solarAngle = 0.0) {
    this.xpos = xpos;
    this.ypos = ypos;
    this.occupant = occupant;
    this.neighbours = [];
    this.temp = temp;
    this.solarAngle = solarAngle;
  }

  addNeighbour(cell) {
    this.neighbours.push(cell);
  }
}

export default class Grid {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.cells = [];
    this.init();
  }

  xBounds(x) {
    return (x + this.cols) % this.cols;
  }

  yBounds(y) {
    return (y + this.rows) % this.rows;
  }

  init() {
    for (let y = 0; y < this.rows; y++) {
      this.cells[y] = [];
      for (let x = 0; x < this.cols; x++) {
        this.cells[y][x] = new Cell(x, y, "");
      }
    }

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        for (let yy = y - 1; yy <= y + 1; yy++) {
          let yyy = this.yBounds(yy);
          for (let xx = x - 1; xx <= x + 1; xx++) {
            let xxx = this.xBounds(xx);
            if (yyy === y && xxx === x) {
              continue;
            }
            this.cells[y][x].addNeighbour(this.cells[yyy][xxx]);
          }
        }
      }
    }
  }

  setTemperatures() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.cells[y][x];
        const normalizedX = cell.xpos / this.cols;
        const distanceFromCenter = Math.abs(normalizedX - 0.5) * 2;
        cell.temp = 100 - distanceFromCenter * 100;
      }
    }
  }

  populateDaisies() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.cells[y][x];
        const whiteProb = cell.temp / 100;
        cell.occupant = Math.random() < whiteProb ? "W" : "B";
      }
    }
  }

  getCell(y, x) {
    return this.cells[y][x];
  }
}
