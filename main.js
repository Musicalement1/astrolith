
//TODO: make zoomStr an option
const options = window.menu.options;
const canvas = document.getElementById("space");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
const previewCanvas = document.createElement("canvas");
const previewCtx = previewCanvas.getContext("2d");
previewCanvas.width = 100;
previewCanvas.height = 100;
///--universe generation constants--///
var zoom = 4;
const zoomStr = 1.0225;
const camera = {x: 0, y: 0}
const nameVisibilityZoomThreshold = 0.25;
const starColors = ['#9db4ff', '#ffffff', '#fff5ba', '#ffd2a1', '#ffaaaa'];
const universeSize = 200000;
const minDistance = 15
//const minDistance = 50;//additional minimum distance between stars with mass
//const minDistanceMult = 25
const starCount = 1000;
const G = options.gravity || 0.008;//gravitational constant
const maxPlanetExentricity = 0.65;
const blackHoleChance = 0.01;
const supermassiveBlackHoleChance = 0.00001;//supermassive black holes, normalyl there is only 1 by galaxy at the center but in some extremely rare cases you may spawn in a galaxy that collided with another galaxy but didn't end the process yet, thats why it can generate supermassive black holes with an extremely small chance, lol
const maxGalaxyBranches = 6;
const minGalaxyBranches = 2;
const gravityRangeSq = 2000 ** 2;
const planetLandedRadiusMultiplier = 2;
const mediocreSpawn = options.mediocreSpawn ?? 1
const LINK_DISTANCE = 3000;
const ZOOM_THRESHOLD_FOR_CIVS = 0.25;
const ZOOM_THRESHOLD_FOR_SEEING_DOTS_INSTEAD_OF_STARS = 0.025
//const distanceMultWhenCalculatingParentStar = 4
const maxStarsWithPlanetsOnScreen = 4
///--end of the constants--///
const grayFadeForPlanetOrbits = 0.5;
const orbitPredictionLen = options.maxOrbit || 5000
const shipSpeed = options.speed || 0.003;
const shipRotation = 0.05;//rads per frame
var civilizationLineWidth = 5
/*const starPrefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Omega', 'Nova', 'Proxima', 'Sirius'];
const starSuffixes = ['Prime', 'Max', 'Astra', 'Centauri', 'X', 'Nebula', 'Vega', 'Aurora', 'Sol', 'Luna'];*/
const firstSyllables = ['Al', 'Be', 'Ga', 'Zo', 'Di', 'Lu', 'Ka', 'Te', 'No', 'Xi', 'Lo', 'Ra', 'Ki', 'Fu', 'Pa', 'Si', 'Ma', 'Za', 'Ne', 'Ta', 'Ny', 'Ve', 'Or'];
const secondSyllables = ['pha', 'la', 'ra', 'no', 'mi', 'xi', 'za', 'ka', 'lu', 'sa', 'na', 'ri', 'ro', 'va', 'do', 'tu', 'me', 'ti', 'ki', 'bi', 'xa', 'rion', 'lta', 'ar', 'us'];
const thirdSyllables = ['tor', 'nus', 'des', 'rea', 'bri', 'tas', 'mus', 'ras', 'ven', 'tra', 'dun', 'san', 'os', 'zan', 'kos', 'cel', 'lan', 'ras', 'vio', 'loth', 'vin', 'ion', 'us'];
//const alienSyllables = ['Q\'a', 'Ghr', 'Tz', 'Xo', 'Rk', 'Zh', 'Y\'k', 'Vra', 'Chl', 'N\'g'];
//const planetPrefixes = ['Terra', 'Mars', 'Gaia', 'Neptune', 'Pluto', 'Titan', 'Eden', 'Zeta', 'Xenon', 'Celestia'];
const namedColors = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  lime: "#00ff00",
  blue: "#0000ff",
  yellow: "#ffff00",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  gray: "#808080",
  maroon: "#800000",
  olive: "#808000",
  green: "#008000",
  purple: "#800080",
  teal: "#008080",
  silver: "#c0c0c0",
  navy: "#000080",
  orange: "#ffa500",
  pink: "#ffc0cb",
  brown: "#a52a2a",
  gold: "#ffd700",
  beige: "#f5f5dc"
  //more coming soon
};
function blendColors(colorA, colorB, amount) {
  const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
  const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
  const r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
  const g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
  const b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');
  return '#' + r + g + b;
}
function hexToRgb(hex) {
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}
function colorDistance(c1, c2) {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}
function getColorNameFromHex(hex) {
  const targetRgb = hexToRgb(hex);

  let closestName = null;
  let minDistance = Infinity;

  for (const [name, namedHex] of Object.entries(namedColors)) {
    const namedRgb = hexToRgb(namedHex);
    const distance = colorDistance(targetRgb, namedRgb);

    if (distance < minDistance) {
      minDistance = distance;
      closestName = name;
    }
  }

  return closestName || "unknown";
}
function getRandomHexColor() {
  const hex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  return `#${hex}`;
}
const vowels = [
  { letter: 'a', weight: 5 },
  { letter: 'e', weight: 6 },
  { letter: 'i', weight: 5 },
  { letter: 'o', weight: 4 },
  { letter: 'u', weight: 3 },
  { letter: 'y', weight: 1 }
];

