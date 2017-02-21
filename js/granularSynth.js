
// <!--
// Copyright 2010, Google Inc.
// All rights reserved.

// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:

//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
// -->



// Temporary patch until all browsers support unprefixed context.
window.AudioContext = window.AudioContext || window.webkitAudioContext;

// init() once the page has finished loading.
window.onload = initAudio;

var context;
var convolver;
var compressor;

var buffer = 0;
var bufferDuration = 58.0;

var kSpeed = 1.05;
var kPitch = 0.0;
var kDiffusionRandomization = 0.2;
var kPanningRandomization = 0.15;
var kPitchRandomization = 0.0;
var kTimeRandomization = 0.0;
var kGrainSize = 0.090;

var speed = 0.3333;
var pitch = 1.0;
var pitchRandomization = kPitchRandomization;
var panningRandomization = kPanningRandomization;
var diffusionRandomization = kDiffusionRandomization;
var realTime = 0.0;
var grainTime = 0.0;
var timeRandomization = 0.0;

var grainDuration = kGrainSize;
var grainSpacing = 0.5 * kGrainSize;

var isSourceLoaded = false;
var isImpulseResponseLoaded = false;

var applyGrainWindow = false;
var grainWindow;



function scheduleGrain() {
    if (!buffer)
        return;
        
    var source = context.createBufferSource();
    source.buffer = buffer;
    
    var r = Math.random();
    var r2 = Math.random();
    var r3 = Math.random();
    var r4 = Math.random();
    var r5 = Math.random();
    r1 = (r - 0.5) * 2.0;
    r2 = (r2 - 0.5) * 2.0;
    r3 = (r3 - 0.5) * 2.0;
    r4 = (r4 - 0.5) * 2.0;

    // Spatialization
    var panner = context.createPanner();

    var grainWindowNode;
    if (applyGrainWindow) {
        // Create a gain node with a special "grain window" shaping curve.
        grainWindowNode = context.createGain();
        source.connect(grainWindowNode);
        grainWindowNode.connect(panner);
    } else {
        source.connect(panner);
    }    

    var distance = 2.0;
    var azimuth = Math.PI * panningRandomization * r3;
    var elevation = Math.PI * (0.25 + 0.75 * panningRandomization * r4);

    var x = Math.sin(azimuth);
    var z = Math.cos(azimuth);
    var y = Math.sin(elevation);
    var scaleXZ = Math.cos(elevation);

    x *= distance * scaleXZ;
    y *= distance;
    z *= distance * scaleXZ;

    panner.panningModel = "HRTF";
    panner.setPosition(x, y, z);

    var dryGainNode = context.createGain();
    var wetGainNode = context.createGain();
    wetGainNode.gain.value = 1.0 * diffusionRandomization * r5;
    dryGainNode.gain.value = 0.5 - wetGainNode.gain.value;

    // Pitch
    var totalPitch = pitch + r1 * pitchRandomization;
    var pitchRate = Math.pow(2.0, totalPitch / 1200.0);
    source.playbackRate.value = pitchRate;
    
    // Connect dry mix
    panner.connect(dryGainNode);
    dryGainNode.connect(compressor);
    
    // Connect wet mix
    panner.connect(wetGainNode);
    wetGainNode.connect(convolver);

    // Time randomization
    var randomGrainOffset = r2 * timeRandomization;

    // Schedule sound grain
    source.start(realTime, grainTime + randomGrainOffset, grainDuration);

    // Schedule the grain window.
    // This applies a time-varying gain change for smooth fade-in / fade-out.
    if (applyGrainWindow) {
        var windowDuration = grainDuration / pitchRate;
        grainWindowNode.gain.value = 0.0; // make default value 0
        grainWindowNode.gain.setValueCurveAtTime(grainWindow, realTime, windowDuration);
    }

    var lastGrainTime = grainTime;
    
    // Update time params
    realTime += grainSpacing;
    grainTime += speed * grainSpacing;
    if (grainTime > bufferDuration) grainTime = 0.0;
    if (grainTime < 0.0) grainTime += bufferDuration; // backwards wrap-around
}

function schedule() {
    var currentTime = context.currentTime;  

    while (realTime < currentTime + 0.100) {
        scheduleGrain();
    }

    setTimeout("schedule()", 20);
}

function initAudio() {
    context = new AudioContext();

    // This check is a hack and will only be needed temporarily.
    // The reason is that the noteGrainOn() method used to (in older builds) apply a hard-coded amplitude window.
    // The newer and more flexible approach is that noteGrainOn() simply plays a portion of an AudioBuffer,
    // without any gain scaling.  Then we can apply a gain scaling (which is desired in this example)
    // by using an AudioGainNode.
    // We check the existence of the decodeAudioData() only because this is the time when the change in noteGrainOn()
    // behavior happened -- yucky, but only temporary since it can be removed in a few weeks when all builds have the new behavior.
    if (context.decodeAudioData) {
        applyGrainWindow = true;
        // Create a granular synthesis "grain window"
        // Each small audio snippet will have a smooth fade-in / fade-out according to this shape.
        var grainWindowLength = 16384;
        grainWindow = new Float32Array(grainWindowLength);
        for (var i = 0; i < grainWindowLength; ++i)
            grainWindow[i] = Math.sin(Math.PI * i / grainWindowLength);
    } else {
        applyGrainWindow = false;
    }

    if (context.createDynamicsCompressor) {
        // Create dynamics compressor to sweeten the overall mix.
        compressor = context.createDynamicsCompressor();
        compressor.connect(context.destination);
    } else {
        // Compressor is not available on this implementation - bypass and simply point to destination.
        compressor = context.destination;
    }
    
    // Create a convolver for ambience
    convolver = context.createConvolver();
    convolver.connect(compressor);

    load();
}



function load() {
    loadImpulseResponse('impulse-responses/matrix-reverb6.wav');
    // loadImpulseResponse('impulse-responses/matrix-reverb5.wav');
    loadHumanVoice("sounds/cosmic-ping-longdrive.mp3");
}



function loadImpulseResponse(url) {
    // Load impulse response asynchronously

    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = function() { 
        context.decodeAudioData(
            request.response,
            function(buffer) {
                convolver.buffer = buffer;
                isImpulseResponseLoaded = true;
                finishLoading();
            },
            
            function(buffer) {
                console.log("Error decoding impulse response!");
            }
        );
    }
    request.onerror = function() { 
        alert("error loading reverb");
    }

    request.send();
}

function loadHumanVoice(url) {
    // Load asynchronously

    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = function() {
        context.decodeAudioData(
            request.response,
            function(b) {
                buffer = b;
                bufferDuration = buffer.duration - 0.050;
                isSourceLoaded = true;
                finishLoading();  // we have the voice, put up sliders and start playing...
            },
            
            function(buffer) {
                console.log("Error decoding human voice!");
            }
        );
    };

    request.onerror = function() {
        alert("error loading");
    };

    request.send();
}

function finishLoading() {
    if (!isSourceLoaded || !isImpulseResponseLoaded)
        return;
    
    // first, get rid of loading animation
    // var loading = document.getElementById("loading");
    // loading.innerHTML = "";

    // start playing the granular effect
    realTime = context.currentTime;
    schedule();
}