import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useScene, useFrame, useActivate, useLocalPlayer, useLoaders, useUse, useWear, usePhysics, useCleanup, getNextInstanceId, useInternals} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');


const emptyArray = [];
const fnEmptyArray = () => emptyArray;

const textureLoader = new THREE.TextureLoader()
const gradientNoiseTexture = textureLoader.load(`${baseUrl}/textures/gradientNoise.jpg`);
const voronoiNoiseTexture = textureLoader.load(`${baseUrl}/textures/voronoiNoise.jpg`);
const flameTexture = textureLoader.load(`${baseUrl}/textures/flame4.png`);
const flameTexture2 = textureLoader.load(`${baseUrl}/textures/flame1.png`);
const noiseMap = textureLoader.load(`${baseUrl}/textures/noise.jpg`);
const matcapTexture1 = textureLoader.load(`${baseUrl}/textures/matcap4.png`);

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
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

    let u2 = `${baseUrl}potion.glb`;
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
            "quaternion": [0.7071067811865475, 0, 0, 0.7071067811865476],
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
    const waterCount = 50;
    const splashCount = 7;
    const dropletCount = 10;
    const group1=new THREE.Group();
    const group2=new THREE.Group();
    let info = {
        waterVelocity: [waterCount],
        splashVelocity: [splashCount],
        dropletVelocity: [dropletCount],
        dropletAssignedVelocity: [dropletCount],
        dropletAlreadyChangeVelocity: [dropletCount]
    }
    let splashAcc = new THREE.Vector3(0, -0.0015, 0);
    let dropletAcc = new THREE.Vector3(0, -0.005, 0);

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
    waterMaterial.alphaMap=noiseMap;
    waterMaterial.blending= THREE.AdditiveBlending;
    waterMaterial.side=THREE.DoubleSide;

    const splashMaterial = new THREE.MeshBasicMaterial()
    splashMaterial.transparent=true; 
    splashMaterial.depthWrite=false;
    splashMaterial.alphaMap=noiseMap;
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
        }
    }
    waterMaterial.onBeforeCompile = shader => {
        shader.uniforms.uTime = uniforms.uTime;
        shader.uniforms.flameTexture = uniforms.flameTexture;
        shader.uniforms.gradientNoiseTexture = uniforms.gradientNoiseTexture;
        shader.uniforms.voronoiNoiseTexture = uniforms.voronoiNoiseTexture;
        shader.vertexShader =   `
                                    attribute float opacity; 
                                    attribute float broken; 
                                    varying float vOpacity; 
                                    varying float vBroken; 
                                    varying vec3 vPos;
                                ` + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          ['vec3 transformed = vec3( position );', 'vOpacity = opacity; vBroken = broken; vPos = position; vUv = uv;'].join('\n')
        );
        shader.fragmentShader = `
                                    uniform float uTime; 
                                    varying float vBroken;  
                                    varying float vOpacity; 
                                    varying vec3 vPos; 
                                    uniform sampler2D gradientNoiseTexture; 
                                    uniform sampler2D 
                                    flameTexture; 
                                    uniform sampler2D voronoiNoiseTexture;
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
                vec4 voronoiNoise = texture2D(
                                        voronoiNoiseTexture,
                                        vec2(
                                            mod(0.25*vUv.x+uTime*1.,1.),
                                            mod(0.25*vUv.y+uTime*4.,1.)
                                        )
                );
                vec4 flame = texture2D(
                                        flameTexture,
                                        mix(vec2(vUv.x,vUv.y),gradientNoise.rg,0.2)
                );
                voronoiNoise *= voronoiNoise * gradientNoise * flame;
                
                //gl_FragColor = voronoiNoise;
                vec4 diffuseColor = voronoiNoise * 1.5 * vec4(0.00990, 0.974, 0.990, 1.0);
                diffuseColor.a *= vOpacity;
            `
        );
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <alphamap_fragment>',
            [
                'float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( alphaMap, mix(vec2(vUv.x,vUv.y)/1.2,gradientNoise.rg,0.1) ).g;',
                'if ( broken < 0.0001 ) discard;'
            ].join('\n')
        );
    };
    splashMaterial.onBeforeCompile = shader => {
        shader.uniforms.uTime = uniforms.uTime;
        shader.uniforms.flameTexture = uniforms.flameTexture2;
        shader.uniforms.gradientNoiseTexture = uniforms.gradientNoiseTexture;
        shader.uniforms.voronoiNoiseTexture = uniforms.voronoiNoiseTexture;
        shader.vertexShader =   `
                                    attribute float opacity; 
                                    attribute float broken; 
                                    varying float vOpacity; 
                                    varying float vBroken; 
                                    varying vec3 vPos;
                                ` + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          ['vec3 transformed = vec3( position );', 'vOpacity = opacity; vBroken = broken; vPos = position; vUv = uv;'].join('\n')
        );
        shader.fragmentShader = `
                                    uniform float uTime; 
                                    varying float vBroken;  
                                    varying float vOpacity; 
                                    varying vec3 vPos; 
                                    uniform sampler2D gradientNoiseTexture; 
                                    uniform sampler2D 
                                    flameTexture; 
                                    uniform sampler2D voronoiNoiseTexture;
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
                vec4 voronoiNoise = texture2D(
                                        voronoiNoiseTexture,
                                        vec2(
                                            mod(0.25*vUv.x+uTime*1.,1.),
                                            mod(0.25*vUv.y+uTime*4.,1.)
                                        )
                );
                vec4 flame = texture2D(
                                        flameTexture,
                                        mix(vec2(vUv.x,vUv.y),gradientNoise.rg,0.2)
                );
                voronoiNoise = voronoiNoise * voronoiNoise * gradientNoise * flame;
                
                //gl_FragColor = voronoiNoise;
                vec4 diffuseColor = voronoiNoise * 1.5 * vec4(0.00990, 0.974, 0.990, 1.0);
                diffuseColor.a *= vOpacity;
            `
        );
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <alphamap_fragment>',
            [
                'float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( alphaMap, mix(vec2(vUv.x,vUv.y)/1.5,gradientNoise.rg,0.2) ).g;',
                'if ( broken < 0.0001 ) discard;'
            ].join('\n')
        );
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
        const u = `${baseUrl}/assets/halfCylinderglb2.glb`;
        const dustApp = await new Promise((accept, reject) => {
            const {gltfLoader} = useLoaders();
            gltfLoader.load(u, accept, function onprogress() {}, reject);
            
        });
        dustApp.scene.traverse(o => {
            if (o.isMesh) {
                addInstancedMesh(o.geometry);
                addInstancedMesh2(o.geometry);
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
        group1.add(waterMesh);
        group1.position.x += 0.05;
        group1.position.y += 0.03;
        // group1.rotation.y = Math.PI / 19;
        group1.rotation.x = Math.PI / 4;
        
        group2.add(group1)
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
            dummy.position.z = i*0.1;
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
            dummy.position.z = i*0.1;
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


    const maxWaterParticleCount = 6;
    const maxSplashParticleCount = 2;
    const maxDropletParticleCount = 1;
    let lastSplash = 0;
    let particleInScene = false;
    let currentDir = new THREE.Vector3();
    let dir = new THREE.Vector3();
    let quaternion = new THREE.Quaternion();
    let splashStartPoint = new THREE.Vector3();
    let dropletStartPoint = new THREE.Vector3();
    quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/2);
    frameCb = timestamp => {
        if (wearing) {
            // trace player direction
            localVector.x=0;
            localVector.y=0;
            localVector.z=-1;
            currentDir = localVector.applyQuaternion( localPlayer.quaternion );
            currentDir.normalize();

            localVector2.set(currentDir.x, currentDir.y, currentDir.z).applyQuaternion(quaternion);

            splashStartPoint.copy(localPlayer.position);
            if (localPlayer.avatar) {
                splashStartPoint.y = localPlayer.position.y-0.1;
            }
            splashStartPoint.x+=0.01*currentDir.x;
            splashStartPoint.z+=0.01*currentDir.z;

            dropletStartPoint.copy(localPlayer.position);
            if (localPlayer.avatar) {
                dropletStartPoint.y = localPlayer.position.y+0.07;
            }
            dropletStartPoint.x+=0.01*currentDir.x;
            dropletStartPoint.z+=0.01*currentDir.z;
            
               
            //############################ water attribute ############################
            const waterOpacityAttribute = waterMesh.geometry.getAttribute('opacity');
            const waterBrokenAttribute = waterMesh.geometry.getAttribute('broken');
            const waterStartTimesAttribute = waterMesh.geometry.getAttribute('startTimes');

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
                        scene.add(group2);
                        scene.add(splashMesh);
                        scene.add(dropletMesh);
                        particleInScene = true;
                    }
                    
                    //############################ water particle ############################
                    let count=0;
                    group2.position.copy(potionApp.position);
                    group2.rotation.copy(localPlayer.rotation);
                    for (let i = 0; i < waterCount; i++) {
                        waterMesh.getMatrixAt(i, matrix);
                        matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                        if(dummy.position.z>0.35 && count< maxWaterParticleCount){
                            waterOpacityAttribute.setX(i, 0.7);
                            dummy.scale.x = (0.06+Math.random()*0.05)*0.2;
                            dummy.scale.y = (0.06+Math.random()*0.05)*0.2;
                            dummy.scale.z = (0.15+Math.random()*0.05)*0.2;
                            
                            dummy.position.x = (Math.random()-0.5)*0.0125;
                            dummy.position.y = (Math.random()-0.5)*0.0125;
                            dummy.position.z = 0.18+(Math.random()-0.5)*0.0125;

                            dummy.rotation.z = (Math.random()-0.5) * 2 * Math.PI;
                            info.waterVelocity[i].x=(Math.random()-0.5)*0.075;
                            info.waterVelocity[i].y=(Math.random()-0.5)*0.075;
                            info.waterVelocity[i].z=0.15+Math.random()*0.15;
                            info.waterVelocity[i].divideScalar(20);

                            waterBrokenAttribute.setX(i,0.4 + Math.random()*0.3);
                        
                            waterStartTimesAttribute.setX(i,timestamp);
                            
                            count++;

                        }
                        if(dummy.position.y>-100){
                        
                            if(timestamp - waterStartTimesAttribute.getX(i)>230){
                                waterOpacityAttribute.setX(i, 0.);
                            }
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

                        if(dummy.position.y<localPlayer.position.y - localPlayer.avatar.height && count< maxSplashParticleCount && timestamp - lastSplash > 150){
                            splashOpacityAttribute.setX(i, 0);
                            dummy.scale.x = (0.07+Math.random()*0.1)*0.25;
                            dummy.scale.y = (0.07+Math.random()*0.1)*0.25;
                            dummy.scale.z = (0.2+Math.random()*0.15)*0.25;

                            let rand = (Math.random()-0.5)*0.02;
                            dir.x=splashStartPoint.x-(localPlayer.position.x + rand * localVector2.x);
                            dir.z=splashStartPoint.z-(localPlayer.position.z + rand * localVector2.z);
                            dir.normalize();

                            dummy.position.x = splashStartPoint.x;
                            dummy.position.y = splashStartPoint.y;
                            dummy.position.z = splashStartPoint.z;
                            
                            info.splashVelocity[i].x= -dir.x * 0.25;
                            info.splashVelocity[i].y= Math.random() * 0.15;
                            info.splashVelocity[i].z= -dir.z * 0.25;
                            info.splashVelocity[i].divideScalar(20);

                            splashBrokenAttribute.setX(i, 0.35 + 0.15 * Math.random());
                            splashStartTimesAttribute.setX(i, timestamp);
                            
                            count++;
                            
                        }
                        if(count === maxSplashParticleCount)
                            lastSplash = timestamp;

                        if(dummy.position.y>-100){
                            if(timestamp - splashStartTimesAttribute.getX(i)>200){
                                splashOpacityAttribute.setX(i, 0.4);
                                dummy.scale.z *= 1.03;
                                if(splashBrokenAttribute.getX(i)<1)
                                    splashBrokenAttribute.setX(i,splashBrokenAttribute.getX(i)+0.007);
                            }
                                
                            info.splashVelocity[i].add(splashAcc);
                            
                            localVector.copy(dummy.position).add(info.splashVelocity[i]);
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
                        if(dummy.position.y < localPlayer.position.y - localPlayer.avatar.height + 0.2 && count < maxDropletParticleCount){
                            dropletOpacityAttribute.setX(i, 0.9);
                            dummy.scale.x = (0.06+Math.random()*0.05)*0.2;
                            dummy.scale.y = (0.06+Math.random()*0.05)*0.2;
                            dummy.scale.z = (0.15+Math.random()*0.05)*0.2;


                            dir.x=dropletStartPoint.x - localPlayer.position.x;
                            dir.z=dropletStartPoint.z - localPlayer.position.z;
                            dir.normalize();

                            info.dropletVelocity[i].x = -dir.x * 0.25;
                            info.dropletVelocity[i].y = 0;
                            info.dropletVelocity[i].z = -dir.z * 0.25;
                            info.dropletVelocity[i].divideScalar(20);

                            dummy.position.x = dropletStartPoint.x+(Math.random()-0.5)*0.03;
                            dummy.position.y = dropletStartPoint.y+(Math.random()-0.5)*0.03;
                            dummy.position.z = dropletStartPoint.z+(Math.random()-0.5)*0.03;


                            let rand = (Math.random()-0.5)*0.2;
                            dir.x=dropletStartPoint.x-(localPlayer.position.x + rand * localVector2.x);
                            dir.z=dropletStartPoint.z-(localPlayer.position.z + rand * localVector2.z);
                            dir.normalize();

                            info.dropletAssignedVelocity[i].x = -dir.x*0.5;
                            info.dropletAssignedVelocity[i].y = Math.random()*0.5;
                            info.dropletAssignedVelocity[i].z = -dir.z*0.5;

                            

                            dropletStartTimesAttribute.setX(i,timestamp);
                            info.dropletAlreadyChangeVelocity[i]=false;

                            count++;
                        }
                        if(dummy.position.y>-100){
                            if(timestamp - dropletStartTimesAttribute.getX(i)>100 && !info.dropletAlreadyChangeVelocity[i]){
                                info.dropletVelocity[i].x = info.dropletAssignedVelocity[i].x+(Math.random()-0.5)*0.3;
                                info.dropletVelocity[i].y = info.dropletAssignedVelocity[i].y;
                                info.dropletVelocity[i].z = info.dropletAssignedVelocity[i].z+(Math.random()-0.5)*0.3;
                                info.dropletVelocity[i].divideScalar(20);
                                info.dropletAlreadyChangeVelocity[i] = true;
                                info.dropletVelocity[i].add(dropletAcc);
                            }
                            else{
                                info.dropletVelocity[i].y += -0.003;
                            }
                            
                            
                            
                            

                            //##############  rotate the glb ##############
                            localVector2.x=0-info.dropletVelocity[i].x;
                            localVector2.y=0-info.dropletVelocity[i].y;
                            localVector2.z=0-info.dropletVelocity[i].z;

                            if(dummy.scale.x<0.02){
                                dummy.scale.x +=0.0045/2;
                                dummy.scale.y +=0.0045/2;
                                dummy.scale.z +=0.0135/2;
                            }
                            else if(dummy.scale.x>=0.02){
                                dummy.scale.z *=1.01;
                            }

                            localVector.copy(dummy.position).add(localVector2);
                            dummy.lookAt(localVector);
                            dummy.position.add(info.dropletVelocity[i]);
                            dummy.updateMatrix();
                            dropletMesh.setMatrixAt(i, dummy.matrix);

                        }

                    }
                }
                else{
                    if(particleInScene){
                        scene.remove(group2);
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
                    scene.remove(group2);
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