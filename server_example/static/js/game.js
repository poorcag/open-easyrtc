const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
const createScene = function () {
    // Creates a basic Babylon Scene object
    const scene = new BABYLON.Scene(engine);
    // Creates and positions a free camera
    const camera = new BABYLON.FreeCamera("camera1", 
        new BABYLON.Vector3(0, 5, -10), scene);
    // Targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());
    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);
    // Creates a light, aiming 0,1,0 - to the sky
    const light = new BABYLON.HemisphericLight("light", 
        new BABYLON.Vector3(0, 1, 0), scene);
    // Dim the light a small amount - 0 to 1
    light.intensity = 0.7;
    // Built-in 'box' shape.
    const box = BABYLON.MeshBuilder.CreateBox("box", 
        {height: 4, width: 2, depth: 0.5}, scene);

    // Move the sphere upward 1/2 its height
    box.position.y = 1;
    // Built-in 'ground' shape.
    const ground = BABYLON.MeshBuilder.CreateGround("ground", 
        {width: 6, height: 6}, scene);

    var position = new BABYLON.Vector3(box.position.x, box.position.y, box.position.z);
    var velocity = BABYLON.Vector3.Zero();
    let acceleration = BABYLON.Vector3.Zero();
    let orientation = new BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
    const gravity = -9.81;

    scene.onBeforeRenderObservable.add(() => {
        var accelerometerData = { x: 0, y: 0, z: 0 };
        var gyroscopeData = { alpha: 0, beta: 0, gamma: 0 };

        acceleration.x = accelerometerData.x;
        acceleration.y = accelerometerData.y;
        acceleration.z = accelerometerData.z;

        const timeStep = scene.deltaTime

        velocity = velocity.add(acceleration.scale(timeStep));
        // velocity.y -= gravity * timeStep
        velocity.y = 0;

        position = position.add(velocity.scale(timeStep));

        let rotationChange = BABYLON.Quaternion.RotationYawPitchRoll(
            gyroscopeData.beta * timeStep,
            gyroscopeData.alpha * timeStep,
            gyroscopeData.gamma * timeStep
        );

        orientation = orientation.multiply(rotationChange);

        box.rotationQuaternion = orientation;
        box.position.copyFrom(position);
    })

    return scene;
};
const scene = createScene(); //Call the createScene function
// Register a render loop to repeatedly render the scene

engine.runRenderLoop(function () {
        scene.render();
});
// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
        engine.resize();
});