const consonants = [
  { letter: 'b', weight: 2 },
  { letter: 'c', weight: 2 },
  { letter: 'd', weight: 3 },
  { letter: 'f', weight: 2 },
  { letter: 'g', weight: 2 },
  { letter: 'h', weight: 2 },
  { letter: 'j', weight: 1 },
  { letter: 'k', weight: 2 },
  { letter: 'l', weight: 4 },
  { letter: 'm', weight: 3 },
  { letter: 'n', weight: 5 },
  { letter: 'p', weight: 2 },
  { letter: 'q', weight: 0.5 },
  { letter: 'r', weight: 5 },
  { letter: 's', weight: 5 },
  { letter: 't', weight: 4 },
  { letter: 'v', weight: 2 },
  { letter: 'w', weight: 1 },
  { letter: 'x', weight: 0.5 },
  { letter: 'z', weight: 0.5 }
];
function getWeightedRandom(pool) {
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const item of pool) {
    if (rand < item.weight) return item.letter;
    rand -= item.weight;
  }
  return pool[0].letter; // fallback
}
function getRandom(arr) {//I'm not used to that function for some reason
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateLetterBasedName(options = {}) {
  const {
    shortName = Math.random() > 0.98 ? true : false, // 2% chance 2 letters
    minLength = 4,
    maxLength = 9,
    startWithVowel = Math.random() < 0.5,
    allowDoubleLetters = Math.random() > 0.9 ? true : false
  } = options;

  const length = shortName == true ? Math.floor(2 * Math.random() + 2)/*2 or 3 letters*/ : Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  let name = '';
  let lastChar = '';
  let useVowel = startWithVowel;

  for (let i = 0; i < length; i++) {
    const pool = useVowel ? vowels : consonants;
    let letter = getWeightedRandom(pool);

    if (!allowDoubleLetters && letter === lastChar) {
      let attempts = 0;
      while (letter === lastChar && attempts < 5) {
        letter = getWeightedRandom(pool);
        attempts++;
      }
    }

    name += letter;
    lastChar = letter;
    useVowel = !useVowel;
  }

  return capitalize(name);
}
const adjectives = [
  "Great",
  "Mighty",
  "Ancient",
  "Free",
  "United",
  "Sovereign",
  "Independent",
  "Royal",
  "Federal",
  "Confederate",
  "Dominant",
  "Powerful",
  "Glorious",
  "Eternal",
  "Divine",
  "Supreme",
  "Noble",
  "Honorable",
  "Valiant",
  "Prosperous",
  "Peaceful",
  "Bold",
  "Majestic",
  "Just",
  "True",
  "Neo-"
];
const regimes = [
  "Republic",
  "Kingdom",
  "Empire",
  "Federation",
  "Confederation",
  "Principality",
  "Sultanate",
  "Duchy",
  "Dominion",
  "Commonwealth",
  "Protectorate",
  "Territory",
  "Union",
  "Sovereignty",
  "Free State",
  "Caliphate",
  "Theocracy",
  "Dictatorship",
  "Oligarchy",
  "Anarchy",
  "Technocracy",
  "Monarchy",
  "Junta",
  "Autocracy",
  "Empire State",
  "City State",
  "Mandate",
  "Emirate",
  "Republica",
  "Kingdomate",
  "Territorial Collective",
  "Confederal Republic",
  "Elective Monarchy",
  "Absolute Monarchy",
  "Parliamentary Republic",
  "Socialist State",
  "Communist State",
  "Democratic Republic",
  "Military Government",
  "Trusteeship",
  "Cybercracy",
  "Mythocracy",
  "Cryptocracy",
  "Anarcho-Monarchy",
  "Republic",
  "Hive Mind Collective",
  "State",
  "Chronocracy",
  "Noocracy",
  "Plutocracy",
  "Regime",
  "Anarchy"
];

function getRandomAdjective() {
  let adjective = Math.random() > 0.5 ? getRandom(adjectives) + " " : "";
  return adjective
}
function getRandomRegime() {
  let output = Math.random() > 0.3 ? getRandom(regimes) + " of " : "";
  return output;
}

function generateRandomName(type = 'star', isComposed = false) {
  let name = '';

  const useLetterMode = Math.random() < 0.99;

  if (useLetterMode) {
    name = generateLetterBasedName();
  } else {
    const syllableChance = Math.random();
    let syllableCount = syllableChance < 0.15 ? 1 : (syllableChance < 0.7 ? 2 : 3);

    name = getRandom(firstSyllables);
    if (syllableCount > 1) name += getRandom(secondSyllables);
    if (syllableCount === 3) name += getRandom(thirdSyllables);
  }

  if (!isComposed && Math.random() < 0.025 && type !== 'Black Hole') {
    const secondName = generateRandomName(type, true);
    const separator = Math.random() > 0.75 ? " " : "-";
    return name + separator + secondName;
  }

  switch (type) {
    case "planet":
      break;
    case "civ":
      name = getRandomAdjective() + getRandomRegime() + " " + name;
      break;
    case "Black Hole":
      const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
      const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const seconds = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const sign = Math.random() > 0.5 ? '+' : '-';
      const declDegrees = String(Math.floor(Math.random() * 90)).padStart(2, '0');
      const declMinutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      name += ` J${hours}${minutes}${seconds}${sign}${declDegrees}${declMinutes}`;
      break;
    default:
      break;
  }

  return name;
}


function getStrongestGravitySource(ship, stars/*, distanceMultiplier = 1*/) {
  let strongestStar = null;
  let maxForce = -Infinity;//hmm
  for (const star of stars) {
    const dx = star.x - ship.x;
    const dy = star.y - ship.y;
    const distSq = dx * dx + dy * dy/* / distanceMultiplier*/;
    // Avoid division by zero and skip collisions
    if (distSq < (star.radius + ship.radius) ** 2) continue;
    const force = G * star.mass / distSq;

    if (force > maxForce) {
      maxForce = force;
      strongestStar = star;
    }
  }

  return strongestStar;
}
function getStrongestGravitySourceWithSkips(ship, stars/*, distanceMultiplier = 1*/, skips = 0) {//unoptimized, thats why we create another function
  const starForces = [];
  for (const star of stars) {
    const dx = star.x - ship.x;
    const dy = star.y - ship.y;
    const distSq = dx * dx + dy * dy/* / distanceMultiplier*/;
    if (distSq < (star.radius + ship.radius) ** 2) continue;

    const force = G * star.mass / distSq;
    starForces.push({ star, force });
  }
  starForces.sort((a, b) => b.force - a.force);
  if (skips < starForces.length) {
    return starForces[skips].star;
  }
  return null;
}
function getNearestStars(ship, stars/*, distanceMultiplier = 1*/, max = 5) {
  let output = []
  for (let i = 0; i < max; i++) {
    output.push(getStrongestGravitySourceWithSkips(ship, stars/*, distanceMultiplier*/, i))
  }
  return output
}
function colorViaTemperature(temperature) {
  //2500K - 40000K avg
  let t = temperature / 1000;

  let r, g, b;

  if (t <= 4.0) {
    r = 1.0;
    g = 0.4 + 0.3 * (t - 1.0) / 3.0;
    b = 0.0;
  } else if (t <= 7.0) {
    r = 1.0;
    g = 0.7 + 0.3 * (t - 4.0) / 3.0;
    b = 0.5 * (t - 4.0) / 3.0;
  } else {
    r = 1.0 - 0.3 * (t - 7.0) / 33.0;
    g = 1.0 - 0.3 * (t - 7.0) / 33.0;
    b = 1.0;
  }

  // Clamp to [0, 255] and convert to hex
  const toHex = c => {
    c = Math.max(0, Math.min(255, Math.round(c * 255)));
    return c.toString(16).padStart(2, '0');
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/*
//attempt 1000 at generating stars so that they don't sux
const massRef = 1000;
const baseDistanceFactor = 1.5;
const alpha = 0.5;

function isTooClose(newStar, stars) {
  for (const star of stars) {
    const dx = newStar.x - star.x;
    const dy = newStar.y - star.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const massFactor = Math.pow(star.mass / massRef, alpha);
    const minDist = baseDistanceFactor * (newStar.radius + star.radius) * massFactor;

    if (dist < minDist) {
      return true;
    }
  }
  return false;
}*/
/*function isTooClose(newStar, stars) {
  for (const star of stars) {
    const dx = newStar.x - star.x;
    const dy = newStar.y - star.y;
    if (Math.sqrt(dx * dx + dy * dy) < minDistance * (2 * (Math.pow(star.mass, 0.3)))) return true;
  }
  return false;
}*/
/*function isTooClose(newStar, stars, threshold = 100) {
  const distances = stars.map(star => {
    const dx = newStar.x - star.x;
    const dy = newStar.y - star.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return { star, dist };
  });

  distances.sort((a, b) => a.dist - b.dist);

  const closest3 = distances.slice(0, 3);

  for (const { star, dist } of closest3) {
    if (dist === 0) continue;
    const force = G * newStar.mass * star.mass / (dist * dist);
    if (force > threshold) return true;
  }
  return false;
}
function isTooClose(newStar, stars) {
  for (const star of stars) {
    const dx = newStar.x - star.x;
    const dy = newStar.y - star.y;
    if (Math.sqrt(dx * dx + dy * dy) < (minDistanceMult * (star.mass * 0.0025) + minDistance)) return true;
  }
  return false;
}*/
function isTooClose(newStar, stars) {
  for (const star of stars) {
    const dx = newStar.x - star.x;
    const dy = newStar.y - star.y;
    if (Math.sqrt(dx * dx + dy * dy) < minDistance * star.radius * 2) return true;
  }
  return false;
}
function isInView(body, canvas, camera, zoom) {//(circles only)
  return (
    body.x + body.radius > camera.x &&
    body.x - body.radius < camera.x + canvas.width / zoom &&
    body.y + body.radius > camera.y &&
    body.y - body.radius < camera.y + canvas.height / zoom
  );
}
function drawBall(ctx, x, y, radius) {
  ctx.arc(x, y, radius, 0, Math.PI * 2);
}
function drawBody(ctx, x, y, body, camera, zoom, infoPanel = false) {
  if (infoPanel || (camera != undefined && zoom != undefined)){ 
  if(infoPanel || isInView(body, ctx.canvas, camera, zoom)) {
  if (infoPanel) body.previewRadius = Math.min(Math.max(body.radius, 10), 50)
  if(zoom < ZOOM_THRESHOLD_FOR_SEEING_DOTS_INSTEAD_OF_STARS && !infoPanel && body.radius < 200) {
    if (zoom < ZOOM_THRESHOLD_FOR_SEEING_DOTS_INSTEAD_OF_STARS / 5) {
      civilizationLineWidth = 150
      ctx.beginPath();
      drawBall(ctx, x, y, 300);
      ctx.fillStyle = body.civ ? body.civ.color : body.color;//"#f7ff00"
      ctx.fill();
    } else {if (body.radius < 20) return;
    civilizationLineWidth = 50
    ctx.beginPath();
    drawBall(ctx, x, y, 125);
    ctx.fillStyle = body.civ ? body.civ.color : body.color;//"#f7ff00"
    ctx.fill();
  }
  } else {//actual star rendering
  civilizationLineWidth = 10
  if (body.type == "Black Hole") {
  const diskRadius = body.radius * 3;
  const gradient = ctx.createRadialGradient(x, y, body.radius, x, y, diskRadius);
  gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
  gradient.addColorStop(0.4, 'rgba(255, 100, 50, 0.5)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.beginPath();
  ctx.arc(x, y, diskRadius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.beginPath();
  if (infoPanel) {drawBall(ctx, x, y, body.previewRadius)} else {drawBall(ctx, x, y, body.radius)}
  ctx.fillStyle = 'black';
  ctx.fill();
} else if (body.type == "star") {
  const starRadius = infoPanel ? body.previewRadius : body.radius;
  const glowRadius = starRadius * 2.5;
  const mainColor = body.color;
  const outerGradient = ctx.createRadialGradient(x, y, starRadius * 0.1, x, y, glowRadius);
  outerGradient.addColorStop(0, mainColor);
  outerGradient.addColorStop(0.2, `${mainColor}AA`);
  outerGradient.addColorStop(0.5, `${mainColor}44`);
  outerGradient.addColorStop(1, `${mainColor}00`);
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fillStyle = outerGradient;
  ctx.fill();
  const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, starRadius);
  coreGradient.addColorStop(0, blendColors(mainColor, "#FFFFFF", 0.3));
  coreGradient.addColorStop(0.3, mainColor);
  coreGradient.addColorStop(1, mainColor + "AA");

  ctx.beginPath();
  drawBall(ctx, x, y, starRadius);
  ctx.fillStyle = coreGradient;
  ctx.fill();
} else {//planet
  ctx.beginPath();
  if (infoPanel) {drawBall(ctx, x, y, body.previewRadius)} else {drawBall(ctx, x, y, body.radius)}
  ctx.fillStyle = body.color;
  ctx.fill();
}}}}
}
function showInfoPanel(body, type) {
  const infoPanel = document.getElementById("infoPanel");
  const infoImage = document.getElementById("infoImage");
  const infoText = document.getElementById("infoText");

  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  const centerX = previewCanvas.width / 2;
  const centerY = previewCanvas.height / 2;

  drawBody(previewCtx, centerX, centerY, body, null, null, true)
  infoImage.src = previewCanvas.toDataURL();

  let html = `<strong>Name:</strong> ${body.name}<br>`;
  html += `<strong>Type:</strong> ${capitalize(body.type)}<br>`;
  if (type === "planet") {html+= `<strong>Radius:</strong> ${(body.radius * 3000).toFixed(3)} km<br>`} else {body.type == "Black Hole" ? html += `<strong>Event Horizon:</strong> ${(body.radius / 20).toFixed(3)} R⊙<br>`: html += `<strong>Radius:</strong> ${(body.radius / 20).toFixed(3)} R⊙<br>`};
  if (body.density) html += `<strong>Density:</strong> ${(body.density * 22.5).toFixed(3)} g/cm³<br>`;
  if (body.mass) html += `<strong>Mass:</strong> ${(body.mass / 3000).toFixed(3)} M⊙<br>`;
  if (type === "star") html+= `<strong>Planets</strong> ${body.planets.length}<br>`;
  if (type === "star") html+= `<strong>Planet rotation:</strong> ${body.planetsTurnAntiClockwise == 1 ? "Anti-Clockwise" : "Clockwise"}<br>`;
  if (body.temperature) html+= `<strong>Current Temperature:</strong> ${(Math.max(body.temperature - 273.15, -273.15)).toFixed(2)} C°<br>`
  if (type === "planet" && body.star) html += `<strong>Orbits:</strong> ${body.star.name}<br>`;
  if (type === "planet" && body.star) html+= `<strong>Exentricity:</strong> ${(body.e).toFixed(4)}<br>`;
  if (type === "planet" && body.star) html+= `<strong>Color:</strong> ${(capitalize(getColorNameFromHex(body.color)))}<br>`;
  if (type === "planet") html += `<strong>Current Distance:</strong> ${(body.distance/100).toFixed(2)} AU<br>`
  if (body.civ) {
    html+= `<strong>Owner:</strong> ${body.civ.name}<br>`
    let pluralStringStars = body.civ.stars.length > 1 ? "Stars" : "Star"
    let pluralStringPlanets = body.civ.planetCount > 1 ? "Planets" : "Planet"
    html+= `<strong> Civilization Stats:</strong> ${body.civ.stars.length} ${pluralStringStars} with ${body.civ.planetCount} ${pluralStringPlanets}`
    }
  infoText.innerHTML = html;
  infoPanel.style.display = "block";
}

function getTemperature(minTemp = 2500, maxTemp = 40000, biasExponent = 3) {//Kelvins
  const rand = Math.random();
  const biased = Math.pow(rand, biasExponent);
  const temperature = biased * (maxTemp - minTemp) + minTemp
  return temperature
}
function generateStar() {
  const typeChance = Math.random();
  const temperature = getTemperature(1300, 40000, 3)
  let star = {
    x: Math.random() * universeSize,
    y: Math.random() * universeSize,
    radius: 10 + (60 * Math.random()),
    temperature: temperature,
    color: colorViaTemperature(temperature),//starColors[Math.floor(Math.random() * starColors.length)],
    planets: [],
    type: 'star',
    gravityRangeMult: 1,
    name: generateRandomName('star'),
    density: 0.05 + (Math.random() * 0.025),
    planetsTurnAntiClockwise: Math.floor(Math.random() * 2),
    civ: null
  };

  //const baseMass = 1000 + Math.random() * 500;

  if (typeChance < blackHoleChance) {
    if (typeChance < supermassiveBlackHoleChance) {//supermassive bh
      star.radius *= 25 * Math.random() + 25
      star.type = 'Black Hole';
      star.color = 'black';
      //star.density *= 0.05 //sorry you are too big
      star.mass *= (125 * Math.random()) + 50,
      //star.mass = ((4/3) * Math.PI * (star.radius**3)/* volume */) * star.density
      star.name = generateRandomName('Black Hole')
      star.gravityRangeMult = 60              //else it doesn't really attracts the ship :madman: shame, for a black hole
      return star;                            //skip planet generation cuz astronomically, supermassive bh doesn't have planets right? (idk)
    } else {                                  //10% for each bh so 0.1% overall pikcing a random star
    star.type = 'Black Hole';
    star.name = generateRandomName('Black Hole')
    star.radius *= Math.random() + 1;
    star.density *= 2.5
    //star.mass *= (10 * Math.random()) + 10;
    star.color = 'black';
  }}
  star.mass = ((4/3) * Math.PI * (star.radius**3)/* volume */) * star.density
  const planetCount = Math.floor(Math.random() * 5);
  let lastOrbitRadius = 0;
/*****
a: semi-major axis

e: eccentricity

b: semi-minor axis = a * sqrt(1 - e**2)

c: distance from center to focus (where the star is) = a * e
******/
for (let j = 0; j < planetCount; j++) {
  let a, e, b, c, rMin;
  let attempts = 0;
  let truecolor = getRandomHexColor()
  let minOrbitDistance = (star.type === 'Black Hole') ? star.radius * 6 : star.radius * 1.2;//so ye, lets say black holes should have planets spawning FAR from the star
  do {
    e = Math.random() * maxPlanetExentricity;
    a = lastOrbitRadius + 30 + j * 20 + Math.random() * 40;
    c = a * e;
    rMin = a - c;
    attempts++;
  } while (rMin < minOrbitDistance + 5 && attempts < 10);//no planets in stars + prevent infinite loops

  b = a * Math.sqrt(1 - e * e);
  lastOrbitRadius = a;
  star.planets.push({
    a, b, e, c,
    angle: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2,
    star,
    radius: 0.25 + Math.random() * 5,
    name: Math.random() < 0.001 ? "Da Egg" : generateRandomName('planet'),
    color: truecolor,
    cachedColorOrbit: `rgba(${hexToRgb(blendColors(truecolor , "#9b9b9b", grayFadeForPlanetOrbits)).r}, ${hexToRgb(blendColors(truecolor, "#9b9b9b", grayFadeForPlanetOrbits)).g}, ${hexToRgb(blendColors(truecolor, "#9b9b9b", grayFadeForPlanetOrbits)).b}, 0.4)`,
    type: "Planet",
    civ: null,
    temperature: null
  });
}
  

  return star;
}

var civilizations = [];
function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx*dx + dy*dy);
}

function generateCivilizations(stars) {
  civilizations = [];
  const unassigned = new Set(stars);

  const totalClusters = Math.max(
    Math.floor(stars.length * 0.025),//2.5% of stars
    100
  );
  for (let i = 0; i < totalClusters; i++) {
    if (unassigned.size === 0) break;

    const starArray = [...unassigned];
    const startStar = starArray[Math.floor(Math.random() * starArray.length)];
    const isVoid = Math.random() < 0.08;

    const civ = {
      id: i,
      color: isVoid ? null : getRandomHexColor(),
      stars: [startStar],
      name: isVoid ? null : generateRandomName("civ"),
      isVoid,
      planetCount: 0
    };

    startStar.civ = civ;
    civilizations.push(civ);
    unassigned.delete(startStar);
  }

  civilizations.forEach(civ => {
    if (civ.isVoid) return;
  
    const maxExtensionsPossible = 10;
    let extensionCount = 0;
    const pStop = 0.6;//probabilty to stop
  
    while (extensionCount < maxExtensionsPossible && civ.stars.length < 100) {
      let frontier = [...civ.stars];
      const visited = new Set(civ.stars);
  
      let anyAdded = false;
  
      while (frontier.length > 0 && civ.stars.length < 100) {
        const nextFrontier = [];
  
        for (const source of frontier) {
          const nearby = [...unassigned]
            .map(star => ({ star, d: distance(source, star) }))
            .filter(obj => obj.d < LINK_DISTANCE)
            .sort((a, b) => a.d - b.d);
  
          const toAdd = Math.min(nearby.length, 1 + Math.floor(Math.random() * 3));
  
          for (let j = 0; j < toAdd; j++) {
            const candidate = nearby[j]?.star;
            if (candidate && !visited.has(candidate)) {
              candidate.civ = civ;
              civ.stars.push(candidate);
              nextFrontier.push(candidate);
              unassigned.delete(candidate);
              visited.add(candidate);
              anyAdded = true;
            }
          }
        }
  
        frontier = nextFrontier;
      }
  
      if (!anyAdded) break;
  
      extensionCount++;
      if (Math.random() < pStop) break;
    }
    for (const star of stars) {
      for (const planet of star.planets) {
        planet.civ = star.civ
      }
    }
  });

  const totalStars = stars.length;
  const maxAssigned = Math.floor(totalStars * 0.95);
  let assignedCount = totalStars - unassigned.size;
  const unassignedArray = [...unassigned];

  for (const star of unassignedArray) {
    if (assignedCount >= maxAssigned) break;

    let candidates = [];

    civilizations.forEach(civ => {
      if (civ.isVoid) return;

      for (const s of civ.stars) {
        if (distance(star, s) < LINK_DISTANCE) {
          candidates.push({ civ, d: distance(star, s) });
          break;
        }
      }
    });

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.d - b.d);
      const chosen = candidates[0].civ;
      star.civ = chosen;
      chosen.stars.push(star);
      assignedCount++;
      unassigned.delete(star);
    }
  }
  stars.forEach(star => {
    if (!star.civ) return;
    let civ = civilizations.find(c => c.name === star.civ.name);
    if (civ) {
      civ.planetCount += star.planets.length;
    }
  });
  // bye bye void civs
  civilizations.forEach(civ => {
    if (civ.isVoid) {
      civ.stars.forEach(star => delete star.civ);
      civ.stars = [];
    }
  });
}

