/**
 * @module ol/control/comparisontools
 */
/**
 * @classdesc
 * An Control bar with comparison tools
 * The display bar is a container for other controls. It is an extension of Control Bar
 *
 * @constructor
 * @extends {module:ol-ext/control/Bar}
 * @param {Object=} opt_options Control options.
 *    className {String} class of the control
 *    group {bool} is a group, default false
 *    rightLayer {module:ol/layer} layer to compare to
 *    leftLayer {module:ol/layer} layer compared
 *    toggleOne {bool} only one toggle control is active at a time, default false
 *    autoDeactivate {bool} used with subbar to deactivate all control when top level control deactivate, default false
 *    displayMode {string}
 *    controlNames {Array.<string>} a list of control name to add to the comparison toolset (can be 'hSlider', 'vSlider', 'scope', 'clipLayer', 'doubleMap')
 */
ol.control.ComparisonTools = function(options)  {
  if(!options) {
    options = {};
  }
  let self = this;
  this.controls_ = [];
  this.clonedMap_;
  this.clonedLayer_;
  this.rightLayer_;
  this.leftLayer_;
  this.useCloneLayer_ = false;
  this.layerGroup_;
  this.vSwipeControl_;
  this.hSwipeControl_;
  ol.control.Bar.call(this, {
    group: true,
    toggleOne: true,
    className: options.className,
    controls: this.controls_
  });
  let controlNames = options.controlNames || ['hSlider', 'vSlider', 'scope', 'clipLayer', 'doubleMap'];
  if(options.rightLayer) {
    this.rightLayer_ = options.rightLayer;
  }
  if(options.leftLayer) {
    this.leftLayer_ = options.leftLayer;
  }
  if(options.layerGroup) {
    this.layerGroup_ = options.layerGroup;
  }
  this.useCloneLayer_ = options.useCloneLayer === true ? options.useCloneLayer :false;
  for(let i=0; i<controlNames.length; i++) {
    let controlName = controlNames[i];
    if(controlName === 'vSlider') {
      let verticalControl = new ol.control.Toggle({
        html: '<i class="fa fa-arrows-v"></i>',
        className: 'vertical-button',
        title: 'Comparaison verticale',
        active: false
      });
      verticalControl.set('name', controlName+'Toggle');
      verticalControl.on('change:active', function(event) {
        self.onVerticalControlChange_(event, self);
      });
      this.addControl(verticalControl);
    } else if(controlName === 'hSlider') {
      let horizontalControl = new ol.control.Toggle({
        html: '<i class="fa fa-arrows-h"></i>',
        className: 'horizontal-button',
        title: 'Comparaison horizontale',
        active: false,
      });
      horizontalControl.set('name', controlName+'Toggle');
      horizontalControl.on('change:active', function(event) {
        self.onHorizontalControlChange_(event, self);
      });
      this.addControl(horizontalControl);
    } else if(controlName === 'scope') {
      let scopeControl = new ol.control.Toggle({
        html: '<i class="fa fa-circle-o"></i>',
        className: 'scope-button',
        name: 'scope',
        title: 'Loupe',
        active: false
      });
      scopeControl.set('name', controlName+'Toggle');
      scopeControl.on('change:active', function(event) {
        self.onScopeControlChange_(event, self);
      });
      this.addControl(scopeControl);
    } else if(controlName === 'clipLayer') {
      let clipLayerControl = new ol.control.Toggle({
        html: '<i class="fa fa-eye"></i>',
        className: 'clipLayer-button',
        title: 'Masquer',
        active: false
      });
      clipLayerControl.set('name', controlName+'Toggle');
      clipLayerControl.on('change:active', function(event) {
        self.onClipLayerControlChange_(event, self);
      });
      this.addControl(clipLayerControl);
    } else if(controlName === 'doubleMap') {
      let doubleMapControl = new ol.control.Toggle({
        html: '<i class="fa fa-pause"></i>',
        className: 'doubleMap-button',
        name: 'doubleMap',
        title: 'Double affichage',
        active: false
      });
      doubleMapControl.set('name', controlName+'Toggle');
      doubleMapControl.on('change:active', function(event) {
        self.onDoubleMapControlChange_(event, self);
      });
      this.addControl(doubleMapControl);
    }
  }
};
ol.inherits(ol.control.ComparisonTools, ol.control.Bar);
ol.control.ComparisonTools.prototype.setMap = function(map) {
  ol.control.Bar.prototype.setMap.call(this, map);
  if(!this.layerGroup_) {
    this.layerGroup_ = this.getMap().getLayerGroup();
  }
  let doubleMapControl = this.getControl('doubleMapToggle');
  if(doubleMapControl) {
    // if doubleMapControl, create cloned map
    let mapDiv = map.getViewport().parentElement;
    let mapId = mapDiv.id;
    if(mapId === undefined) {
      throw new EvalError('ol.Map div must have an id.');
    }
    let mapDiv2 = document.createElement('div');
    mapDiv2.id=mapId + '-cloned';
    mapDiv2.hidden = true;
    mapDiv.parentElement.appendChild(mapDiv2);
    map.clonedMap_ = new ol.Map({
      target: mapDiv2,
      view: map.getView(),
      controls: [
        new ol.control.Zoom({
          zoomInTipLabel: 'Zoom avant',
          zoomOutTipLabel: 'Zoom arrière'
        }),
        new ol.control.Rotate(),
        new ol.control.Attribution()
      ]
    });
    // add synchronize interaction between maps
    map.addInteraction( new ol.interaction.Synchronize({maps: [map.clonedMap_]}));
    map.clonedMap_.addInteraction( new ol.interaction.Synchronize({maps: [map]}));
  }
};
/**
 * Get comparison control by its name
 * @param {string} name name of control
 * @return {module:ol/control/Control|undefined} control control returned
 */
