(() => {
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
  function getTemperature(minTemp = 2500, maxTemp = 40000, biasExponent = 3) {//Kelvins
    const rand = Math.random();
    const biased = Math.pow(rand, biasExponent);
    const temperature = biased * (maxTemp - minTemp) + minTemp
    return temperature
  }
    const container = document.getElementById('parallax-background');
    const layers = [];
    const layerCount = 10;
    function createStarLayer(menuStarCount, starSizeRange, color='white') {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
  
      for (let i = 0; i < menuStarCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 0.25 * Math.random() * (starSizeRange[1] - starSizeRange[0]) + starSizeRange[0];
        ctx.fillStyle = colorViaTemperature(getTemperature());
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
  
      return canvas;
    }
    for (let i = 0; i < layerCount; i++) {
      const layerDiv = document.createElement('div');
      layerDiv.className = 'parallax-layer';
      layerDiv.style.zIndex = i;
      layerDiv.style.backgroundImage = `url(${createStarLayer(
        10 * (i+1),
        [0.5, 1.5 + i]
      ).toDataURL()})`;
      container.appendChild(layerDiv);
      layers.push(layerDiv);
    }
  
    let mouseX = 0, mouseY = 0;
  
    window.addEventListener('mousemove', e => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
    });
  
    function animate() {
      const scrollY = window.scrollY;
    
      layers.forEach((layer, i) => {
        const speed = 0.1 * (i + 1);
        const mouseOffsetX = (mouseX - 0.5) * 100 * speed;
        const mouseOffsetY = (mouseY - 0.5) * 100 * speed;
    
        const bgPosX = speed + mouseOffsetX;
        const bgPosY = -scrollY * speed + mouseOffsetY;
    
        layer.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
      });
    
      requestAnimationFrame(animate);
    }
    
  
    animate();
  })();
  const defaultOptions = {
    name: '',
    color: '#00ff00',
    gravity: '0.008',
    speed: '0.003',
    maxOrbit: '5000',
    mediocreSpawn: true
    /*volume: 50,
    difficulty: 'medium'*/
  }
function startGame() {
  window.scrollTo(0, 0);
  document.body.style.height = '100vh';
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
    const parallax = document.getElementById('parallax-background');
    if (parallax) {
      parallax.style.display = 'none';
    }
    const menu = document.getElementById('menu');
    menu.classList.add('fade-out');
    setTimeout(() => {
      menu.style.display = 'none';
      const script = document.createElement('script');
      script.src = 'main.js';
      /*script.onload = () => {
        if (typeof initGame === 'function') {
          initGame();
        }
      };*/
      document.body.appendChild(script);
    }, 1);
  }
  (() => {
    const saved = localStorage.getItem('gameOptions');
    if (saved) {
      window.menu = { options: JSON.parse(saved) };
    } else {
      window.menu = {
        options: {
          name: defaultOptions.name,
          color: defaultOptions.color,
          gravity: defaultOptions.gravity,
          speed: defaultOptions.speed,
          maxOrbit: defaultOptions.maxOrbit,
          mediocreSpawn: defaultOptions.mediocreSpawn
          /*volume: defaultOptions.volume,
          difficulty: defaultOptions.difficulty,*/
        }
      };
    }
    window.onload = () => {
      const opts = window.menu.options;
      document.getElementById('opt-name').value = opts.name || defaultOptions.name;
      document.getElementById('opt-color').value = opts.color || defaultOptions.color;
      document.getElementById('opt-gravity').value = opts.gravity || defaultOptions.gravity;
      document.getElementById('opt-speed').value = opts.speed || defaultOptions.speed;
      document.getElementById('opt-maxOrbit').value = opts.maxOrbit || defaultOptions.maxOrbit;
      document.getElementById('opt-mediocreSpawn').checked = opts.mediocreSpawn || defaultOptions.mediocreSpawn;
      /*document.getElementById('opt-volume').value = opts.volume || defaultOptions.volume;
      document.getElementById('opt-difficulty').value = opts.difficulty || defaultOptions.difficulty;*/
    };

  })();
  function saveOptions() {
    const name = document.getElementById('opt-name').value.trim();
    const color = document.getElementById('opt-color').value;
    const gravity = document.getElementById('opt-gravity').value;
    const speed = document.getElementById('opt-speed').value;
    const maxOrbit = document.getElementById('opt-maxOrbit').value;
    const mediocreSpawn = document.getElementById('opt-mediocreSpawn').checked
    /*const volume = parseInt(document.getElementById('opt-volume').value);
    const difficulty = document.getElementById('opt-difficulty').value;*/
    window.menu.options = {
      name,
      color,
      gravity,
      speed,
      maxOrbit,
      mediocreSpawn
      /*volume,
      difficulty,*/
    };
    localStorage.setItem('gameOptions', JSON.stringify(window.menu.options));
    backToMenu();
  }
  function openOptions() {
    window.scrollTo(0, 0);
    document.getElementById('menu').style.display = 'none';
    document.getElementById('options').style.display = 'block';
  }
  function openControls() {
    window.scrollTo(0, 0);
    document.getElementById('menu').style.display = 'none';
    document.getElementById('controls').style.display = 'block';
  }
  function showChangelog() {
    window.scrollTo(0, 0);
    document.getElementById('menu').style.display = 'none';
    document.getElementById('changelog').style.display = 'block';
    document.getElementById('changelogButton').style.display = 'block';
  }
  function resetOptions() {
    localStorage.getItem('gameOptions') == null;
    document.getElementById('opt-name').value = defaultOptions.name;
    document.getElementById('opt-color').value = defaultOptions.color;
    document.getElementById('opt-gravity').value = defaultOptions.gravity;
    document.getElementById('opt-speed').value =  defaultOptions.speed;
    document.getElementById('opt-maxOrbit').value =  defaultOptions.maxOrbit;
    document.getElementById('opt-mediocreSpawn').checked =  defaultOptions.mediocreSpawn;
    /*document.getElementById('opt-volume').value = defaultOptions.volume;
    document.getElementById('opt-difficulty').value = defaultOptions.difficulty;*/
  }
  function backToMenu() {
    document.getElementById('options').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('changelog').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    document.getElementById('changelogButton').style.display = 'none';
  }