function lineBetweenRings(aX, aY, bX, bY, rA, rB) {
  const dx = bX - aX;
  const dy = bY - aY;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const epsilon = 0.5;

  if (dist === 0 || dist < rA + rB + epsilon * 2) {
    return null;
  }

  const ux = dx / dist;
  const uy = dy / dist;

  const startX = aX + ux * (rA + epsilon);
  const startY = aY + uy * (rA + epsilon);

  const endX = bX - ux * (rB + epsilon);
  const endY = bY - uy * (rB + epsilon);

  return { startX, startY, endX, endY };
}

function drawCivilizations(ctx, camera) {
  if (zoom > ZOOM_THRESHOLD_FOR_CIVS) return;

  civilizations.forEach(civ => {
    if (!civ.color) return;

    ctx.strokeStyle = civ.color;
    ctx.fillStyle = civ.color;
    ctx.globalAlpha = 0.3;

    for (let i = 0; i < civ.stars.length; i++) {
      const star = civ.stars[i];

      const screenX = star.x - camera.x;
      const screenY = star.y - camera.y;

      const baseRadius = 100 + star.radius;
      const ringThickness = 10;

      ctx.globalAlpha = 1;
      ctx.lineWidth = ringThickness;
      ctx.strokeStyle = civ.color;

      ctx.beginPath();
      ctx.arc(screenX, screenY, baseRadius + ringThickness, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.globalAlpha = 1.0;
      ctx.lineWidth = civilizationLineWidth;

      for (let j = i + 1; j < civ.stars.length; j++) {
        const otherStar = civ.stars[j];
        if (distance(star, otherStar) < LINK_DISTANCE) {
          const otherScreenX = otherStar.x - camera.x;
          const otherScreenY = otherStar.y - camera.y;

          const line = lineBetweenRings(
            screenX,
            screenY,
            otherScreenX,
            otherScreenY,
            baseRadius + ringThickness,
            100 + otherStar.radius + ringThickness
          );

          if (line) {
            ctx.beginPath();
            ctx.moveTo(line.startX, line.startY);
            ctx.lineTo(line.endX, line.endY);
            ctx.stroke();
          }
        }
      }
    }
  });
}
function generateSpiralGalaxy(
  starCount,
  centerX,
  centerY,
  arms = 4,
  spread = 0.15,
  radiusMax = 30000,
  coreFraction = 0.05,
  coreRadiusFraction = 0.05
) {
  const stars = [];
  const twoPi = Math.PI * 2;

  const baseRadius = 30000;
  const baseTwist = 7;

  let twistFactor = baseTwist * (baseRadius / radiusMax);
  twistFactor *= Math.log(arms + 1);
  twistFactor = Math.min(Math.max(twistFactor, 1.5), 10);

  const coreStarCount = Math.floor(starCount * coreFraction);
  const coreRadius = radiusMax * coreRadiusFraction;
  //core
  for (let i = 0; i < coreStarCount; i++) {
    const distance = Math.pow(Math.random(), 3) * coreRadius;
    const angle = Math.random() * twoPi;

    const x = centerX + distance * Math.cos(angle);
    const y = centerY + distance * Math.sin(angle);

    let star;
    let attempts = 0;
    do {
      star = generateStar();
      star.x = x;
      star.y = y;
      attempts++;
    } while (isTooClose(star, stars) && attempts < 5);

    if (attempts < 5) stars.push(star);
  }

  const starsPerArm = Math.floor((starCount - coreStarCount) / arms);

  for (let arm = 0; arm < arms; arm++) {
    for (let i = 0; i < starsPerArm; i++) {
      const t = i / starsPerArm;
      const distance = coreRadius + t * (radiusMax - coreRadius) * (0.7 + 0.3 * Math.random());
      const baseAngle = (arm / arms) * twoPi;
      const angleOffset = twistFactor * Math.log(distance + 1);
      const angle = baseAngle + angleOffset + (Math.random() - 0.5) * spread;

      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      let star;
      let attempts = 0;
      do {
        star = generateStar();
        star.x = x;
        star.y = y;
        attempts++;
      } while (isTooClose(star, stars) && attempts < 5);

      if (attempts < 5) stars.push(star);
    }
  }

  return stars;
}



function generateGalaxy(starCount, centerX, centerY) {
  const isSpiral = Math.random() >= 0.2; //spiral or random type?
  const stars = [];

//center bh
  const supermassive = generateStar();
  supermassive.radius *= 25 * Math.random() + 25
  supermassive.type = 'Black Hole';
  supermassive.color = 'black';
  //supermassive.density *= 0.05 //sorry you are too big
  supermassive.mass *= (125 * Math.random()) + 50,
  //supermassive.mass = ((4/3) * Math.PI * (supermassive.radius**3)/* volume */) * supermassive.density
  supermassive.name = generateRandomName('Black Hole')
  supermassive.gravityRangeMult = 60   
  supermassive.x = centerX;
  supermassive.y = centerY;
  supermassive.planets = []//no planets ay
  if (isSpiral) {stars.push(supermassive)}//non spiral galaxies should spawn the bh after the star gen because its broken else

  const remainingStars = starCount - 1;//should we count it actually?
  if (isSpiral) {
    let coreFraction = Math.random() * 0.2 + 0.1
    let coreRadiusFraction = coreFraction + (Math.random() * 0.4 - 0.2)
    const spiralStars = generateSpiralGalaxy(
      remainingStars,
      centerX,
      centerY,
      Math.floor(((maxGalaxyBranches - minGalaxyBranches) * Math.random()) + minGalaxyBranches),
      0.35 * Math.random() + 0.35,
      universeSize * 0.4,
      //(Math.random() * 3) + 3.5,
      coreFraction,
      coreRadiusFraction
    );
    stars.push(...spiralStars);
  } else {
    const maxRadius = universeSize * 0.4;

    for (let i = 0; i < remainingStars; i++) {
      const distance = Math.pow(Math.random(), 1.5) * maxRadius;//+center = + density
      const angle = Math.random() * Math.PI * 2;

      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      let star;
      let attempts = 0;
      do {
        star = generateStar();
        star.x = x;
        star.y = y;
        attempts++;
      } while (isTooClose(star, stars) && attempts < 10);

      if (attempts < 10) stars.push(star);
    }
    stars.push(supermassive)
  }
  generateCivilizations(stars)
  return stars;
}

const centerX = universeSize / 2;
const centerY = universeSize / 2;
var stars = generateGalaxy(starCount, centerX, centerY);//it could be a const but since we want to push stars later...... well
function regenerateGalaxy() {
  stars = generateGalaxy(starCount, centerX, centerY);
}
//const stars = generateSpiralGalaxy(starCount, centerX, centerY, Math.floor(((maxGalaxyBranches - minGalaxyBranches) * Math.random()) + minGalaxyBranches), 0.5 * Math.random() + 0.2, universeSize * 0.4, (Math.random() * 4.5) + 0.5);
/*const stars = [];
for (let i = 0; i < starCount; i++) {
  let star;
  do { star = generateStar(); }
  while (isTooClose(star, stars));
  stars.push(star);
}*/
function getSpawn(stars) {
  const allPlanets = stars.flatMap(star => star.planets.map(p => ({ planet: p, star })));

  //habitable planets thing
  const habitablePlanets = allPlanets.filter(({ planet }) =>
    planet.a >= 200 &&
    planet.a <= 400 &&
    planet.e <= 0.05 &&
    planet.civ &&
    planet.radius > 0.7/* &&
    planet.civ.planetCount < 5*/
  );
  if (habitablePlanets.length > 0) {
    const { planet, star } = getRandom(habitablePlanets);

    const r = planet.a * (1 - planet.e * planet.e) / (1 + planet.e * Math.cos(planet.angle));
    const xLocal = r * Math.cos(planet.angle);
    const yLocal = r * Math.sin(planet.angle);
    const xRot = xLocal * Math.cos(planet.rotation) - yLocal * Math.sin(planet.rotation);
    const yRot = xLocal * Math.sin(planet.rotation) + yLocal * Math.cos(planet.rotation);

    if (options.name) {
      planet.civ.name = options.name;
    }
    if (options.color) {
      planet.civ.color = options.color;
    }
    if (mediocreSpawn) {
  const removedStars = planet.civ.stars.filter(s => s != planet.star);
  removedStars.forEach(s => s.civ = null);
  planet.civ.stars = planet.civ.stars.filter(s => s == planet.star);
    }
    return {
      x: star.x + xRot,
      y: star.y + yRot,
      shipCiv: planet.civ,
      shipColor: planet.civ.color
    };
  }/* else {
    regenerateGalaxy()
  }*/
  if (allPlanets.length > 0) {
    const { planet, star } = getRandom(allPlanets);

    const r = planet.a * (1 - planet.e * planet.e) / (1 + planet.e * Math.cos(planet.angle));
    const xLocal = r * Math.cos(planet.angle);
    const yLocal = r * Math.sin(planet.angle);
    const xRot = xLocal * Math.cos(planet.rotation) - yLocal * Math.sin(planet.rotation);
    const yRot = xLocal * Math.sin(planet.rotation) + yLocal * Math.cos(planet.rotation);

    return {
      x: star.x + xRot,
      y: star.y + yRot,
      shipCiv: planet.civ || null,
      shipColor: (planet.civ && planet.civ.color) || null,
      /*planet: planet,
      star: star*/
    };
  }

/*//ultra rare case where theres no planets lul
  const star = getRandom(stars);
  return { x: star.x, y: star.y };*/
}
var spawn = getSpawn(stars);
/*const spawnPlanet = spawn.planet
const spawnStar = spawn.star*/
let ship = {
  x: spawn.x,
  y: spawn.y,
  speedX: 0,
  speedY: 0,
  radius: 1,
  mass: 1,
  direction: 0,
  control: 0,
  landed: null/*{spawnPlanet, spawnStar}*/,
  targetDirection: null,
  isTurning: false,
  lockedOn: null,
  civ: spawn.shipCiv,
  color: spawn.shipColor
};
const keys = {};
let mouseX = 0, mouseY = 0;
let draggingStar = null;
let isDragging = false;

window.addEventListener("keydown", e => {
  keys[e.key] = true;

  switch (e.key.toLowerCase()) {
    /*case '+':
    case '=':
      zoom *= 1.1;
      break;
    case '-':
      zoom /= 1.1;
      break;*/
    case 't': {
      const worldX = ship.x - canvas.width / 2 / zoom + mouseX / zoom;
      const worldY = ship.y - canvas.height / 2 / zoom + mouseY / zoom;
      ship.x = worldX;
      ship.y = worldY;
      ship.landed = null;
      ship.speedX = 0;
      ship.speedY = 0;
      ship.cachedOrbit = null
      break;
    }
    case 'z':
      if (!draggingStar) {
        const worldX = ship.x - canvas.width / 2 / zoom + mouseX / zoom;
        const worldY = ship.y - canvas.height / 2 / zoom + mouseY / zoom;

        for (const star of stars) {
          const dx = worldX - star.x;
          const dy = worldY - star.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < star.radius * 2) {
            draggingStar = star;
            break;
          }
        }
      }
      break;
    case 'u':
      ship.lockedOn = "prograde";
      break;
    case 'i':
      ship.lockedOn = "retrograde";
      break;
    case 'o':
      ship.lockedOn = "radial";
      break;
    case 'p':
      ship.lockedOn = "anti-radial";
      break;
  }
});