ol.control.ComparisonTools.prototype.getControl = function(name) {
  for(let i=0; i<this.getControls().length; i++) {
    if(this.getControls()[i].get('name') === name) {
      return this.getControls()[i];
    }
  }
};
/**
 * @private
 */
ol.control.ComparisonTools.prototype.onVerticalControlChange_ = function(event) {
  if(event.active) {
    this.vSwipeControl_ = new ol.control.Swipe({
      layers: this.getLeftLayer(),
      rightLayers: this.getRightLayer(),
      orientation: 'vertical'
    });
    this.vSwipeControl_.set('name', 'vSlider');
    this.getMap().addControl(this.vSwipeControl_);
  } else if(this.vSwipeControl_) {
    this.getMap().removeControl(this.vSwipeControl_);
    this.vSwipeControl_ = undefined;
  }
}
/**
 * @private
 */
ol.control.ComparisonTools.prototype.onHorizontalControlChange_ = function(event) {
  if(event.active) {
    this.hSwipeControl_ = new ol.control.Swipe({
      layers: this.getLeftLayer(),
      rightLayers: this.getRightLayer(),
      orientation: 'horizontal'
    });
    this.hSwipeControl_.set('name', 'hSlider');
    this.getMap().addControl(this.hSwipeControl_);
  } else if(this.hSwipeControl_) {
    this.getMap().removeControl(this.hSwipeControl_);
    this.hSwipeControl_ = undefined;
  }
}
/**
 * @private
 */
ol.control.ComparisonTools.prototype.onScopeControlChange_ = function(event) {
  let scopeToggleControl = this.getControl('scopeToggle');
  if(event.active) {
    scopeToggleControl.setInteraction(new ol.interaction.Clip({
      radius: 200
    }));
    // add clip interaction to map
    this.getMap().addInteraction(scopeToggleControl.getInteraction());
    scopeToggleControl.getInteraction().addLayer(this.getRightLayer());
  } else if(scopeToggleControl.getInteraction()) {
    scopeToggleControl.getInteraction().removeLayer(this.getRightLayer());
    // remove clip interaction from map
    this.getMap().removeInteraction(scopeToggleControl.getInteraction());
    scopeToggleControl.setInteraction();
  }
}
/**
 * @private
 */
ol.control.ComparisonTools.prototype.onClipLayerControlChange_ = function(event) {
  let clipLayerToggleControl = this.getControl('clipLayerToggle');
  if(event.active) {
    this.getRightLayer().setVisible(false);
    // set icon class to fa-eye-slash
    clipLayerToggleControl.element.getElementsByClassName('fa')[0].className = 'fa fa-eye-slash';
  } else {
    if(this.useCloneLayer_) {
      if(this.getDisplayMode() !== 'doubleMap') {
        this.getRightLayer().setVisible(true);
      }
    } else {
      this.getRightLayer().setVisible(true);
    }
    // set icon class to fa-eye
    clipLayerToggleControl.element.getElementsByClassName('fa')[0].className = 'fa fa-eye';
  }
}
/**
 * @private
 */
