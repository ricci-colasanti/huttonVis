export class Cell {
  static now = 0;
  static next = 1;
  static albedoOfSurface = 0.4;
  static albedoOfBlack = 0.25;
  static albedoOfWhite = 0.75;

  constructor(xpos, ypos) {
    this.xpos = xpos;
    this.ypos = ypos;
    this.occupant = ["", ""];
    this.neighbours = [];
    this.temperature = 0.0;
    this.solarAngle = 0.0;
  }

  addNeighbour(cell) {
    this.neighbours.push(cell);
  }

  getStateNow() {
    return this.occupant[Cell.now];
  }

  setStateNow(state) {
    this.occupant[Cell.now] = state;
  }

  getLocalHeating(solarLuminosity) {
    let albedo = Cell.albedoOfSurface;
    if (this.occupant[Cell.now] === "B") {
      albedo = Cell.albedoOfBlack;
    }
    if (this.occupant[Cell.now] === "W") {
      albedo = Cell.albedoOfWhite;
    }
    const absorbedLuminosity = (1 - albedo) * solarLuminosity * this.solarAngle;
    let localHeating = 80;
    if (absorbedLuminosity > 0) {
      if (absorbedLuminosity > 0.01) {
          localHeating = 21.72 * Math.log(absorbedLuminosity) + 80;
      } else {
          localHeating = -20;
      }
    }
    return localHeating;
  }

  getDeathProbability(temperature, optimumTemp, sigma, maxDeathRate) {
      const diff = Math.abs(temperature - optimumTemp);
      // Normalize diff to [0, 1] based on sigma
      const normalizedDiff = Math.min(diff / (3 * sigma), 1);
      // Probability increases with distance from optimum
      return maxDeathRate * Math.pow(normalizedDiff, 1.5);
  }

  getGerminationProbability(temperature, optimumTemp, sigma, maxGerminationRate) {
      // Calculate the difference from optimum temperature
      const diff = temperature - optimumTemp;

      // Gaussian (normal distribution) function
      // Returns probability between 0 and maxGerminationRate
      const gaussian = Math.exp(-(diff * diff) / (2 * sigma * sigma));

      // Germination is highest at optimum, decreasing as temperature deviates
      return maxGerminationRate * gaussian;
  }

  setTemperature(solarLuminosity) {
    const sumTemp = this.neighbours.reduce(
      (sum, cell) => sum + cell.getLocalHeating(solarLuminosity),
      0,
    );
    const averageTemp = sumTemp / this.neighbours.length;
    this.temperature =
      (this.getLocalHeating(solarLuminosity) + averageTemp) / 2;
  }
}

export default class Grid {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.cells = [];
    this.globalTemperature = 0.0;
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
    this.setNeighbours();
    this.setSolarAngle();
  }

  setNeighbours() {
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

  setSolarAngle() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.cells[y][x];
        const normalizedX = cell.xpos / this.cols;
        const latitude = (normalizedX - 0.5) * Math.PI;
        cell.solarAngle = Math.cos(latitude);
      }
    }
  }

  setTemperature(solarLuminosity) {
    let averagTemperature =0.0
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.cells[y][x].setTemperature(solarLuminosity,this.globalTemperature);
        averagTemperature += this.cells[y][x].temperature;
      }
    }
    averagTemperature = (averagTemperature / (this.rows * this.cols));
    this.globalTemperature = averagTemperature;
  }

  populateDaisies() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.cells[y][x];
        const whiteProb = cell.temperature / 100;
        cell.setStateNow(Math.random() < whiteProb ? "W" : "B");
      }
    }
  }

  getCell(y, x) {
    return this.cells[y][x];
  }
}