window.addEventListener("keyup", e => {
  keys[e.key] = false;

  if (e.key.toLowerCase() === 'z') {
    draggingStar = null;
  }
});

canvas.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

canvas.addEventListener("click", e => {
  const worldX = ship.x - canvas.width / 2 / zoom + e.clientX / zoom;
  const worldY = ship.y - canvas.height / 2 / zoom + e.clientY / zoom;

  let found = false;

  for (const star of stars) {
    const dx = worldX - star.x;
    const dy = worldY - star.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < star.radius) {
      showInfoPanel(star, "star");
      found = true;
      break;
    }

    for (const planet of star.planets) {
      const r = planet.a * (1 - planet.e * planet.e) / (1 + planet.e * Math.cos(planet.angle));
      const xLocal = r * Math.cos(planet.angle);
      const yLocal = r * Math.sin(planet.angle);
      const xRot = xLocal * Math.cos(planet.rotation) - yLocal * Math.sin(planet.rotation);
      const yRot = xLocal * Math.sin(planet.rotation) + yLocal * Math.cos(planet.rotation);
      const px = star.x + xRot;
      const py = star.y + yRot;
      const dxP = worldX - px;
      const dyP = worldY - py;

      if (Math.sqrt(dxP * dxP + dyP * dyP) < planet.radius * 6) {
        showInfoPanel(planet, "planet");
        found = true;
        break;
      }
    }

    if (found) break;
  }

  if (!found) {
    document.getElementById("infoPanel").style.display = "none";
  }
});