ol.control.ComparisonTools.prototype.onDoubleMapControlChange_ = function(event) {
  let mapDiv = this.getMap().getViewport().parentElement;
  let mapDiv2 = this.getMap().clonedMap_.getViewport().parentElement;
  if(event.active) {
    mapDiv2.style.float =  'left';
    mapDiv2.style.width =  '50%';
    mapDiv.style.width = '50%';
    mapDiv.style.float =  'left';
    mapDiv2.style.display = 'block';
    mapDiv2.style.height = mapDiv.clientHeight + 'px';
    // as we do not want control to add/remove layers on map, we add a cloned layer to cloned map
    // and we hide rightLayer from map
    if(this.useCloneLayer_) {
      this.clonedLayer_ = new ol.layer.Tile(this.getRightLayer().getProperties());
      this.clonedLayer_.setVisible(true);
      this.getRightLayer().setVisible(false);
      // change made on rightLayer are applied to clonedLayer_
      this.getRightLayer().on('change', this.updateClonedLayer_, this);
      this.getClonedMap().addLayer(this.clonedLayer_);
    } else {
      this.getRightLayer().setVisible(true);
      this.layerGroup_.getLayers().remove(this.getRightLayer());
      this.getClonedMap().addLayer(this.getRightLayer());
    }
    this.getMap().updateSize();
    this.getClonedMap().updateSize();
  } else {
    mapDiv2.style.display = 'none';
    mapDiv2.style.width = '100%';
    mapDiv.style.width = '100%';
    if(this.useCloneLayer_) {
      // in cloned map, move right layer from cloned map to map
      this.getClonedMap().removeLayer(this.clonedLayer_);
      if(this.getDisplayMode() !== 'clipLayer') {
        this.getRightLayer().setVisible(true);
      }
      // change made on rightLayer are applied to clonedLayer_
      this.getRightLayer().un('change', this.updateClonedLayer_, this);
    } else {
      if(this.getDisplayMode() !== 'clipLayer') {
        this.getRightLayer().setVisible(true);
      }
      this.getClonedMap().removeLayer(this.getRightLayer());
      this.layerGroup_.getLayers().push(this.getRightLayer());
    }
  }
  this.getMap().updateSize();
}
/**
 * Set displayMode
 * @param {string} display mode ['hSlider', 'vSlider', 'scope', 'clipLayer', 'doubleMap']
 */
ol.control.ComparisonTools.prototype.setDisplayMode = function(displayMode) {
  if(this.getMap()) {
    if(displayMode === 'vSlider') {
      this.getControl('vSliderToggle').setActive(true);
    } else if(displayMode === 'hSlider') {
      this.getControl('hSliderToggle').setActive(true);
    } else if(displayMode === 'scope') {
      this.getControl('scopeToggle').setActive(true);
    } else if(displayMode === 'clipLayer') {
      this.getControl('clipLayerToggle').setActive(true);
    } else if(displayMode === 'doubleMap') {
      this.getControl('doubleMapToggle').setActive(true);
    }
  } else {
    throw new EvalError('control must be added to map before setting displayMode.');
  }
};
/**
 * Get active control
 * @return {string} displayMode ['hSlider', 'vSlider', 'scope', 'clipLayer', 'doubleMap']
 */
 ol.control.ComparisonTools.prototype.getDisplayMode = function() {
  for(let i=0; i<this.getControls().length; i++) {
    if(this.getControls()[i].getActive()) {
      return this.getControls()[i].get('name').substring(0, this.getControls()[i].get('name').length - 6);
    }
  }
  return 'normal';
 };
/**
 * Set right layer for comparison
 * @param {module:ol/layer} layer
 */
 ol.control.ComparisonTools.prototype.setRightLayer = function(layer) {
   if(!this.getMap()) {
     throw new EvalError('control must be added to map before setting rightLayer.');
   }
  if(this.getDisplayMode() === 'vSlider') {
    let vSwipeControl;
    this.getMap().getControls().forEach(function(control) {
      if(control.get('name') === 'vSlider') {
        vSwipeControl = control;
      }
    });
    vSwipeControl.removeLayer(this.getRightLayer());
    vSwipeControl.addLayer(layer, true);
  } else if(this.getDisplayMode() === 'hSlider') {
    let hSwipeControl;
    this.getMap().getControls().forEach(function(control) {
      if(control.get('name') === 'hSlider') {
        hSwipeControl = control;
      }
    });
    hSwipeControl.removeLayer(this.getRightLayer());
    hSwipeControl.addLayer(layer, true);
  } else if(this.getDisplayMode() === 'clipLayer') {
    layer.setVisible(this.getRightLayer().getVisible());
  } else if(this.getDisplayMode() === 'scope') {
    let interaction = this.getControl('scopeToggle').getInteraction();
    interaction.removeLayer(this.getRightLayer());
    interaction.addLayer(layer);
  } else if(this.getDisplayMode() === 'doubleMap') {
    if(this.useCloneLayer_) {
      this.clonedLayer_.setProperties(layer.getProperties());
      // change made on rightLayer are applied to clonedLayer_
      this.getRightLayer().on('change', this.updateClonedLayer_, this);
      this.getRightLayer().setVisible(false);
    } else {
      this.getRightLayer().setVisible(true);
      this.layerGroup_.getLayers().remove(layer);
      // update layer in collection
      let self = this;
      this.getClonedMap().getLayers().forEach(function(el, index) {
        if(el === self.getRightLayer()) {
          self.getClonedMap().getLayers().setAt(index, layer);
        }
      });
    }
  }
  this.rightLayer_ = layer;
};
ol.control.ComparisonTools.prototype.updateClonedLayer_ = function() {
  this.clonedLayer_.setProperties(this.getRightLayer().getProperties());
  this.clonedLayer_.setVisible(true);
}
/**
 * Set left layer for comparison
 * @param {module:ol/layer} layer
 */
