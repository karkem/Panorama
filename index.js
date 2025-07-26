'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;
  var currentScene = null;

  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');
  var heightToggleElement = document.querySelector('#heightToggle');

  // Initialize view position storage
  var lastViewPositions = {};

  if (window.matchMedia) {
    var setMode = function() {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Coordinate logging on click
  panoElement.addEventListener('click', function(event) {
    if (!event.target.closest('.hotspot')) {
      var view = viewer.view();
      var params = view.parameters();
      
      // Convert to degrees for easier understanding
      var yawDeg = (params.yaw * 180/Math.PI).toFixed(2);
      var pitchDeg = (params.pitch * 180/Math.PI).toFixed(2);
      
      console.log("Current view parameters:");
      console.log(`Yaw: ${params.yaw.toFixed(4)} rad (${yawDeg}°)`);
      console.log(`Pitch: ${params.pitch.toFixed(4)} rad (${pitchDeg}°)`);
      console.log(`FOV: ${params.fov.toFixed(4)} rad`);
      
      // Show visual feedback
      var marker = document.createElement('div');
      marker.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        background: red;
        border-radius: 50%;
        pointer-events: none;
        transform: translate(-50%, -50%);
        left: ${event.clientX}px;
        top: ${event.clientY}px;
        z-index: 10000;
      `;
      document.body.appendChild(marker);
      setTimeout(() => marker.remove(), 1000);
    }
  });

  var scenes = data.scenes.map(function(data) {
    var urlPrefix = "tiles";
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + data.id + "/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    var geometry = new Marzipano.CubeGeometry(data.levels);

    var limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100*Math.PI/180, 120*Math.PI/180);
    var view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    data.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    data.infoHotspots.forEach(function(hotspot) {
      var element = createInfoHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    // Add imageHotspots
    if (data.imageHotspots) {
      data.imageHotspots.forEach(function(hs) {
        addSmartHotspot(
          scene, 
          hs.yaw, 
          hs.pitch, 
          hs.image || "", 
          hs.scale || 1.0, 
          hs.tilt || -45,
          hs.color || "rgba(255, 255, 255, 0.5)"  // Added color support
        );
      });
    }

    if (data.smartHotspots) {
      data.smartHotspots.forEach(function(h) {
        addSmartHotspot(scene, h.yaw, h.pitch, h.imageUrl, h.scale, h.angle);
      });
    }

    return {
      data: data,
      scene: scene,
      view: view
    };
  });

  // FIXED: Define heightScenes using the scenes array instead of APP_DATA.scenes
  var heightScenes = {
    ground: scenes.find(s => s.data.id === "100m_agl"),
    elevated: scenes.find(s => s.data.id === "225m_agl")
  };

  var autorotate = Marzipano.autorotate({
    yawSpeed: 0.03,
    targetPitch: 0,
    targetFov: Math.PI/2
  });
  if (data.settings.autorotateEnabled) {
    autorotateToggleElement.classList.add('enabled');
  }

  autorotateToggleElement.addEventListener('click', toggleAutorotate);

  // Add height toggle functionality with null check
  if (heightToggleElement) {
    heightToggleElement.addEventListener('click', function() {
      var isElevated = this.classList.contains('elevated');
      var targetScene = isElevated ? heightScenes.ground : heightScenes.elevated;
      switchScene(targetScene);
    });
  }

  if (screenfull.enabled && data.settings.fullscreenButton) {
    document.body.classList.add('fullscreen-enabled');
    fullscreenToggleElement.addEventListener('click', function() {
      screenfull.toggle();
    });
    screenfull.on('change', function() {
      if (screenfull.isFullscreen) {
        fullscreenToggleElement.classList.add('enabled');
      } else {
        fullscreenToggleElement.classList.remove('enabled');
      }
    });
  } else {
    document.body.classList.add('fullscreen-disabled');
  }

  sceneListToggleElement.addEventListener('click', toggleSceneList);

  if (!document.body.classList.contains('mobile')) {
    showSceneList();
  }

  scenes.forEach(function(scene) {
    var el = document.querySelector('#sceneList .scene[data-id="' + scene.data.id + '"]');
    if (el) {
      el.addEventListener('click', function() {
        switchScene(scene);
        if (document.body.classList.contains('mobile')) {
          hideSceneList();
        }
      });
    }
  });

  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');
  var viewInElement = document.querySelector('#viewIn');
  var viewOutElement = document.querySelector('#viewOut');

  var velocity = 0.7;
  var friction = 3;

  var controls = viewer.controls();
  if (viewUpElement) controls.registerMethod('upElement',    new Marzipano.ElementPressControlMethod(viewUpElement,     'y', -velocity, friction), true);
  if (viewDownElement) controls.registerMethod('downElement',  new Marzipano.ElementPressControlMethod(viewDownElement,   'y',  velocity, friction), true);
  if (viewLeftElement) controls.registerMethod('leftElement',  new Marzipano.ElementPressControlMethod(viewLeftElement,   'x', -velocity, friction), true);
  if (viewRightElement) controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement,  'x',  velocity, friction), true);
  if (viewInElement) controls.registerMethod('inElement',    new Marzipano.ElementPressControlMethod(viewInElement,  'zoom', -velocity, friction), true);
  if (viewOutElement) controls.registerMethod('outElement',   new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom',  velocity, friction), true);

  function sanitize(s) {
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  function switchScene(scene) {
  // Save current view parameters
  if (currentScene) {
    var currentSceneId = currentScene.data.id;
    lastViewPositions[currentSceneId] = currentScene.view.parameters();
  }

  stopAutorotate();

  // Restore saved view or use initial parameters
  var viewParams = lastViewPositions[scene.data.id] || scene.data.initialViewParameters;
  scene.view.setParameters(viewParams);

  scene.scene.switchTo();
  currentScene = scene;  // Track the active scene

  startAutorotate();
  updateSceneName(scene);
  updateSceneList(scene);

  if (heightToggleElement) {
    if (scene === heightScenes.elevated) {
      heightToggleElement.classList.add('elevated');
    } else {
      heightToggleElement.classList.remove('elevated');
    }
  }
}


  function updateSceneName(scene) {
    sceneNameElement.innerHTML = sanitize(scene.data.name);
  }

  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];
      if (el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    }
  }

  function showSceneList() {
    sceneListElement.classList.add('enabled');
    sceneListToggleElement.classList.add('enabled');
  }

  function hideSceneList() {
    sceneListElement.classList.remove('enabled');
    sceneListToggleElement.classList.remove('enabled');
  }

  function toggleSceneList() {
    sceneListElement.classList.toggle('enabled');
    sceneListToggleElement.classList.toggle('enabled');
  }

  function startAutorotate() {
    if (!autorotateToggleElement.classList.contains('enabled')) {
      return;
    }
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }

  function toggleAutorotate() {
    if (autorotateToggleElement.classList.contains('enabled')) {
      autorotateToggleElement.classList.remove('enabled');
      stopAutorotate();
    } else {
      autorotateToggleElement.classList.add('enabled');
      startAutorotate();
    }
  }

  function createLinkHotspotElement(hotspot) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot', 'link-hotspot');
    var icon = document.createElement('img');
    icon.src = 'img/link.png';
    icon.classList.add('link-hotspot-icon');

    var transformProperties = [ '-ms-transform', '-webkit-transform', 'transform' ];
    for (var i = 0; i < transformProperties.length; i++) {
      var property = transformProperties[i];
      icon.style[property] = 'rotate(' + hotspot.rotation + 'rad)';
    }

    wrapper.addEventListener('click', function() {
      switchScene(findSceneById(hotspot.target));
    });

    stopTouchAndScrollEventPropagation(wrapper);

    var tooltip = document.createElement('div');
    tooltip.classList.add('hotspot-tooltip', 'link-hotspot-tooltip');
    tooltip.innerHTML = findSceneDataById(hotspot.target).name;

    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);

    return wrapper;
  }

  function createInfoHotspotElement(hotspot) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot', 'info-hotspot');

    var header = document.createElement('div');
    header.classList.add('info-hotspot-header');

    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');
    var icon = document.createElement('img');
    icon.src = 'img/info.png';
    icon.classList.add('info-hotspot-icon');
    iconWrapper.appendChild(icon);

    var titleWrapper = document.createElement('div');
    titleWrapper.classList.add('info-hotspot-title-wrapper');
    var title = document.createElement('div');
    title.classList.add('info-hotspot-title');
    title.innerHTML = hotspot.title;
    titleWrapper.appendChild(title);

    var closeWrapper = document.createElement('div');
    closeWrapper.classList.add('info-hotspot-close-wrapper');
    var closeIcon = document.createElement('img');
    closeIcon.src = 'img/close.png';
    closeIcon.classList.add('info-hotspot-close-icon');
    closeWrapper.appendChild(closeIcon);

    header.appendChild(iconWrapper);
    header.appendChild(titleWrapper);
    header.appendChild(closeWrapper);

    var text = document.createElement('div');
    text.classList.add('info-hotspot-text');
    text.innerHTML = hotspot.text;

    wrapper.appendChild(header);
    wrapper.appendChild(text);

    var modal = document.createElement('div');
    modal.innerHTML = wrapper.innerHTML;
    modal.classList.add('info-hotspot-modal');
    document.body.appendChild(modal);

    var toggle = function() {
      wrapper.classList.toggle('visible');
      modal.classList.toggle('visible');
    };

    wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);
    modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggle);
    stopTouchAndScrollEventPropagation(wrapper);

    return wrapper;
  }

  function stopTouchAndScrollEventPropagation(element) {
    var eventList = [ 'touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel', 'mousewheel' ];
    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], function(event) {
        event.stopPropagation();
      });
    }
  }

  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) {
        return scenes[i];
      }
    }
    return null;
  }

  function findSceneDataById(id) {
    for (var i = 0; i < data.scenes.length; i++) {
      if (data.scenes[i].id === id) {
        return data.scenes[i];
      }
    }
    return null;
  }

  function addSmartHotspot(scene, yaw, pitch, imageUrl = "", scale = 1.0, tilt = 0, color = "rgba(255, 255, 255, 0.5)") {
    // Create container
    const container = document.createElement("div");
    container.className = "smart-hotspot-container";
    container.style.width = `${50 * scale}px`;
    container.style.height = `${50 * scale}px`;
    
    // Create visual element
    const visual = document.createElement("div");
    visual.className = "smart-hotspot-visual";
    
    // Apply transformations and color
    const scaleY = Math.cos((tilt * Math.PI) / 180);
    visual.style.transform = `scaleY(${scaleY})`;
    visual.style.backgroundColor = color;
    
    container.appendChild(visual);
    
    // Add click handler
    if (imageUrl) {
      container.onclick = function() {
        document.getElementById("popup-img").src = imageUrl;
        document.getElementById("popup-frame").style.display = "block";
      };
    }

    scene.hotspotContainer().createHotspot(container, { yaw, pitch });
  }

  // Start with the first scene
  switchScene(scenes[0]);

})();