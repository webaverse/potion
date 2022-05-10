import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useScene, useFrame, useActivate, useLocalPlayer, useLoaders, useUse, useWear, usePhysics, useCleanup, getNextInstanceId, useInternals} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');


const emptyArray = [];
const fnEmptyArray = () => emptyArray;

const textureLoader = new THREE.TextureLoader()
const gradientNoiseTexture = textureLoader.load(`${baseUrl}/textures/gradientNoise.jpg`);
const voronoiNoiseTexture = textureLoader.load(`${baseUrl}/textures/voronoiNoise.jpg`);
const flameTexture = textureLoader.load(`${baseUrl}/textures/splash2.png`);
const flameTexture2 = textureLoader.load(`${baseUrl}/textures/flame1.png`);
const noiseMap = textureLoader.load(`${baseUrl}/textures/noise.jpg`);
const matcapTexture1 = textureLoader.load(`${baseUrl}/textures/matcap4.png`);
const waveTexture = textureLoader.load(`${baseUrl}/textures/wave2.jpeg`);
const maskTexture = textureLoader.load(`${baseUrl}/textures/mask4.png`);
const maskTexture2 = textureLoader.load(`${baseUrl}/textures/mask3.png`);

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const backwardVector = new THREE.Vector3(0, 0, 1);