ol.control.ComparisonTools.prototype.setLeftLayer = function(layer) {
  if(!this.getMap()) {
    throw new EvalError('control must be added to map before setting leftLayer.');
  }
  if(this.getDisplayMode() === 'vSlider') {
    let vSwipeControl;
    this.getMap().getControls().forEach(function(control) {
      if(control.get('name') === 'vSlider') {
        vSwipeControl = control;
      }
    });
    if(vSwipeControl) {
      vSwipeControl.addLayer(this.getLeftLayer());
    }
  } else if(this.getDisplayMode() === 'hSlider') {
    let hSwipeControl;
    this.getMap().getControls().forEach(function(control) {
      if(control.get('name') === 'hSlider') {
        hSwipeControl = control;
      }
    });
    if(hSwipeControl) {
      hSwipeControl.addLayer(this.getLeftLayer());
    }
  } else if(this.getDisplayMode() === 'clipLayer') {
    layer.setVisible(this.getLeftLayer().getVisible());
  } else if(this.getDisplayMode() === 'scope') {
    // do nothing
  } else if(this.getDisplayMode() === 'doubleMap') {
    // update layer in collection
    let self = this;
    this.getMap().getLayers().forEach(function(el, index) {
      if(el === self.getLeftLayer()) {
        self.getMap().getLayers().setAt(index, layer);
      }
    });
  }
  this.leftLayer_ = layer;
 };
/**
 * Get right layer
 * @return {module:ol/layer} layer
 */
ol.control.ComparisonTools.prototype.getRightLayer = function() {
  return this.rightLayer_;
};
/**
 * Get left layer
 * @return {module:ol/layer} layer
 */
ol.control.ComparisonTools.prototype.getLeftLayer = function() {
  return this.leftLayer_;
};
/**
 * Get cloned map
 * @return {module:ol/map} cloned map
 */
ol.control.ComparisonTools.prototype.getClonedMap = function() {
  return this.getMap().clonedMap_;
}
/**
 * Set layer group
 * @param {module:ol/layer/Group} layer group where layers are added/removed
 */
ol.control.ComparisonTools.prototype.setLayerGroup = function(layerGroup) {
  this.layerGroup_ = layerGroup;
}
/**
 * Get layer group
 * @return {module:ol/layer/Group} layer group where layers are added/removed
 */
ol.control.ComparisonTools.prototype.getLayerGroup = function() {
  return this.layerGroup_;
}
/**
 * Get vertical swipe control group
 * @return {module:ol-ext/control/Swipe} vertical swipe control
 */
ol.control.ComparisonTools.prototype.getVSwipeControl = function() {
  return this.vSwipeControl_;
}
/**
 * Get horizontal swipe control group
 * @return {module:ol-ext/control/Swipe} horizontal swipe control
 */
ol.control.ComparisonTools.prototype.getHSwipeControl = function() {
  return this.hSwipeControl_;
}
/**
 * Get cloned map
 * @return {module:ol/map} cloned map
 */
ol.Map.prototype.getClonedMap = function() {
  return this.clonedMap_;
}

/**
 * @module ol/control/comparisontools
 * A  control that compute an histogram matching between two layers and adds a processed layer to map
 * cf. https://en.wikipedia.org/wiki/Histogram_matching
 */
/**
 *
 * @constructor
 * @extends {module:ol/control/Control}
 * @param {Object=} opt_options Control options.
 *    layer1 {module:ol/Layer} layer to be reprocessed
 *    layer2 {module:ol/Layer} reference layer
 *    classCount {number} number of class used when inverting histogram
 */
