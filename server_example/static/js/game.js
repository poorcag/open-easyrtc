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

    // simple line
    const points1 =
    [
        0, 0, 0,
        0, 1, 0
    ]
    const colors = []

    const line1 = BABYLON.CreateGreasedLine("line1", 
    {
        points: points1,
        updatable: true 
    },
    {
        color: BABYLON.Color3.Red(),
        useColors: true,
        colors,
    })

    scene.onBeforeRenderObservable.add(() => {
        acceleration.x = accelerometerData.x;
        acceleration.y = accelerometerData.y;
        acceleration.z = accelerometerData.z;

        const timeStep = scene.deltaTime * 0.02

        velocity = velocity.add(acceleration.scale(timeStep));
        // velocity.y -= gravity * timeStep
        velocity.y = 0;

        velocity.x = Math.max(Math.min(velocity.x, 1), -1)
        velocity.y = Math.max(Math.min(velocity.y, 1), -1)

        position = position.add(velocity.scale(timeStep));

        let rotationChange = BABYLON.Quaternion.RotationYawPitchRoll(
            gyroscopeData.beta * timeStep,
            gyroscopeData.alpha * timeStep,
            gyroscopeData.gamma * timeStep
        );

        // orientation = orientation.multiply(rotationChange);

        // box.rotationQuaternion = orientation;
        box.position.copyFrom(position);

        if (box.position.x > 100)
        {
            box.position.x = -90
        }
        if (box.position.x < -100)
        {
            box.position.x = 90
        }
        if (box.position.z > 100)
        {
            box.position.z = -90
        }
        if (box.position.z < -100)
        {
            box.position.z = 90
        }
    })
    
    var positions = line1.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    positions[3] = accelerometerData.x;
    positions[4] = accelerometerData.y;
    positions[5] = accelerometerData.z;
    line1.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);

    scene.debugLayer.show();

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