function checkCollision(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy) < r1 + r2;
}
function predictOrbit(ship, star, steps = 2000, dt = 1) {
  const predictedPath = [];
  let px = ship.x;
  let py = ship.y;
  let vx = ship.speedX;
  let vy = ship.speedY;

  let minDist = Infinity;
  let maxDist = 0;
  let periapsis = null;
  let apoapsis = null;
  let crashPoint = null;

  for (let i = 0; i < steps; i++) {
    const dx = star.x - px;
    const dy = star.y - py;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);

    if (dist < star.radius) {
      crashPoint = { x: px, y: py };
      break;
    }

    if (dist < minDist) {
      minDist = dist;
      periapsis = { x: px, y: py };
    }

    if (dist > maxDist) {
      maxDist = dist;
      apoapsis = { x: px, y: py };
    }

    const force = G * star.mass / distSq;
    const ax = force * dx / dist;
    const ay = force * dy / dist;
    vx += ax * dt;
    vy += ay * dt;
    px += vx * dt;
    py += vy * dt;
    predictedPath.push({ x: px, y: py });
  }

  return {
    path: predictedPath,
    crashPoint,
    periapsis,
    apoapsis
  };
}
function calculatePlanetTemperature(starTemp, distance, k = 0.5) {
  if (distance <= 0) return 0;
  return starTemp * Math.pow(1 / distance, k);
}
let collisionMessage = "";
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (keys["ArrowUp"]) {
    ship.speedX += Math.cos(ship.direction) * shipSpeed;
    ship.speedY += Math.sin(ship.direction) * shipSpeed;
  }
  if (keys["ArrowDown"]) {
    ship.speedX -= Math.cos(ship.direction) * shipSpeed;
    ship.speedY -= Math.sin(ship.direction) * shipSpeed;
  }
  if (keys["ArrowLeft"])  ship.direction -= shipRotation;
  if (keys["ArrowRight"]) ship.direction += shipRotation;
  
  if (keys["ArrowUp"] || keys["ArrowDown"]) {
    ship.control = true;
  } else {
    ship.control = false;
  }
  if (keys["ArrowLeft"] || keys["ArrowRight"]) {
    ship.isTurning = true;
  } else {
    ship.isTurning = false
  }
  
  const dominantStar = getStrongestGravitySource(ship, stars/*, distanceMultWhenCalculatingParentStar*/);//not realistic but proximity should be buffed
  const nearestStars = getNearestStars(ship, stars/*, distanceMultWhenCalculatingParentStar*/, maxStarsWithPlanetsOnScreen)
  if (!ship.landed && dominantStar) {
    const starChanged = dominantStar !== ship.lastOrbitSource;
    if (ship.control || starChanged) {
      const dx = dominantStar.x - ship.x, dy = dominantStar.y - ship.y, distSq = dx * dx + dy * dy;
      if (distSq < gravityRangeSq * dominantStar.gravityRangeMult && distSq > (dominantStar.radius + ship.radius) ** 2) {
      //const dx = dominantStar.x - ship.x, dy = dominantStar.y - ship.y, dist = Math.sqrt(dx * dx + dy * dy)
      ship.cachedOrbit = predictOrbit(ship, dominantStar, orbitPredictionLen, 1);
      ship.lastOrbitSource = dominantStar;
      } else {
        ship.cachedOrbit = null
      }
    }
  }
