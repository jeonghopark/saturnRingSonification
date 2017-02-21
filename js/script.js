var scene, camera, renderer, stats, controls;

var parameters;

var imagedata = new THREE.Color(0x000000);
var mouse = new THREE.Vector3(0, 0, 0);
var mouseScreenPos = new THREE.Vector3(0, 0, 0);

var theta = 0;
var niddleFirstPos = new THREE.Vector3(0, 0, 0);
var niddleSecondPos = new THREE.Vector3(0, 0, 0);

var audioTrigger;
var radiusChange = 375;

var lineVerGeometry;
var lineVerMaterial;
var lineHorGeometry;
var lineHorMaterial;


init();
animate();


//----------------------------------------------------------------------
function init() {

    if (!Detector.webgl) Detector.addGetWebGLMessage();

    parameters = {
        Speed: 1.0,
        RandomPos: false
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 10000);

    renderer = new THREE.WebGLRenderer({
        // alpha: true
        antialiasing: true,
    });
    renderer.setClearColor (0x333333, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);

    container = document.getElementById('threejsDiv');
    document.body.appendChild(container);

    // renderer = new THREE.WebGLRenderer();
    // renderer.setSize( 200, 200 );
    container.appendChild(renderer.domElement);

    stats = new Stats();
    // container.appendChild(stats.dom);


    var context = document.getElementById('canvas').getContext("2d");

    var img = new Image();
    img.src = "images/PIA08361_edit_alpha_s.png";
    img.onload = function() {
        var _width = 800;
        var _height = 800;
        canvas.width = _width;
        canvas.height = _height;
        context.drawImage(img, 0, 0, _width, _height);
        imagedata = context.getImageData(0, 0, img.width, img.height);
    }


    var loader = new THREE.TextureLoader();
    loader.load('images/PIA08361_edit_alpha_s.png', function(texture) {
        var geometry = new THREE.PlaneGeometry(800, 800, 1, 1);
        texture.minFilter = THREE.LinearFilter;
        var material = new THREE.MeshPhongMaterial({
            map: texture,
            color: 0xffffff,
            side: THREE.DoubleSide,
            overdraw: 1.5,
            transparent: true,
            // opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = 0;
        mesh.position.z = -1;
        scene.add(mesh);
    });



    lineVerGeometry = new THREE.Geometry();
    lineVerMaterial = new THREE.LineBasicMaterial({
        color: 0x000000
    });
    lineHorGeometry = new THREE.Geometry();
    lineHorMaterial = new THREE.LineBasicMaterial({
        color: 0x000000
    });
    for (var i = 0; i < 360; i++) {
        var x = 0;
        var y = i * 380 / 360.0;
        lineVerGeometry.vertices.push(
            new THREE.Vector3(x, y, 0)
            );
        lineHorGeometry.vertices.push(
            new THREE.Vector3(x, y, 0)
            );
    }
    var lineVer = new THREE.Line(lineVerGeometry, lineVerMaterial);
    var lineHor = new THREE.Line(lineHorGeometry, lineHorMaterial);
    scene.add(lineVer);
    scene.add(lineHor);




    var geometry = new THREE.CylinderGeometry( 2, 2, 70, 2 );
    var material = new THREE.MeshBasicMaterial({
        color: 0xffffff
    });
    var planeOrbit = new THREE.Mesh(geometry, material);
    planeOrbit.rotation.x = Math.PI * 0.5;
    // planeOrbit.position.x = 0;
    // planeOrbit.position.y = 0;
    // planeOrbit.position.z = 2;
    planeOrbit.name = "OrbitObject";
    scene.add(planeOrbit);



    var geometrySaturn = new THREE.SphereGeometry(170, 48, 48);
    var texloader = new THREE.TextureLoader();
    var saturnTexture = texloader.load("images/saturn.jpg");
    var material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: saturnTexture,
        // transparent: true,
        // opacity: 0.5,
        // wireframe: true
    });
    var saturn = new THREE.Mesh(geometrySaturn, material);
    saturn.rotation.x = Math.PI * 0.5
    scene.add(saturn);

    scene.rotation.x = -Math.PI * 0.2;
    camera.position.z = 900;



    var geometryStar = new THREE.SphereGeometry(4000, 32, 32);
    var texloaderStar = new THREE.TextureLoader();
    var starTexture = texloaderStar.load("images/galaxydisk_s.jpg");
    var materialStar = new THREE.MeshBasicMaterial({
        color: 0x444444,
        map: starTexture,
        side: THREE.BackSide
    });
    var meshStar = new THREE.Mesh(geometryStar, materialStar);
    meshStar.rotation.x = Math.PI * 0.25;
    meshStar.rotation.z = Math.PI * 0.25;
    scene.add(meshStar);


    document.addEventListener('mousemove', onDocumentMouseMove, false);

    window.addEventListener( 'resize', onWindowResize, false );

    controlsSetting();
    lightSetting();
    guiSetting();

}


//----------------------------------------------------------------------
function onDocumentMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    mouseScreenPos = new THREE.Vector3(event.clientX, event.clientY, 0);

    var color = getPixel(imagedata, mouseScreenPos.x, mouseScreenPos.y);
}



//----------------------------------------------------------------------
function getPixel(imagedata, x, y) {

    var position = (x + imagedata.width * y) * 4;
    data = imagedata.data;
    return {
        r: data[position],
        g: data[position + 1],
        b: data[position + 2],
        a: data[position + 3]
    };

}