ol.control.HistogramMatching = function(options)  {
  if(!options) {
    options = {};
  }
  this.layer1_ = options.layer1;
  this.layer2_ = options.layer2;
  this.classCount_ = options.classCount ? options.classCount : 1000;
  this.layerProcessed_ = {};
  this.active_ = false;
  ol.control.Toggle.call(this, {
    html: '<i class="fa fa-bar-chart"></i>',
    className: 'ol-histogram-matching',
    title: 'Adaptation d\'histogramme',
    active: false
  });
};
ol.inherits(ol.control.HistogramMatching, ol.control.Toggle);
ol.control.HistogramMatching.prototype.setMap = function(map) {
  let me = this;
  ol.control.Control.prototype.setMap.call(this, map);
  me.on('change:active', this.onToggle_);
};
ol.control.HistogramMatching.prototype.onToggle_ = function(toggle) {
  let me = this;
  $(me.element).find('button').blur();
  if(me.getActive() === true) {
    let rasterSource = new ol.source.Raster({
      sources: [me.layer1_.getSource(), me.layer2_.getSource()],
      operationType: 'image',
      operation: me.rasterOperation_,
      lib: {
        computeHistogram: me.computeHistogram_,
        getInverseClassIndex: me.getInverseClassIndex_,
        getInverseValue: me.getInverseValue_,
        classCount: me.classCount_
      }
    });
    me.layerProcessed_ = new ol.layer.Image({
      source: rasterSource,
      name: 'processedLayer'
    });
    me.getMap().addLayer(me.layerProcessed_);
    me.getMap().on('moveend', function() {
      rasterSource.changed();
    });
  } else {
    me.getMap().removeLayer(me.layerProcessed_);
    me.getMap().render();
  }
}
ol.control.HistogramMatching.prototype.rasterOperation_ = function (inputs, data) {
  let imageData1 = inputs[0];
  let imageData2 = inputs[1];
  let histogram2 = computeHistogram(imageData2);
  let histogram1 = computeHistogram(imageData1);
  if(histogram1.count === 0 || histogram2 === undefined || histogram2.count === 0) {
    return {
      data: imageData1.data,
      width: imageData1.width,
      height: imageData1.height
    }
  }
  let options = {};
  //let imageData = inputs[0];
  let width = imageData1.width;
  let height = imageData1.height;
  let x = options.x ? options.x : 0;
  let y = options.y ? options.y : 0;
  let inputData = imageData1.data;
  let outputData = new Uint8ClampedArray(inputData.length);
  for (let y = 0, l = 0; y < height; ++y) {
    let pixelsAbove = y * width;
    for (let x = 0; x < width; ++x, l += 4) {
      /*if (this.isStopRequested())
          return null;*/
      let r = inputData[l];
      let g = inputData[l + 1];
      let b = inputData[l + 2];
      let a = inputData[l + 3];
      let outputIndex = l;
      outputData[outputIndex] = getInverseValue(histogram1.cumulative_red[Math.round(Math.max(0, Math.min(255, r)))], histogram2.inverse_red);
      outputData[outputIndex + 1] = getInverseValue(histogram1.cumulative_green[Math.round(Math.max(0, Math.min(255, g)))], histogram2.inverse_green);
      outputData[outputIndex + 2] = getInverseValue(histogram1.cumulative_blue[Math.round(Math.max(0, Math.min(255, b)))], histogram2.inverse_blue);
      outputData[outputIndex + 3] = 255;
    }
    //this.setProgress((y + 1) / height);
  }
  return {
    data: outputData,
    width: width,
    height: height
  };
};
ol.control.HistogramMatching.prototype.setLayer1 = function(layer) {
  let me = this;
  me.layer1_ = layer;
}
ol.control.HistogramMatching.prototype.setLayer2 = function(layer) {
  let me = this;
  me.layer2_ = layer;
}
/**
 * @private
 */
ol.control.HistogramMatching.prototype.getInverseClassIndex_ = function (value) {
    let i = Math.floor(value * classCount); // compute inverse class index
    i = Math.max(0, Math.min(i, classCount - 1)); // clamp value
    return i;
};
/**
 * @private
 */
