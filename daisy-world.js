export class Cell {
  static now = 0;
  static next = 1;
  static albedoOfSurface = 0.5;
  static albedoOfBlack = 0.25;
  static albedoOfWhite = 0.75;
  static DEATH_RATE = 0.3;
  static MIN_TEMP = 5;
  static MAX_TEMP = 44;
  static MAX_GERMINATION = 0.8;

  static update() {
    [Cell.now, Cell.next] = [Cell.next, Cell.now];
  }

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

  getAlbedo() {
    const occupant = this.occupant[Cell.now];
    if (occupant === "B") return Cell.albedoOfBlack;
    if (occupant === "W") return Cell.albedoOfWhite;
    return Cell.albedoOfSurface;
  }

  getLocalHeating(solarLuminosity) {
    const albedo = this.getAlbedo();
    const absorbedLuminosity = (1 - albedo) * solarLuminosity * this.solarAngle;

    if (absorbedLuminosity <= 0) return 80;

    const localHeating = 72 * Math.log(absorbedLuminosity) + 80;
    return Math.max(localHeating, -20);
  }

  setTemperature(solarLuminosity) {
    let totalAlbedo = this.getAlbedo();
    let count = 1;

    for (const neighbor of this.neighbours) {
      totalAlbedo += neighbor.getAlbedo();
      count++;
    }

    const localAlbedo = totalAlbedo / count;
    const absorbedLuminosity = (1 - localAlbedo) * solarLuminosity * this.solarAngle;

    if (absorbedLuminosity <= 0) {
      this.temperature = 80;
    } else {
      const localHeating = 72 * Math.log(absorbedLuminosity) + 80;
      this.temperature = Math.max(localHeating, -20);
    }
  }

  getGerminationProbability(daisyType) {
    if (this.temperature < Cell.MIN_TEMP || this.temperature > Cell.MAX_TEMP) {
      return 0;
    }

    let optimumTemp;
    if (daisyType === "B") {
      optimumTemp = 22.5;
    } else if (daisyType === "W") {
      optimumTemp = 27.5;
    } else {
      return 0;
    }

    const normalizedDiff = (this.temperature - optimumTemp) / (Cell.MAX_TEMP - optimumTemp);
    const growth = 1 - (normalizedDiff * normalizedDiff);

    return Cell.MAX_GERMINATION * Math.max(growth, 0);
  }

  shouldDie() {
    return Math.random() < Cell.DEATH_RATE;
  }

  updateCell() {
    this.occupant[Cell.next] = this.occupant[Cell.now];

    if (this.occupant[Cell.now] !== "") {
      if (this.shouldDie()) {
        this.occupant[Cell.next] = "";
      }
    } else {
      const blackProb = this.getGerminationProbability("B");
      const whiteProb = this.getGerminationProbability("W");

      let blackSeedCount = 0;
      let whiteSeedCount = 0;

      for (const neighbor of this.neighbours) {
        if (neighbor.occupant[Cell.now] === "B") blackSeedCount++;
        if (neighbor.occupant[Cell.now] === "W") whiteSeedCount++;
      }

      const blackTotal = blackProb * (blackSeedCount > 0 ? 1 + blackSeedCount * 0.1 : 0);
      const whiteTotal = whiteProb * (whiteSeedCount > 0 ? 1 + whiteSeedCount * 0.1 : 0);

      const totalProb = blackTotal + whiteTotal;

      if (totalProb > 0 && Math.random() < Math.min(totalProb, 1)) {
        const rand = Math.random();
        const normalizedBlack = blackTotal / totalProb;

        if (rand < normalizedBlack && blackSeedCount > 0) {
          this.occupant[Cell.next] = "B";
        } else if (whiteSeedCount > 0) {
          this.occupant[Cell.next] = "W";
        }
      }
    }
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
        this.cells[y][x] = new Cell(x, y);
      }
    }
    this.setNeighbours();
    this.setSolarAngle();
  }

  setNeighbours() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const ny = this.yBounds(y + dy);
            const nx = this.xBounds(x + dx);
            this.cells[y][x].addNeighbour(this.cells[ny][nx]);
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

              // Original solar angle: 1 at equator, 0 at poles
              const rawSolarAngle = Math.cos(latitude);

              // Scale factor: 0.5 at poles, 1.0 at equator
              // This reduces the harshness at poles while keeping curvature
              const minSolarAngle = 0.5; // Adjust this value (0.0 to 1.0)
              const scaledSolarAngle = minSolarAngle + (1 - minSolarAngle) * rawSolarAngle;

              cell.solarAngle = scaledSolarAngle;
          }
      }
  }

  iterate(solarLuminosity) {
    let totalTemperature = 0;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.cells[y][x].setTemperature(solarLuminosity);
        totalTemperature += this.cells[y][x].temperature;
      }
    }

    this.globalTemperature = totalTemperature / (this.rows * this.cols);

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.cells[y][x].updateCell();
      }
    }

    Cell.update();
  }

  populateDaisies(blackRatio) {
    if (blackRatio === undefined) blackRatio = 0.5;

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.cells[y][x];
        cell.setTemperature(1.0);

        if (cell.temperature < 22) {
          cell.setStateNow(Math.random() < 0.6 ? "B" : "");
        } else if (cell.temperature > 28) {
          cell.setStateNow(Math.random() < 0.6 ? "W" : "");
        } else {
          const rand = Math.random();
          if (rand < 0.3) cell.setStateNow("B");
          else if (rand < 0.6) cell.setStateNow("W");
          else cell.setStateNow("");
        }
      }
    }
  }

  getCell(y, x) {
    if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
      return this.cells[y][x];
    }
    return null;
  }

  countDaisies() {
    let black = 0;
    let white = 0;
    let empty = 0;

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const occupant = this.cells[y][x].getStateNow();
        if (occupant === "B") {
          black++;
        } else if (occupant === "W") {
          white++;
        } else {
          empty++;
        }
      }
    }

    return {
      black: black,
      white: white,
      empty: empty,
      total: this.rows * this.cols
    };
  }
}