//----------------------------------------------------------------------
function update() {


    if (!parameters.RandomPos) {
        theta += 0.5 * parameters.Speed;

        if (theta % 180 === 0) {
            radiusChange -= 1;
        }

        if (theta % 30 === 0) {
            audioTrigger = true;
        }
        _thetaVar = theta * Math.PI / 180;

        if (radiusChange < 200) {
            radiusChange = 380;
        }
        niddleFirstPos.x = ~~(Math.cos(_thetaVar) * radiusChange) + 470;
        niddleFirstPos.y = ~~(Math.sin(_thetaVar) * radiusChange) + 400;

    } else{
        theta += 1.0;

        if (theta % 180 === 0) {
            radiusChange -= 1;
        }

        if (~~theta % (~~(15 / parameters.Speed)) === 0) {
            audioTrigger = true;
        }
        if (audioTrigger) {
        audioTrigger = false;
        _thetaVar = Math.random() * 360;
        radiusChange = Math.random() * 180 + 200;
        niddleFirstPos.x = ~~(Math.cos(_thetaVar) * radiusChange) + 470;
        niddleFirstPos.y = ~~(Math.sin(_thetaVar) * radiusChange) + 400;
        }
    }
    

    var _distance = 400;

    if (imagedata.data != undefined) {
        var x = niddleFirstPos.x - 70;
        var y = niddleFirstPos.y;
        var color = getPixel(imagedata, x - 0, y + 0);

        var orbitObject = scene.getObjectByName("OrbitObject");
        orbitObject.position.x = (x - 400) * 1;
        orbitObject.position.y = (-y + 400) * 1;

        orbitObject.material.color = new THREE.Color(color.r / 255 + 0.25, color.g / 255 + 0.25, color.b / 255 + 0.25, color.a / 255);

        scene.children[0].rotation.z = -_thetaVar - Math.PI * 0.5;
        scene.children[1].rotation.z = -_thetaVar - Math.PI * 0.5;

        for (var i = 0; i < 360; i++) {
            var xFq = Math.sin(i * color.r / 10.0 * Math.PI / 180) * 10 * i / 360.0;
            var yFq = i * 380.0 / 360.0 * radiusChange / 380.0;

            lineVerGeometry.vertices[i].z = xFq;
            lineVerGeometry.vertices[i].y = yFq;
            lineHorGeometry.vertices[i].x = xFq;
            lineHorGeometry.vertices[i].y = yFq;
        }
        lineVerGeometry.verticesNeedUpdate = true;
        lineVerMaterial.color = new THREE.Color(color.r / 255 + 0.25, color.g / 255 + 0.25, color.b / 255 + 0.25, color.a / 255);
        lineHorGeometry.verticesNeedUpdate = true;
        lineHorMaterial.color = new THREE.Color(color.r / 255 + 0.25, color.g / 255 + 0.25, color.b / 255 + 0.25, color.a / 255);


        if (color.r > 20.0) {
            // !!!!
            // 1 Synth
            // speed = 0.3;
            // pitch = color.r * 5.0 - 3000;
            // pitchRandomization = 0.0;
            // grainTime = Math.sin(theta * 0.001) * 7.0;

            // 2 Synth
            // speed = 0.2;
            // panningRandomization = color.r / 500.0 - 1.0;
            // pitch = -1800.0 + color.r * 0.5;
            // pitchRandomization = 0.0;
            // grainTime = (Math.sin(theta * 0.001) + 1.1) * 3.5;

            // 3 Synth Test
            speed = 0.3;
            panningRandomization = 0;
            pitch = -2000.0 + color.r * 2;
            pitchRandomization = 0.0;
        } else {
            speed = 0.01;
            pitch = -3600;
            grainTime = 0.01;
        }


    }

}




//----------------------------------------------------------------------
function animate() {

    update();
    controls.update();
    requestAnimationFrame(animate);
    render();
    // stats.update();

}



//----------------------------------------------------------------------
function render() {
    renderer.render(scene, camera);
}



//-----------------------------------------------------------------------------
function controlsSetting() {
    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 3.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.minDistance = 300;
    controls.maxDistance = 5000;

}


//-----------------------------------------------------------------------------
function lightSetting() {

    var light = new THREE.SpotLight(0xffffff, 1, 3000);
    var _vLight = new THREE.Vector3(-1500, 500, 500);
    light.position.set(_vLight.x, _vLight.y, _vLight.z);
    light.intensity = 0.9;
    scene.add(light);

    var lightSaturn = new THREE.SpotLight(0xffffff, 1, 20000);
    var _vLightS = new THREE.Vector3(0, 0, 0);
    lightSaturn.position.set(_vLightS.x, _vLightS.y, _vLightS.z);
    lightSaturn.intensity = 1;
    scene.add(lightSaturn);


    scene.add(new THREE.AmbientLight(0x555555));
}


//-----------------------------------------------------------------------------
function guiSetting() {
    var gui = new dat.GUI();

    gui.add(parameters, 'Speed').min(0.2).max(2.0).step(0.1).listen();
    gui.add(parameters, 'RandomPos').listen();

    // var _stripWidth = gui.add(parameters, 'StripWidth').min(0.2).max(3.0).step(0.1).listen();
    // _stripWidth.onChange(function() {
    //     geoMeshSetting();
    // });
}


//-----------------------------------------------------------------------------
function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}