if(dominantStar) {
  let star = dominantStar
    const dx = star.x - ship.x, dy = star.y - ship.y, distSq = dx * dx + dy * dy;
    if (distSq < gravityRangeSq * star.gravityRangeMult && distSq > (star.radius + ship.radius) ** 2) {
      const r = Math.sqrt(distSq);
      const force = (G * star.mass * ship.mass) / distSq;
      ship.speedX += (force * dx / r / ship.mass)
      ship.speedY += (force * dy / r / ship.mass)
    }
}
  

  ship.x += ship.speedX;
  ship.y += ship.speedY;
  function normalizeAngle(angle) {//else it bugs bru
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }
  if (ship.lockedOn != null) {
    const velocityAngle = Math.atan2(ship.speedY, ship.speedX);
  if (ship.lockedOn == "prograde") {
    ship.targetDirection = velocityAngle;
  } else if (ship.lockedOn == "retrograde") {
    ship.targetDirection = velocityAngle + Math.PI;
  } else if (ship.lockedOn == "radial") {
    ship.targetDirection = velocityAngle + Math.PI / 2;
  } else if (ship.lockedOn == "anti-radial") {
    ship.targetDirection = velocityAngle - Math.PI / 2;
  }
  }
  if (ship.isTurning) {
    ship.lockedOn = null
  }
  if (ship.lockedOn != null && ship.targetDirection != null && !ship.isTurning) {
  const angleDiff = normalizeAngle(ship.targetDirection - ship.direction);
  if (Math.abs(angleDiff) < shipRotation) {
    ship.direction = ship.targetDirection;
  } else {
    ship.direction += Math.sign(angleDiff) * shipRotation;
  }
  //direction end
}
if (draggingStar) {
  const worldX = ship.x - (canvas.width / 2) / zoom + mouseX / zoom;
  const worldY = ship.y - (canvas.height / 2) / zoom + mouseY / zoom;
  draggingStar.x = worldX;
  draggingStar.y = worldY;
}
if (ship.x > universeSize) {
  ship.x = 0; //Wrap to the left side
} else if (ship.x < 0) {
  ship.x = universeSize; //Wrap to the right side
}