ol.control.HistogramMatching.prototype.getInverseValue_ = function (value, inverse_values) {
    if (inverse_values == null)
        throw "inverse values cannot be undefined";
    let inverseIndex = getInverseClassIndex(value);
    // some cells may not be filled yet. If it is the case find previous and next filled cells
    // and compute a linear interpolation
    if (inverse_values[inverseIndex] == null) {
        // compute previous index
        let previousIndex = inverseIndex - 1;
        while (previousIndex >= 0 && inverse_values[previousIndex] == null)
            previousIndex--;
        if (previousIndex < 0)
            previousIndex = null;
        // compute next index
        let nextIndex = inverseIndex + 1;
        while (nextIndex < classCount && inverse_values[nextIndex] == null)
            nextIndex++;
        if (nextIndex >= classCount)
            nextIndex = null;
        // fill values from start, between two values or to the end
        if (previousIndex == null) {
            for (let index = 0; index < nextIndex; index++)
                inverse_values[index] = inverse_values[nextIndex];
        }
        else if (nextIndex == null) {
            for (let index = previousIndex + 1; index < classCount; index++)
                inverse_values[index] = inverse_values[previousIndex];
        }
        else {
            for (let index = previousIndex + 1; index < nextIndex; index++) {
                let alpha = (index - previousIndex) / (nextIndex - previousIndex);
                inverse_values[index] = (1 - alpha) * inverse_values[previousIndex] + alpha * inverse_values[nextIndex];
            }
        }
    }
    return inverse_values[inverseIndex];
};
/**
 * @private
 */