export default () => {
  const app = useApp();
  const scene = useScene();
  const {camera} = useInternals();
  const localPlayer = useLocalPlayer();
  const physics = usePhysics();
  

  app.name = 'potion';

  let activated = false;
  let activateCb = null;
  let frameCb = null;
  

  let physicsIds = [];
  let potionApp = null;
  (async () => {

    let u2 = `${baseUrl}potion2.glb`;
    if (/^https?:/.test(u2)) {
        u2 = '/@proxy/' + u2;
    }
    let m = await metaversefile.import(u2);
    potionApp = metaversefile.createApp({
        name: u2,
    });
    
    //m = m.scene;
    potionApp.position.copy(app.position);
    potionApp.quaternion.copy(app.quaternion);
    potionApp.scale.copy(app.scale);
    potionApp.updateMatrixWorld();
    potionApp.name = 'potion';
    potionApp.getPhysicsObjectsOriginal = potionApp.getPhysicsObjects;
    potionApp.getPhysicsObjects = fnEmptyArray;
    
    const components = [
    {
        "key": "instanceId",
        "value": getNextInstanceId(),
    },
    {
        "key": "contentId",
        "value": u2,
    },
    {
        "key": "physics",
        "value": true,
    },
    {
        "key": "wear",
        "value": {
            "boneAttachment": "leftHand",
            "position": [-0.05, -0.07, -0.05],
            "quaternion": [0.7068726, 0.0392707, 0, 0.7062499],
            "scale": [0.3, 0.3, 0.3]
        }
    },
    {
        "key": "use",
        "value": {
            "animation": "drink",
            "behavior": "drink",
            "boneAttachment": "leftHand",
            "position": [-0.05, -0.1, -0.05],
            "quaternion": [0.7071067811865475, 0, 0, 0.7071067811865476],
            "scale": [0.3, 0.3, 0.3]
        }
    }
    ];
    
    for (const {key, value} of components) {
        potionApp.setComponent(key, value);
    }
    await potionApp.addModule(m);
    scene.add(potionApp);

    potionApp.updateMatrixWorld();
    
    // potionApp.addEventListener('use', e => {
    //     console.log('potionApp use');
    // });

    //############################################################### water ########################################################################
    const waterCount = 30;
    const splashCount = 12;
    const dropletCount = 15;
    const group1=new THREE.Group();
    const group2=new THREE.Group();
    let info = {
        waterVelocity: [waterCount],
        waterRotation: [waterCount],
        splashVelocity: [splashCount],
        dropletVelocity: [dropletCount],
        dropletAssignedVelocity: [dropletCount],
        dropletAlreadyChangeVelocity: [dropletCount]
    }
    let waterAcc = new THREE.Vector3(0, -0.0015, 0);
    let splashAcc = new THREE.Vector3(0, -0.0015, 0);
    let dropletAcc = new THREE.Vector3(0, -0.003, 0);

    //##################################################### get geometry #####################################################
    const _getWaterGeometry = geometry => {
        //console.log(geometry)
        const geometry2 = new THREE.BufferGeometry();
        ['position', 'normal', 'uv'].forEach(k => {
          geometry2.setAttribute(k, geometry.attributes[k]);
        });
        geometry2.setIndex(geometry.index);
        
        const positions = new Float32Array(waterCount * 3);
        const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
        geometry2.setAttribute('positions', positionsAttribute);
        
        const startTimes = new Float32Array(waterCount);
        const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
        geometry2.setAttribute('startTimes', startTimesAttribute);

        const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(waterCount), 1);
        opacityAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('opacity', opacityAttribute);

        const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(waterCount), 1);
        brokenAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('broken', brokenAttribute);

        const randomAttribute = new THREE.InstancedBufferAttribute(new Float32Array(waterCount), 1);
        randomAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('random', randomAttribute);
    
        return geometry2;
    };
    const _getSplashGeometry = geometry => {
        //console.log(geometry)
        const geometry2 = new THREE.BufferGeometry();
        ['position', 'normal', 'uv'].forEach(k => {
          geometry2.setAttribute(k, geometry.attributes[k]);
        });
        geometry2.setIndex(geometry.index);
        
        const positions = new Float32Array(splashCount * 3);
        const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
        geometry2.setAttribute('positions', positionsAttribute);
        
        const startTimes = new Float32Array(splashCount);
        const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
        geometry2.setAttribute('startTimes', startTimesAttribute);

        const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(splashCount), 1);
        opacityAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('opacity', opacityAttribute);

        const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(splashCount), 1);
        brokenAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('broken', brokenAttribute);
    
        return geometry2;
    };
    const _getDropletGeometry = geometry => {
        const geometry2 = new THREE.BufferGeometry();
        ['position', 'normal', 'uv'].forEach(k => {
          geometry2.setAttribute(k, geometry.attributes[k]);
        });
        geometry2.setIndex(geometry.index);
        
        const positions = new Float32Array(dropletCount * 3);
        const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
        geometry2.setAttribute('positions', positionsAttribute);

        const startTimes = new Float32Array(dropletCount);
        const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
        geometry2.setAttribute('startTimes', startTimesAttribute);

        const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(dropletCount), 1);
        opacityAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('opacity', opacityAttribute);
    
        return geometry2;
    };
    //##################################################### material #####################################################
    const waterMaterial = new THREE.MeshBasicMaterial()
    waterMaterial.transparent=true; 
    waterMaterial.depthWrite=false;
    //waterMaterial.alphaMap=waveTexture;
    waterMaterial.blending= THREE.AdditiveBlending;
    //waterMaterial.side=THREE.DoubleSide;

    const splashMaterial = new THREE.MeshBasicMaterial()
    splashMaterial.transparent=true; 
    splashMaterial.depthWrite=false;
    //splashMaterial.alphaMap=noiseMap;
    splashMaterial.blending= THREE.AdditiveBlending;
    splashMaterial.side=THREE.DoubleSide;

    const dropletMaterial = new THREE.MeshMatcapMaterial()
    dropletMaterial.matcap = matcapTexture1
    dropletMaterial.transparent=true; 
    dropletMaterial.depthWrite=false;
    //dropletMaterial.alphaMap=noiseMap;
    dropletMaterial.blending= THREE.AdditiveBlending;
    
    const uniforms = {
        uTime: {
            value: 0
        },
        flameTexture:{
            value:flameTexture
        },
        flameTexture2:{
            value:flameTexture2
        },
        gradientNoiseTexture:{
            value:gradientNoiseTexture
        },
        voronoiNoiseTexture:{
            value:voronoiNoiseTexture
        },
        waveTexture:{
            value:waveTexture
        },
        noiseMap:{
            value:noiseMap
        },
        maskTexture:{
            value:maskTexture
        },
        maskTexture2:{
            value:maskTexture2
        }
    }
    waterMaterial.onBeforeCompile = shader => {
        shader.uniforms.uTime = uniforms.uTime;
        shader.uniforms.flameTexture = uniforms.flameTexture;
        shader.uniforms.gradientNoiseTexture = uniforms.gradientNoiseTexture;
        shader.uniforms.voronoiNoiseTexture = uniforms.voronoiNoiseTexture;
        shader.uniforms.waveTexture = uniforms.waveTexture;
        shader.uniforms.maskTexture = uniforms.maskTexture;
        shader.uniforms.noiseMap = uniforms.noiseMap;
        shader.vertexShader =   `
                                    attribute float opacity; 
                                    attribute float random; 
                                    attribute float broken; 
                                    varying float vOpacity; 
                                    varying float vBroken; 
                                    varying float vRandom; 
                                    varying vec3 vPos;
                                    varying vec2 vUv;
                                ` + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          ['vec3 transformed = vec3( position );', 'vOpacity = opacity; vBroken = broken; vRandom = random; vPos = position; vUv = uv;'].join('\n')
        );
        shader.fragmentShader = `
                                    uniform float uTime; 
                                    varying float vBroken;
                                    varying float vRandom;  
                                    varying float vOpacity; 
                                    varying vec3 vPos; 
                                    varying vec2 vUv;
                                    uniform sampler2D gradientNoiseTexture; 
                                    uniform sampler2D flameTexture; 
                                    uniform sampler2D voronoiNoiseTexture;
                                    uniform sampler2D waveTexture;
                                    uniform sampler2D maskTexture;
                                    uniform sampler2D noiseMap;
                                ` + shader.fragmentShader; 

        shader.fragmentShader = shader.fragmentShader
        .replace(
            `vec4 diffuseColor = vec4( diffuse, opacity );`, 
            `
                
            vec4 voronoiNoise = texture2D(
                            voronoiNoiseTexture,
                            vec2(
                                vUv.x,
                                mod(0.1*vUv.y+uTime*0.01,1.)
                            )
            );
            vec4 simpleNoise = texture2D(
                            waveTexture,
                            vec2(
                                vUv.x * 0.7,
                                mod(1.*vUv.y+uTime*7.5,1.)
                            )
            );
            vec4 flame = texture2D(
                            flameTexture,
                            vec2(
                                vUv.x,
                                vUv.y
                            )
            );
            vec4 mask = texture2D(
                            maskTexture,
                            vec2(
                                vUv.x,
                                vUv.y
                            )
            );
                
                
                float powerNum = 1.7 + vRandom;
                simpleNoise = vec4(pow(simpleNoise.r,powerNum),pow(simpleNoise.g,powerNum),pow(simpleNoise.b,powerNum),pow(simpleNoise.a,powerNum));
                float powerNum2 = 1.;
                voronoiNoise = vec4(pow(voronoiNoise.r,powerNum2),pow(voronoiNoise.g,powerNum2),pow(voronoiNoise.b,powerNum2),pow(voronoiNoise.a,powerNum2));
                vec4 diffuseColor = (simpleNoise + vec4(0.0192, 0.960, 0.819, 1.0)) * mask;
                if(diffuseColor.r < 0.1)
                    discard;
                //diffuseColor*= vec4(0.0192, 0.960, 0.819, 1.0) * 2.;
                diffuseColor.a *= vOpacity;

                //float broken;
                //if(vRandom < 0.9)
                    //broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, mix(vUv, voronoiNoise.rg,0.) ).g;
                // else
                //     broken = abs( sin( 1.0 - vBroken ) ) - texture2D( waveTexture, mix(vUv, voronoiNoise.rg,0.) ).g;
                //if ( broken < 0.01 ) discard;
               
                
            `
        );
        // shader.fragmentShader = shader.fragmentShader.replace(
        //     '#include <alphamap_fragment>',
        //     [
        //         // 'float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( alphaMap, mix(vec2(vUv.x,vUv.y)/1.2,gradientNoise.rg,0.1) ).g;',
        //         'float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( alphaMap, mix(vUv, voronoiNoise.rg,0.3) ).g;',
        //         'if ( broken < 0.01 ) discard;'
        //     ].join('\n')
        // );
    };
    splashMaterial.onBeforeCompile = shader => {
        shader.uniforms.uTime = uniforms.uTime;
        shader.uniforms.flameTexture = uniforms.flameTexture;
        shader.uniforms.gradientNoiseTexture = uniforms.gradientNoiseTexture;
        shader.uniforms.voronoiNoiseTexture = uniforms.voronoiNoiseTexture;
        shader.uniforms.waveTexture = uniforms.waveTexture;
        shader.uniforms.maskTexture2 = uniforms.maskTexture2;
        shader.vertexShader =   `
                                    attribute float opacity; 
                                    attribute float broken; 
                                    varying float vOpacity; 
                                    varying float vBroken; 
                                    varying vec3 vPos;
                                    varying vec2 vUv;
                                ` + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          ['vec3 transformed = vec3( position );', 'vUv = uv; vOpacity = opacity; vBroken = broken; vPos = position; vUv = uv; vUv.y = 1.0-vUv.y;'].join('\n')
        );
        shader.fragmentShader = `
                                    uniform float uTime; 
                                    varying float vBroken;  
                                    varying float vOpacity; 
                                    varying vec3 vPos; 
                                    varying vec2 vUv;
                                    uniform sampler2D gradientNoiseTexture; 
                                    uniform sampler2D flameTexture; 
                                    uniform sampler2D waveTexture;
                                    uniform sampler2D voronoiNoiseTexture;
                                    uniform sampler2D maskTexture2;
                                ` + shader.fragmentShader; 

        shader.fragmentShader = shader.fragmentShader
        .replace(
            `vec4 diffuseColor = vec4( diffuse, opacity );`, 
            `
                vec4 gradientNoise = texture2D(
                                        gradientNoiseTexture,
                                        vec2(
                                            0.5*vUv.x,
                                            mod(0.5*vUv.y+uTime*8.,1.)
                                        )
                );
                vec4 flame = texture2D(
                                        flameTexture,
                                        vUv
                );
                vec4 voronoiNoise = texture2D(
                                voronoiNoiseTexture,
                                vec2(
                                    vUv.x,
                                    mod(0.2*vUv.y+uTime*0.01,1.)
                                )
                );
                vec4 simpleNoise = texture2D(
                                waveTexture,
                                vec2(
                                    vUv.x * 0.5,
                                    mod(2.0*vUv.y+uTime*5.,1.)
                                )
                );
                vec4 mask = texture2D(
                                maskTexture2,
                                vUv
                );

                float powerNum = 1.9 + vBroken;
                simpleNoise = vec4(pow(simpleNoise.r,powerNum),pow(simpleNoise.g,powerNum),pow(simpleNoise.b,powerNum),pow(simpleNoise.a,powerNum));
                
                vec4 diffuseColor = simpleNoise;
                diffuseColor *= mask;
                diffuseColor += vec4(0.0192, 0.960, 0.819, 1.0);
                if(diffuseColor.r < 0.1 )
                    discard;
                
                diffuseColor.a *= vOpacity;
                // float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( gradientNoiseTexture, vUv ).g;
                // if ( broken < 0.0001 ) discard;
            `
        );
        // shader.fragmentShader = shader.fragmentShader.replace(
        //     '#include <alphamap_fragment>',
        //     [
        //         'float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( alphaMap, vUv/1.5 ).g;',
        //         'if ( broken < 0.0001 ) discard;'
        //     ].join('\n')
        // );
    };
    dropletMaterial.onBeforeCompile = shader => {
        shader.uniforms.uTime = uniforms.uTime;
        shader.vertexShader = 'attribute float opacity;attribute float broken;\n varying float vOpacity; varying float vBroken; varying vec3 vPos; \n ' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          ['vec3 transformed = vec3( position );', 'vOpacity = opacity; vBroken = broken; vPos = position;'].join('\n')
        );
        shader.fragmentShader = 'uniform float uTime; varying float vBroken; varying float vOpacity; varying vec3 vPos;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader
        .replace(
            `vec4 diffuseColor = vec4( diffuse, opacity );`,
            `
              vec4 diffuseColor = vec4( diffuse, vOpacity);
  
            `
        );
        // shader.fragmentShader = shader.fragmentShader.replace(
        //     '#include <alphamap_fragment>',
        //     [
        //       'float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( alphaMap, vUv ).g;',
        //       'if ( broken < 0.0001 ) discard;'
        //     ].join('\n')
        // );
    };
    //##################################################### load glb #####################################################
    (async () => {
        const u = `${baseUrl}/assets/cylinder3.glb`;
        const dustApp = await new Promise((accept, reject) => {
            const {gltfLoader} = useLoaders();
            gltfLoader.load(u, accept, function onprogress() {}, reject);
            
        });
        dustApp.scene.traverse(o => {
            if (o.isMesh) {
                addInstancedMesh(o.geometry);
            }
        });
    })();
    
    
    (async () => {
        const u = `${baseUrl}/assets/droplet.glb`;
        const dropletApp = await new Promise((accept, reject) => {
            const {gltfLoader} = useLoaders();
            gltfLoader.load(u, accept, function onprogress() {}, reject);
            
        });
        dropletApp.scene.traverse(o => {
            if (o.isMesh) {
                addInstancedMesh2(o.geometry);
                addInstancedMesh3(o.geometry);
            }
        });
        

    })();
    //##################################################### initial instanced mesh #####################################################
    let waterMesh = null;
    let dummy = new THREE.Object3D();
    let matrix = new THREE.Matrix4();

    function addInstancedMesh(geometry2) {
        const geometry = _getWaterGeometry(geometry2);
        waterMesh = new THREE.InstancedMesh(geometry, waterMaterial, waterCount);
        //group1.add(waterMesh);
        //group1.position.x += 0.06;
        // group1.position.y += 0.03;
        // // group1.rotation.y = Math.PI / 19;
        // group1.rotation.x = Math.PI / 4;
        
        // group2.add(group1)
        //scene.add(group2);
        setInstancedMeshPositions(waterMesh);
    }
    function setInstancedMeshPositions(mesh1) {
        for (let i = 0; i < mesh1.count; i++) {
            waterMesh.getMatrixAt(i, matrix);
            dummy.scale.x = .00001;
            dummy.scale.y = .00001;
            dummy.scale.z = .00001;
            dummy.position.x = 0;
            dummy.position.y = 0;
            dummy.position.z = i*20;
            info.waterRotation[i] = 0;
            info.waterVelocity[i] = new THREE.Vector3(0,0,1);
            info.waterVelocity[i].divideScalar(20);
            dummy.updateMatrix();
            mesh1.setMatrixAt(i, dummy.matrix);
        }
        mesh1.instanceMatrix.needsUpdate = true;
    }

    let splashMesh = null;
    
    function addInstancedMesh2(geometry2) {
        const geometry = _getSplashGeometry(geometry2);
        splashMesh = new THREE.InstancedMesh(geometry, splashMaterial, splashCount);
        setInstancedMeshPositions2(splashMesh);
    }
    function setInstancedMeshPositions2(mesh1) {
        for (let i = 0; i < mesh1.count; i++) {
            splashMesh.getMatrixAt(i, matrix);
            dummy.scale.x = .00001;
            dummy.scale.y = .00001;
            dummy.scale.z = .00001;
            dummy.position.x = (Math.random()-0.5)*0.2;
            dummy.position.y = -0.2;
            dummy.position.z = i*0.1;
            info.splashVelocity[i] = new THREE.Vector3();
            info.splashVelocity[i].divideScalar(20);
            dummy.updateMatrix();
            mesh1.setMatrixAt(i, dummy.matrix);
        }
        mesh1.instanceMatrix.needsUpdate = true;
    }

    let dropletMesh = null;
    function addInstancedMesh3(geometry2) {
        const geometry = _getDropletGeometry(geometry2);
        dropletMesh = new THREE.InstancedMesh(geometry, dropletMaterial, dropletCount);
        setInstancedMeshPositions3(dropletMesh);
    }
    function setInstancedMeshPositions3(mesh1) {
        for (let i = 0; i < mesh1.count; i++) {
            dropletMesh.getMatrixAt(i, matrix);
            dummy.scale.x = .00001;
            dummy.scale.y = .00001;
            dummy.scale.z = .00001;
            dummy.position.x = (Math.random()-0.5)*0.2;
            dummy.position.y = -0.2;
            dummy.position.z = i * 20;
            info.dropletVelocity[i] = new THREE.Vector3();
            info.dropletAssignedVelocity[i] = new THREE.Vector3();
            info.dropletVelocity[i].divideScalar(20);
            info.dropletAlreadyChangeVelocity[i]=false;
            dummy.updateMatrix();
            mesh1.setMatrixAt(i, dummy.matrix);
        }
        mesh1.instanceMatrix.needsUpdate = true;
    }


    activateCb = () => {
      activated = !activated;
    };


    let maxWaterParticleCount = 2;
    const maxSplashParticleCount = 1;
    const maxDropletParticleCount = 1;
    let lastSplash = 0;
    let lastDroplet = 0;
    let particleInScene = false;
    let currentDir = new THREE.Vector3();
    let dir = new THREE.Vector3();
    let quaternion = new THREE.Quaternion();
    let splashStartPoint = new THREE.Vector3();
    let dropletStartPoint = new THREE.Vector3();
    quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/2);
    let lastRot = new THREE.Vector3();
    let lastEmitWater = 0;
    let waterCurrentParticleCount = 0;
    let erosion = 0.3;
    let startErosion = false;
    frameCb = timestamp => {
        if (wearing) {
            const headPosition = localVector3.setFromMatrixPosition(localPlayer.avatar.modelBoneOutputs.Head.matrixWorld);

            // trace player direction
            localVector.x=0;
            localVector.y=0;
            localVector.z=-1;
            currentDir = localVector.applyQuaternion( localPlayer.quaternion );
            currentDir.normalize();

            localVector2.set(currentDir.x, currentDir.y, currentDir.z).applyQuaternion(quaternion);

            splashStartPoint.copy(localPlayer.position);
            if (localPlayer.avatar) {
                splashStartPoint.y = headPosition.y-0.02;
            }
            splashStartPoint.x+=0.01*currentDir.x;
            splashStartPoint.z+=0.01*currentDir.z;

            dropletStartPoint.copy(localPlayer.position);
            if (localPlayer.avatar) {
                dropletStartPoint.y = headPosition.y+0.2;
            }
            dropletStartPoint.x+=0.03*currentDir.x;
            dropletStartPoint.z+=0.03*currentDir.z;
            
               
            //############################ water attribute ############################
            const waterOpacityAttribute = waterMesh.geometry.getAttribute('opacity');
            const waterBrokenAttribute = waterMesh.geometry.getAttribute('broken');
            const waterStartTimesAttribute = waterMesh.geometry.getAttribute('startTimes');
            const randomAttribute = waterMesh.geometry.getAttribute('random');

            //############################ splash attribute ############################
            const splashOpacityAttribute = splashMesh.geometry.getAttribute('opacity');
            const splashBrokenAttribute = splashMesh.geometry.getAttribute('broken');
            const splashStartTimesAttribute = splashMesh.geometry.getAttribute('startTimes');

            //############################ droplet attribute ############################
            const dropletOpacityAttribute = dropletMesh.geometry.getAttribute('opacity');
            const dropletStartTimesAttribute = dropletMesh.geometry.getAttribute('startTimes');

            if (localPlayer.getAction('use')){
                
                if(potionApp.position.y>localPlayer.position.y){
                    if(!particleInScene){
                        erosion = 0.7;
                        startErosion = false;
                        lastEmitWater = 0;
                        maxWaterParticleCount = 1;
                        scene.add(waterMesh);
                        scene.add(splashMesh);
                        scene.add(dropletMesh);
                        particleInScene = true;
                    }
                    
                    //############################ water particle ############################
                    let count=0;
                    // group2.position.copy(dropletStartPoint);
                    // //if(localPlayer.quaternion.x === 0)
                    // //group2.quaternion.copy(localPlayer.quaternion);
                    // group2.quaternion.y = localPlayer.quaternion.y;
                    // group2.quaternion.w = localPlayer.quaternion.w;
                    //console.log(group2.quaternion, localPlayer.quaternion)
                    for (let i = 0; i < waterCount; i++) {
                        waterMesh.getMatrixAt(i, matrix);
                        matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                        if(dummy.position.y < localPlayer.position.y - localPlayer.avatar.height + 0.2 && count< maxWaterParticleCount && timestamp - lastEmitWater > 35){
                            waterOpacityAttribute.setX(i, 0.9);
                            dummy.scale.x = (0.04+Math.random()*0.14)*(0.22+(Math.random()*0.1)) / 2;
                            dummy.scale.y = (0.04+Math.random()*0.14)*(0.22+(Math.random()*0.1)) / 2;
                            dummy.scale.z = (0.2+Math.random()*0.1)*(0.22+(Math.random()*0.1)) / 1.2;
                            
                            // dummy.position.x = (Math.random()-0.5)*0.00125;
                            // dummy.position.y = (Math.random()-0.5)*0.00125;
                            // dummy.position.z = 0.06+(Math.random()-0.5)*0.0125;

                            let rand =  (Math.random()-0.5);
                            info.waterRotation[i] = rand;
                            // dummy.rotation.z = rand * 2 * Math.PI;
                            // // dummy.position.x += rand / 30;
                            // // dummy.position.y -= rand / 30;
                            // info.waterVelocity[i].x=(Math.random()-0.5)*0.005;
                            // info.waterVelocity[i].y=(Math.random()-0.5)*0.005;
                            // info.waterVelocity[i].z=0.25+Math.random()*0.25;
                            // info.waterVelocity[i].divideScalar(20);

                            dir.x=dropletStartPoint.x - localPlayer.position.x;
                            dir.z=dropletStartPoint.z - localPlayer.position.z;
                            dir.normalize();

                            info.waterVelocity[i].x = -dir.x * 0.2+(Math.random()-0.5)*0.02;
                            info.waterVelocity[i].y = 0;
                            info.waterVelocity[i].z = -dir.z * 0.2+(Math.random()-0.5)*0.02;
                            info.waterVelocity[i].divideScalar(20);

                            dummy.position.x = dropletStartPoint.x+(Math.random()-0.5)*0.02;
                            dummy.position.y = dropletStartPoint.y+(Math.random()-0.5)*0.02;
                            dummy.position.z = dropletStartPoint.z+(Math.random()-0.5)*0.02;

                            waterBrokenAttribute.setX(i,Math.random()*0.2);
                        
                            waterStartTimesAttribute.setX(i,timestamp);
                            randomAttribute.setX(i, Math.random() * 0.8);
                            
                            count++;

                        }
                        if(count == maxWaterParticleCount)
                            lastEmitWater = timestamp;
                        if(dummy.position.y>-100){
                            info.waterVelocity[i].add(waterAcc);
                            if(timestamp - waterStartTimesAttribute.getX(i)>230){
                                if(waterOpacityAttribute.getX(i)>0)
                                    waterCurrentParticleCount--;
                                waterOpacityAttribute.setX(i, 0.);
                            }
                            if(dummy.scale.x < 0.023){
                                dummy.scale.x *= 1.04;
                                dummy.scale.y *= 1.04;
                                dummy.scale.z *= 1.04;
                            }
                            
                            localVector.copy(dummy.position).add(info.waterVelocity[i]);
                            dummy.lookAt(localVector);
                            dummy.rotation.z += info.waterRotation[i] * 2 * Math.PI;
                            dummy.position.add(info.waterVelocity[i]);
                            dummy.updateMatrix();
                            waterMesh.setMatrixAt(i, dummy.matrix);
                        } 
                    }

                    //############################ splash particle ############################
                    count = 0;
                    for (let i = 0; i < splashCount; i++) {
                        splashMesh.getMatrixAt(i, matrix);
                        matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

                        if(dummy.position.y<localPlayer.position.y - localPlayer.avatar.height && count< maxSplashParticleCount && timestamp - lastSplash > 20){
                            splashOpacityAttribute.setX(i, 0);
                            dummy.scale.x = (Math.random()*0.25)*0.1;
                            dummy.scale.y = (Math.random()*0.25)*0.1;
                            dummy.scale.z = (0.15+Math.random()*0.35)*0.2;

                            let rand = (Math.random()-0.5)*0.035;
                            dir.x=dropletStartPoint.x-(localPlayer.position.x + rand * localVector2.x);
                            dir.z=dropletStartPoint.z-(localPlayer.position.z + rand * localVector2.z);
                            dir.normalize();

                            dummy.position.x = dropletStartPoint.x+(Math.random()-0.5)*0.02;
                            dummy.position.y = dropletStartPoint.y+(Math.random()-0.5)*0.02;
                            dummy.position.z = dropletStartPoint.z+(Math.random()-0.5)*0.02;

                            let rand2 =  (Math.random()-0.5);
                            dummy.rotation.z = rand2 * 2 * Math.PI;
                            // dummy.position.x = splashStartPoint.x;
                            // dummy.position.y = splashStartPoint.y;
                            // dummy.position.z = splashStartPoint.z;
                            
                            info.splashVelocity[i].x= -dir.x * 0.2 + (Math.random()-0.5) * 0.02;
                            info.splashVelocity[i].y= Math.random() * 0.15;
                            info.splashVelocity[i].z= -dir.z * 0.2 + (Math.random()-0.5) * 0.02;
                            info.splashVelocity[i].divideScalar(20);

                            splashBrokenAttribute.setX(i, Math.random()*0.3);
                            splashStartTimesAttribute.setX(i, timestamp);
                            
                            count++;
                            
                        }
                        if(count === maxSplashParticleCount)
                            lastSplash = timestamp;

                        if(dummy.position.y>-100){
                            if(timestamp - splashStartTimesAttribute.getX(i)>330){
                                splashOpacityAttribute.setX(i, 0.9);
                                dummy.scale.z *= 1.03;
                                //if(splashBrokenAttribute.getX(i)<1)
                                    splashBrokenAttribute.setX(i,splashBrokenAttribute.getX(i)+0.035);
                            }
                               
                            info.splashVelocity[i].add(splashAcc);
                            

                            //##############  rotate the glb ##############
                            localVector4.x=0-info.splashVelocity[i].x;
                            localVector4.y=0-info.splashVelocity[i].y;
                            localVector4.z=0-info.splashVelocity[i].z;


                            localVector.copy(dummy.position).add(localVector4);
                            dummy.lookAt(localVector);
                            dummy.position.add(info.splashVelocity[i]);
                            dummy.updateMatrix();
                            splashMesh.setMatrixAt(i, dummy.matrix);
                        } 
                    }

                    //############################ droplet particle ############################
                    count = 0;
                    for (let i = 0; i < dropletCount; i++) {
                        dropletMesh.getMatrixAt(i, matrix);
                        matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                        if(dummy.position.y < localPlayer.position.y - localPlayer.avatar.height + 0.2 && count < maxDropletParticleCount && timestamp - lastDroplet > 50){
                            dropletOpacityAttribute.setX(i, 1);
                            dummy.scale.x = (0.06+Math.random()*0.05)*0.1;
                            dummy.scale.y = (0.06+Math.random()*0.05)*0.1;
                            dummy.scale.z = (0.15+Math.random()*0.05)*0.1;


                            dir.x=dropletStartPoint.x - localPlayer.position.x;
                            dir.z=dropletStartPoint.z - localPlayer.position.z;
                            dir.normalize();

                            info.dropletVelocity[i].x = -dir.x * 0.25+(Math.random()-0.5)*0.1;
                            info.dropletVelocity[i].y = 0;
                            info.dropletVelocity[i].z = -dir.z * 0.25+(Math.random()-0.5)*0.1;
                            info.dropletVelocity[i].divideScalar(20);

                            dummy.position.x = dropletStartPoint.x+(Math.random()-0.5)*0.03;
                            dummy.position.y = dropletStartPoint.y+(Math.random()-0.5)*0.03;
                            dummy.position.z = dropletStartPoint.z+(Math.random()-0.5)*0.03;


                            let rand = (Math.random()-0.5)*0.2;
                            dir.x=dropletStartPoint.x-(localPlayer.position.x + rand * localVector2.x);
                            dir.z=dropletStartPoint.z-(localPlayer.position.z + rand * localVector2.z);
                            dir.normalize();

                            info.dropletAssignedVelocity[i].x = -dir.x*0.5+(Math.random()-0.5)*0.3;
                            info.dropletAssignedVelocity[i].y = Math.random()*0.5;
                            info.dropletAssignedVelocity[i].z = -dir.z*0.5+(Math.random()-0.5)*0.3;

                            

                            dropletStartTimesAttribute.setX(i,timestamp);
                            info.dropletAlreadyChangeVelocity[i]=false;

                            count++;
                        }
                        if(count > maxDropletParticleCount)
                            lastDroplet = timestamp;
                        if(dummy.position.y>-100){
                            if(timestamp - dropletStartTimesAttribute.getX(i)>130 && !info.dropletAlreadyChangeVelocity[i]){
                                if(i % 2 === 0){
                                    info.dropletVelocity[i].x = info.dropletAssignedVelocity[i].x / 1.2;
                                    info.dropletVelocity[i].y = info.dropletAssignedVelocity[i].y;
                                    info.dropletVelocity[i].z = info.dropletAssignedVelocity[i].z / 1.2;
                                    info.dropletVelocity[i].divideScalar(20);
                                }
                                
                                info.dropletAlreadyChangeVelocity[i] = true;
                            }
                           
                            if(info.dropletAlreadyChangeVelocity[i]){
                                
                                if(dropletOpacityAttribute.getX(i)>0 && i % 2 === 0)
                                    dropletOpacityAttribute.setX(i, dropletOpacityAttribute.getX(i)-0.04);
                            }
                            
                            if(dummy.scale.x<0.015){
                                dummy.scale.x +=0.0045/2.5;
                                dummy.scale.y +=0.0045/2.5;
                                dummy.scale.z +=0.0135/2;
                            }
                            // else if(dummy.scale.x>=0.02){
                            //     dummy.scale.x /=(1 + Math.random()*0.05);
                            //     dummy.scale.y /=(1 + Math.random()*0.05);
                            //     dummy.scale.z *=(1 + Math.random()*0.05);
                            // }
                            if(i % 3 === 0)
                                dummy.scale.z *= 1.03;

                            info.dropletVelocity[i].add(dropletAcc);

                            //##############  rotate the glb ##############
                            localVector4.x=0-info.dropletVelocity[i].x;
                            localVector4.y=0-info.dropletVelocity[i].y;
                            localVector4.z=0-info.dropletVelocity[i].z;


                            localVector.copy(dummy.position).add(localVector4);
                            dummy.lookAt(localVector);
                            dummy.position.add(info.dropletVelocity[i]);
                            dummy.updateMatrix();
                            dropletMesh.setMatrixAt(i, dummy.matrix);

                        }

                    }
                    // if(maxWaterParticleCount < 2)
                    //     maxWaterParticleCount += 0.001;
                    if(startErosion)
                        erosion += 0.004;
                    else
                        erosion -= 0.05;
                    if(!startErosion && erosion < 0.2)
                        startErosion = true;
                    
                }
                else{
                    if(particleInScene){
                        for (let i = 0; i < waterCount; i++) {
                            waterMesh.getMatrixAt(i, matrix);
                            matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                            dummy.position.set(0,-100,0);
                            dummy.updateMatrix();
                            waterMesh.setMatrixAt(i, dummy.matrix);
                        }
                        for (let i = 0; i < dropletCount; i++) {
                            dropletMesh.getMatrixAt(i, matrix);
                            matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                            dummy.position.set(0,-100,0);
                            dummy.updateMatrix();
                            dropletMesh.setMatrixAt(i, dummy.matrix);
                        }
                        for (let i = 0; i < splashCount; i++) {
                            splashMesh.getMatrixAt(i, matrix);
                            matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                            dummy.position.set(0,-100,0);
                            dummy.updateMatrix();
                            splashMesh.setMatrixAt(i, dummy.matrix);
                        }
                        scene.remove(waterMesh);
                        scene.remove(splashMesh);
                        scene.remove(dropletMesh);
                        particleInScene = false;
                        const newCureAction = {
                            type: 'cure'
                        };
                        localPlayer.addAction(newCureAction);
                    }
                    
                }
                
            }
            else{
                if(particleInScene){
                    for (let i = 0; i < waterCount; i++) {
                        waterMesh.getMatrixAt(i, matrix);
                        matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                        dummy.position.set(0,-100,0);
                        dummy.updateMatrix();
                        waterMesh.setMatrixAt(i, dummy.matrix);
                    }
                    for (let i = 0; i < dropletCount; i++) {
                        dropletMesh.getMatrixAt(i, matrix);
                        matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                        dummy.position.set(0,-100,0);
                        dummy.updateMatrix();
                        dropletMesh.setMatrixAt(i, dummy.matrix);
                    }
                    for (let i = 0; i < splashCount; i++) {
                        splashMesh.getMatrixAt(i, matrix);
                        matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                        dummy.position.set(0,-100,0);
                        dummy.updateMatrix();
                        splashMesh.setMatrixAt(i, dummy.matrix);
                    }
                    scene.remove(waterMesh);
                    scene.remove(splashMesh);
                    scene.remove(dropletMesh);
                    particleInScene = false;
                }
                
            }
            //############################ water attribute ############################
            waterMesh.instanceMatrix.needsUpdate = true;
            uniforms.uTime.value = timestamp / 1000;
            waterOpacityAttribute.needsUpdate = true;
            waterBrokenAttribute.needsUpdate = true;
            waterStartTimesAttribute.needsUpdate = true;
            randomAttribute.needsUpdate = true;

            //############################ splash attribute ############################
            splashMesh.instanceMatrix.needsUpdate = true;
            splashOpacityAttribute.needsUpdate = true;
            splashBrokenAttribute.needsUpdate = true;
            splashStartTimesAttribute.needsUpdate = true;

            //############################ droplet attribute ############################
            dropletMesh.instanceMatrix.needsUpdate = true;
            dropletOpacityAttribute.needsUpdate = true;
            dropletStartTimesAttribute.needsUpdate = true;
            
            
            
        }
        potionApp.updateMatrixWorld();
        group2.updateMatrixWorld();
    };

    
  })();

  app.getPhysicsObjects = () => {
    return potionApp ? potionApp.getPhysicsObjectsOriginal() : [];
  };


  
  useFrame(({timestamp, timeDiff}) => {
    if (frameCb) {
      const timeDiffS = timeDiff/1000;
      frameCb(timestamp);
    }
  });
  
  useActivate(() => {
    activateCb && activateCb();
    localPlayer.wear(app);
  });
  
  let wearing = false;
  useWear(e => {
    const {wear} = e;
    potionApp.position.copy(app.position);
    potionApp.quaternion.copy(app.quaternion);
    potionApp.scale.copy(app.scale);
    potionApp.updateMatrixWorld();
    
    potionApp.dispatchEvent({
      type: 'wearupdate',
      wear,
    });

    wearing = wear;
  });
  useUse(e => {
    if (e.use && potionApp) {
        potionApp.use();
    }
  });
  useCleanup(() => {
    scene.remove(potionApp);
    potionApp.destroy();
  });

  return app;
};