if (ship.y > universeSize) {
  ship.y = 0; //Wrap to the top
} else if (ship.y < 0) {
  ship.y = universeSize; //Wrap to the bottom
}
  collisionMessage = "";
  for (const star of stars) {
    if (checkCollision(ship.x, ship.y, ship.radius, star.x, star.y, star.radius)) {
      collisionMessage = "Collided with a star!";
      ship.speedX = -ship.speedX
      ship.speedY = -ship.speedY
      break;
    }
    for (const planet of star.planets) {
      /*if (getStrongestGravitySource(planet, stars) != ) {

      }*/
      if (checkCollision(ship.x, ship.y, ship.radius, planet.x, planet.y, planet.radius * planetLandedRadiusMultiplier)) {
        //collisionMessage = "Landed on a planet!";
        if(!ship.control) 
        {
          //ship.x = px
          //ship.y = py
          ship.landed = {planet, star}
        } else {
        ship.landed = false
        }
        break;
      }
    }
    if (collisionMessage) break;
  }
  if (ship.landed && ship.landed.planet != undefined && ship.landed.star != undefined) {
    const p = ship.landed.planet;
    const star = ship.landed.star;
    const r = p.a * (1 - p.e * p.e) / (1 + p.e * Math.cos(p.angle));
    var orbitalVelocity = Math.sqrt(G * star.mass * (2 / r - 1 / p.a));
    const angle = p.angle;
    if (star.planetsTurnAntiClockwise == 1) {orbitalVelocity = -orbitalVelocity}
    const xLocal = r * Math.cos(angle);
    const yLocal = r * Math.sin(angle);
  
    const cosR = Math.cos(p.rotation);
    const sinR = Math.sin(p.rotation);
  
    const xRot = xLocal * cosR - yLocal * sinR;
    const yRot = xLocal * sinR + yLocal * cosR;
  
    ship.x = star.x + xRot;
    ship.y = star.y + yRot;
  
    const vxLocal = -Math.sin(angle) * orbitalVelocity;
    const vyLocal =  Math.cos(angle) * orbitalVelocity;
  
    const vxGlobal = vxLocal * cosR - vyLocal * sinR;
    const vyGlobal = vxLocal * sinR + vyLocal * cosR;
  
    ship.speedX = vxGlobal;
    ship.speedY = vyGlobal;
  }
  
  const speed = Math.sqrt(ship.speedX ** 2 + ship.speedY ** 2);
  hud.innerText = `Speed: ${speed.toFixed(2)}km/s`;

ctx.save();
ctx.scale(zoom, zoom);
const camX = ship.x - canvas.width / 2 / zoom;
const camY = ship.y - canvas.height / 2 / zoom;
const camera = { x: camX, y: camY};
//draw ship's orbit
  