ol.control.HistogramMatching.prototype.computeHistogram_ = function(imageData) {
  let histogram = {
    red: new Array(256),
    cumulative_red: new Array(256),
    inverse_red: new Array(classCount),
    green: new Array(256),
    cumulative_green: new Array(256),
    inverse_green: new Array(classCount),
    blue: new Array(256),
    cumulative_blue: new Array(256),
    inverse_blue: new Array(classCount),
    count: 0
  };
  for(let i=0; i<256; i++) {
    histogram.red[i] = histogram.green[i] = histogram.blue[i] = 0;
  }
  // compute histogram
  let inputData = imageData.data;
  let width = imageData.width;
  let height = imageData.height;
  for (let y = 0, l = 0; y < height; ++y) {
      let pixelsAbove = y * width;
      for (let x = 0; x < width; ++x, l += 4) {
          histogram.red[inputData[l]] += 1;
          histogram.green[inputData[l + 1]] += 1;
          histogram.blue[inputData[l + 2]] += 1;
          histogram.count++;
      }
  }
  // compute cumulative
  if (histogram.count < 0.0001)
      throw "Cannot compute cumulative histogram. Count is quite zero...";
  histogram.cumulative_red[0] = histogram.red[0] / histogram.count;
  histogram.cumulative_green[0] = histogram.green[0] / histogram.count;
  histogram.cumulative_blue[0] = histogram.blue[0] / histogram.count;
  for (let i = 1; i < 256; i++) {
      histogram.cumulative_red[i] = histogram.cumulative_red[i - 1] + histogram.red[i] / histogram.count;
      histogram.cumulative_green[i] = histogram.cumulative_green[i - 1] + histogram.green[i] / histogram.count;
      histogram.cumulative_blue[i] = histogram.cumulative_blue[i - 1] + histogram.blue[i] / histogram.count;
  }
  // compute inverse
  for (let i = 0; i < classCount; i++) {
      histogram.inverse_red[i] = histogram.inverse_green[i] = histogram.inverse_blue[i] = null;
  }
  for (let i = 0; i < 255; i++) {
      histogram.inverse_red[getInverseClassIndex(histogram.cumulative_red[i])] = i;
      histogram.inverse_green[getInverseClassIndex(histogram.cumulative_green[i])] = i;
      histogram.inverse_blue[getInverseClassIndex(histogram.cumulative_blue[i])] = i;
  }
  return histogram;
};
ol.control.HistogramMatching.prototype.getLayerProcessed = function() {
  return this.layerProcessed_;
}
// const Histogram = (function () {
//     function Histogram() {
//         this.count = 0;
//         this.red = null;
//         this.green = null;
//         this.blue = null;
//         this.modified = false;
//         // cumulative histogram values (up to 1)
//         this.cumulative_red = null;
//         this.cumulative_green = null;
//         this.cumulative_blue = null;
//         this.inverse_red = null;
//         this.inverse_green = null;
//         this.inverse_blue = null;
//         this.count = 0;
//         this.red = new Array(256);
//         this.green = new Array(256);
//         this.blue = new Array(256);
//         for (let i = 0; i < 256; i++)
//             this.red[i] = this.green[i] = this.blue[i] = 0;
//     }
//     /* Compute an RGB histogram from a 2D context */
//     Histogram.prototype.computeFromContext = function (context) {
//         let canvas = context.canvas;
//         let width = canvas.width;
//         let height = canvas.height;
//         let inputData = context.getImageData(0, 0, width, height).data;
//         for (let y = 0, l = 0; y < height; ++y) {
//             let pixelsAbove = y * width;
//             for (let x = 0; x < width; ++x, l += 4) {
//                 this.red[inputData[l]] += 1;
//                 this.green[inputData[l + 1]] += 1;
//                 this.blue[inputData[l + 2]] += 1;
//                 this.count++;
//             }
//         }
//         this.invalidatePrecomputation();
//     };
//     Histogram.prototype.computeFromCroppedContext = function(context, options) {
//       let canvas = context.canvas;
//       let width = options.width ? options.width : canvas.width;
//       let height = options.height ? options.height : canvas.height;
//       let x = options.x ? options.x : 0;
//       let y = options.y ? options.y : 0;
//       let inputData = context.getImageData(x, y, width, height).data;
//       for (let y = 0, l = 0; y < height; ++y) {
//           let pixelsAbove = y * width;
//           for (let x = 0; x < width; ++x, l += 4) {
//               this.red[inputData[l]] += 1;
//               this.green[inputData[l + 1]] += 1;
//               this.blue[inputData[l + 2]] += 1;
//               this.count++;
//           }
//       }
//       this.invalidatePrecomputation();
//     };
//     Histogram.prototype.compute = function(imageData) {
//       let histogram = {
//         red: [],
//         green: [],
//         blue: [],
//         count: 0
//       };
//       let inputData = imageData.data;
//       let width = imageData.width;
//       let height = imageData.height;
//       for (let y = 0, l = 0; y < height; ++y) {
//           let pixelsAbove = y * width;
//           for (let x = 0; x < width; ++x, l += 4) {
//               histogram.red[inputData[l]] += 1;
//               histogram.green[inputData[l + 1]] += 1;
//               histogram.blue[inputData[l + 2]] += 1;
//               histogram.count++;
//           }
//       }
//       return histogram;
//     }
//     /* Normalize histogram by dividing red green and blue counts by the count sum */
//     Histogram.prototype.computeCumulative = function () {
//         if (this.count < 0.0001)
//             throw "Cannot compute cumulative histogram. Count is quite zero...";
//         this.cumulative_red = new Array(256);
//         this.cumulative_green = new Array(256);
//         this.cumulative_blue = new Array(256);
//         this.cumulative_red[0] = this.red[0] / this.count;
//         this.cumulative_green[0] = this.green[0] / this.count;
//         this.cumulative_blue[0] = this.blue[0] / this.count;
//         for (let i = 1; i < 256; i++) {
//             this.cumulative_red[i] = this.cumulative_red[i - 1] + this.red[i] / this.count;
//             this.cumulative_green[i] = this.cumulative_green[i - 1] + this.green[i] / this.count;
//             this.cumulative_blue[i] = this.cumulative_blue[i - 1] + this.blue[i] / this.count;
//         }
//     };
//     /** Invalidate precomputation for lazy getters */
//     Histogram.prototype.invalidatePrecomputation = function () {
//         this.inverse_red = null;
//         this.inverse_green = null;
//         this.inverse_blue = null;
//         this.cumulative_red = null;
//         this.cumulative_green = null;
//         this.cumulative_blue = null;
//     };
//     /**
//      * compute a class index in inverse histogram. Value must be in 0, 1 range
//      * return a value between 0 (included) and INVERSE_CLASS_COUNT (excluded)
//      */
//     Histogram.prototype.getInverseClassIndex = function (value) {
//         let i = Math.floor(value * Histogram.INVERSE_CLASS_COUNT); // compute inverse class index
//         i = Math.max(0, Math.min(i, Histogram.INVERSE_CLASS_COUNT - 1)); // clamp value
//         return i;
//     };
//     /** Lazy getter of the inverse blue value. Given value must be between 0 and 1 */
//     Histogram.prototype.getInverseValue = function (value, inverse_values) {
//         if (inverse_values == null)
//             throw "inverse values cannot be undefined";
//         let inverseIndex = this.getInverseClassIndex(value);
//         // some cells may not be filled yet. If it is the case find previous and next filled cells
//         // and compute a linear interpolation
//         if (inverse_values[inverseIndex] == null) {
//             // compute previous index
//             let previousIndex = inverseIndex - 1;
//             while (previousIndex >= 0 && inverse_values[previousIndex] == null)
//                 previousIndex--;
//             if (previousIndex < 0)
//                 previousIndex = null;
//             // compute next index
//             let nextIndex = inverseIndex + 1;
//             while (nextIndex < Histogram.INVERSE_CLASS_COUNT && inverse_values[nextIndex] == null)
//                 nextIndex++;
//             if (nextIndex >= Histogram.INVERSE_CLASS_COUNT)
//                 nextIndex = null;
//             // fill values from start, between two values or to the end
//             if (previousIndex == null) {
//                 for (let index = 0; index < nextIndex; index++)
//                     inverse_values[index] = inverse_values[nextIndex];
//             }
//             else if (nextIndex == null) {
//                 for (let index = previousIndex + 1; index < Histogram.INVERSE_CLASS_COUNT; index++)
//                     inverse_values[index] = inverse_values[previousIndex];
//             }
//             else {
//                 for (let index = previousIndex + 1; index < nextIndex; index++) {
//                     let alpha = (index - previousIndex) / (nextIndex - previousIndex);
//                     inverse_values[index] = (1 - alpha) * inverse_values[previousIndex] + alpha * inverse_values[nextIndex];
//                 }
//             }
//         }
//         return inverse_values[inverseIndex];
//     };
//     /** get red value. Given value is clamped to 0 - 255 included */
//     Histogram.prototype.getRedCount = function (value) {
//         if (this.red == null)
//             throw "Histogram has not yet been filled with any pixel...";
//         return this.red[Math.round(Math.max(0, Math.min(255, value)))];
//     };
//     /** get green value. Given value is clamped to 0 - 255 included */
//     Histogram.prototype.getGreenCount = function (value) {
//         if (this.green == null)
//             throw "Histogram has not yet been filled with any pixel...";
//         return this.green[Math.round(Math.max(0, Math.min(255, value)))];
//     };
//     /** get blue value. Given value is clamped to 0 - 255 included */
//     Histogram.prototype.getBlueCount = function (value) {
//         if (this.blue == null)
//             throw "Histogram has not yet been filled with any pixel...";
//         return this.blue[Math.round(Math.max(0, Math.min(255, value)))];
//     };
//     /* get unit cumulative red value. Given value is clamped to 0 - 255 included
//      * return value is in 0-1 range
//      */
//     Histogram.prototype.getCumulativeRed = function (value) {
//         if (this.cumulative_red == null)
//             this.computeCumulative();
//         return this.cumulative_red[Math.round(Math.max(0, Math.min(255, value)))];
//     };
//     /* get unit cumulative green value. Given value is clamped to 0 - 255 included
//      * return value is in 0-1 range
//      */
//     Histogram.prototype.getCumulativeGreen = function (value) {
//         if (this.cumulative_green == null)
//             this.computeCumulative();
//         return this.cumulative_green[Math.round(Math.max(0, Math.min(255, value)))];
//     };
//     /* get unit cumulative blue value. Given value is clamped to 0 - 255 included
//      * return value is in 0-1 range
//      */
//     Histogram.prototype.getCumulativeBlue = function (value) {
//         if (this.cumulative_blue == null)
//             this.computeCumulative();
//         return this.cumulative_blue[Math.round(Math.max(0, Math.min(255, value)))];
//     };
//     /** Lazy getter of the inverse red value. Given value must be between 0 and 1 */
//     Histogram.prototype.getInverseRedCount = function (value) {
//         if (this.inverse_red == null)
//             this.computeInverse();
//         return this.getInverseValue(value, this.inverse_red);
//     };
//     /** Lazy getter of the inverse green value. Given value must be between 0 and 1 */
//     Histogram.prototype.getInverseGreenCount = function (value) {
//         if (this.inverse_green == null)
//             this.computeInverse();
//         return this.getInverseValue(value, this.inverse_green);
//     };
//     /** Lazy getter of the inverse blue value. Given value must be between 0 and 1 */
//     Histogram.prototype.getInverseBlueCount = function (value) {
//         if (this.inverse_blue == null)
//             this.computeInverse();
//         return this.getInverseValue(value, this.inverse_blue);
//     };
//     /**
//      * Compute and stores inverse histogram.
//      * Only 256 values are stored in the inverse histogram, intermediate values
//      * will be computed and stored on the fly within getInverseValue() method call
//      **/
//     Histogram.prototype.computeInverse = function () {
//         this.inverse_red = new Array(Histogram.INVERSE_CLASS_COUNT);
//         this.inverse_green = new Array(Histogram.INVERSE_CLASS_COUNT);
//         this.inverse_blue = new Array(Histogram.INVERSE_CLASS_COUNT);
//         for (let i = 0; i < Histogram.INVERSE_CLASS_COUNT; i++) {
//             this.inverse_red[i] = this.inverse_green[i] = this.inverse_blue[i] = null;
//         }
//         for (let i = 0; i < 255; i++) {
//             this.inverse_red[this.getInverseClassIndex(this.getCumulativeRed(i))] = i;
//             this.inverse_green[this.getInverseClassIndex(this.getCumulativeGreen(i))] = i;
//             this.inverse_blue[this.getInverseClassIndex(this.getCumulativeBlue(i))] = i;
//         }
//     };
//     // inverse cumulative histogram
//     Histogram.INVERSE_CLASS_COUNT = 1000; // use readonly in TypeScript 2.0
//     return Histogram;
// }()); // class Histogram