if (ship.cachedOrbit && ship.cachedOrbit.path && ship.cachedOrbit.path.length > 1 && !ship.landed) {
  const orbit = ship.cachedOrbit;

  ctx.beginPath();
  ctx.moveTo(orbit.path[0].x - camX, orbit.path[0].y - camY);
  for (let i = 1; i < orbit.path.length; i++) {
    const pt = orbit.path[i];
    ctx.lineTo(pt.x - camX, pt.y - camY);
  }
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // captitain we have a problem moment (crash)
  if (orbit.crashPoint) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(orbit.crashPoint.x - camX, orbit.crashPoint.y - camY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // peri
  if (orbit.periapsis && !orbit.crashPoint) {
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(orbit.periapsis.x - camX, orbit.periapsis.y - camY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // apo
  if (orbit.apoapsis) {
    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(orbit.apoapsis.x - camX, orbit.apoapsis.y - camY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

  for (const star of stars) {//lets draw stuff
    const sx = star.x - camX;
    const sy = star.y - camY;

    drawBody(ctx, sx, sy, star, camera, zoom)

    for (const planet of star.planets) {
      //Thanks Kepler
      const r = planet.a * (1 - planet.e * planet.e) / (1 + planet.e * Math.cos(planet.angle));
      const orbitalVelocity = Math.sqrt(G * star.mass * (2 / r - 1 / planet.a));
      if (star.planetsTurnAntiClockwise == 1) {planet.angle -= orbitalVelocity / r}else {planet.angle += orbitalVelocity / r}
      //position
      const xLocal = r * Math.cos(planet.angle);
      const yLocal = r * Math.sin(planet.angle);
      //rotation
      const cosR = Math.cos(planet.rotation);
      const sinR = Math.sin(planet.rotation);
      
      const xRot = xLocal * cosR - yLocal * sinR;
      const yRot = xLocal * sinR + yLocal * cosR;
      //final pos
      const px = star.x + xRot;
      const py = star.y + yRot;
      planet.x = px;
      planet.y = py;
      planet.distance = distance(planet, star)
  /*if (ship.landed) {
  //For Ship Getting Velocity Of The Planet
  const vxLocal = -Math.sin(planet.angle) * orbitalVelocity;
  const vyLocal =  Math.cos(planet.angle) * orbitalVelocity;
  const vxGlobal = vxLocal * cosR - vyLocal * sinR;
  const vyGlobal = vxLocal * sinR + vyLocal * cosR;
    ship.speedX = vxGlobal;
    ship.speedY = vyGlobal;
    ship.x = px;
    ship.y = py;
  }*/
      const screenX = px - camX;
      const screenY = py - camY;
      if (checkCollision(planet.x, planet.y, planet.radius, planet.star.x, planet.star.y, planet.star.radius)) {
        //if (dominantStar.planets.includes(planet)) {
          planet.star.planets = planet.star.planets.filter(p => p !== planet)
        /*if (planet.star.civ) {
          planet.star.civ.planetCount--
        }*/

      /*} else {
          stars.forEach(star => {
            if (star.planets.includes(planet)) {
              stars = stars.filter(p => p !== star)
            }
          })
      }*/
      }
      nearestStars.forEach(s => {
      if (s.planets.includes(planet)) {
      if (zoom > nameVisibilityZoomThreshold / 1.5/* && Math.sqrt(Math.pow((dominantStar.x - ship.x), 2) + Math.pow((dominantStar.y - ship.y), 2)) < 1000*/) {ctx.beginPath();
      ctx.ellipse(
        sx - planet.c * Math.cos(planet.rotation),
        sy - planet.c * Math.sin(planet.rotation),
        planet.a, planet.b,
        planet.rotation,
        0, Math.PI * 2
      );
      ctx.strokeStyle = planet.cachedColorOrbit;
      ctx.stroke();
      drawBody(ctx, screenX, screenY, planet, camera, zoom)
    }}
  })
  nearestStars.forEach(star => {
    star.planets.forEach(planet => {
      planet.temperature = calculatePlanetTemperature(star.temperature, distance(planet, star));
    });
  });
      if (zoom > nameVisibilityZoomThreshold) {
        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.fillText(planet.name, screenX - ctx.measureText(planet.name).width / 2, screenY + planet.radius + 12);
      }
    }

    if (zoom > nameVisibilityZoomThreshold) {
      ctx.fillStyle = "white";
      ctx.font = "14px Arial";
      ctx.fillText(star.name, sx - ctx.measureText(star.name).width / 2, sy + star.radius + 14);
    }
  }
  drawCivilizations(ctx, camera);
  ctx.restore();
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(ship.direction);//ship
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(-10, -7);
  ctx.lineTo(-10, 7);
  ctx.closePath();
  ctx.fillStyle = ship.color;
  ctx.fill();
  ctx.restore();

  if (collisionMessage) {
    ctx.fillStyle = "red";
    ctx.font = "30px Arial";
    ctx.fillText(collisionMessage, canvas.width / 2 - 150, canvas.height / 2);
  }
  if (keys['+'] || keys['=']) {
    zoom *= zoomStr;
  }
  if (keys['-']) {
    zoom /= zoomStr;
  }
  requestAnimationFrame(gameLoop);
}
//DOESN'T WORK
/*function cleanStars(civilizations) {
  civilizations.forEach(civ => {
    civ.stars = civ.stars.filter(star => star.civ.name === civ.name);
  });
}*/
/*function reassignStarsToCivilizations(civilizations, stars) {
  civilizations.forEach(civ => civ.star = []);
  
  for (const star of stars) {
    if (!star.civ) {
      star.civ = null; 
      continue;
    }
    
    const civ = civilizations.find(c => c.name === star.civ.name);
    
    if (civ) {
      star.civ = civ;
      civ.star.push(star);
    } else {
      star.civ = null;
    }
  }
}*/

function updateCivilizationPlanetCounts() {
  for (let civ of civilizations) {
      civ.planetCount = 0;
  }
  for (let star of stars) {
      for (let planet of star.planets) {
          planet.civ = planet.star.civ
          if (planet.civ) {
              planet.civ.planetCount++;
          }
      }
  }
}
function getNearestStarsWithStar(targetStar, stars) {
  let minDist = Infinity;
  let nearest = null;

  for (const s of stars) {
    if (s === targetStar) continue;
    const dist = distance(targetStar, s);
    if (dist < minDist) {
      minDist = dist;
      nearest = s;
    }
  }

  return nearest;
}

function destroyStar(starToDestroy) {
  stars = stars.filter(s => s !== starToDestroy);
  for (const civ of civilizations) {
    if (civ.stars) {
      civ.stars = civ.stars.filter(s => s !== starToDestroy);
    }
  }
}
function mergeStars(moreMassive, lessMassive) {
  moreMassive.mass += lessMassive.mass;
  const volume1 = Math.pow(moreMassive.radius, 3);
  const volume2 = Math.pow(lessMassive.radius, 3);
  const totalVolume = volume1 + volume2;
  moreMassive.radius = Math.cbrt(totalVolume);
}
function collideStars() {
  let merged;

  do {
    merged = false;
    const toRemove = new Set();

    for (const star of stars) {
      if (toRemove.has(star)) continue;

      const nearest = getNearestStarsWithStar(star, stars);
      if (!nearest || toRemove.has(nearest)) continue;

      if (checkCollision(star.x, star.y, star.radius, nearest.x, nearest.y, nearest.radius)) {
        const [moreMassive, lessMassive] = star.mass >= nearest.mass
          ? [star, nearest]
          : [nearest, star];
          mergeStars(moreMassive, lessMassive)
        toRemove.add(lessMassive);
        merged = true;
      }
    }

    if (merged) {
      for (const star of toRemove) {
        destroyStar(star);
      }
    }

  } while (merged);
}

function dirtyCheck() {//Function that doesn't run every frame for optimization
  //cleanStars(civilizations)
  //reassignStarsToCivilizations(civilizations, stars)
  updateCivilizationPlanetCounts()
}
function dirtyCheckFaster() {
  collideStars()
}
setInterval(dirtyCheck, 2200);
setInterval(dirtyCheckFaster, 1000);
gameLoop();