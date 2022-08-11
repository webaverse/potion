import * as THREE from 'three';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useActivate, useWear, useLoaders, usePhysics, useCleanup, useLocalPlayer, useScene, useInternals} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');




export default e => {
    const app = useApp();
    const scene = useScene();

    app.name = "potion";

    e.waitUntil((async () => {
        let u = `${baseUrl}potion.glb`;
        if (/^https?:/.test(u)) {
            u = '/@proxy/' + u;
        }
        //const m = await metaversefile.import(u);
        const potionApp = await metaversefile.createAppAsync({
            start_url:u, 
            components: app.components,
            position: app.position,
            quaternion: app.quaternion,
            scale: app.scale,
            parent: app.parent
        });
        potionApp.instanceId = "CHANGETOGETID5"//
        scene.add(potionApp);
        
        console.log(potionApp)
        console.log(app)
        //await potionApp.addModule(m);
        //console.log(potionApp)
    })());
    // if (/^https?:/.test(u2)) {
    //   u2 = '/@proxy/' + u2;
    // }
    // const m = await metaversefile.import(u2);
    // // console.log('group objects 3', u2, m);
    // explosionApp = metaversefile.createApp({
    //   name: u2,
    // });
    // explosionApp.contentId = u2;
    // explosionApp.instanceId = getNextInstanceId();
    // explosionApp.position.copy(app.position);
    // explosionApp.quaternion.copy(app.quaternion);
    // explosionApp.scale.copy(app.scale);
    // explosionApp.updateMatrixWorld();
    // explosionApp.name = 'explosion';
    // subApps[0] = explosionApp;

    // await explosionApp.addModule(m);
    // scene.add(explosionApp);
    // explosionApp.add( bulletPointLight );

    const _loadGlb = async url => {
        let o = await new Promise((accept, reject) => {
            const {gltfLoader} = useLoaders();
            gltfLoader.load(`${baseUrl}${url}`, accept, function onprogress() {}, reject);
        });
        return o;
    };


    (async () => {
        //console.log("loads222")
        //const potionObject = await _loadGlb("potion.glb");
        
        //const potion = potionObject.scene;
        //app.add(potion);
        //potion.updateMatrixWorld();

        //potion.traverse((o)=>{
            //console.log(o)
        //})
        //console.log (physics);
        //console.log(potion);
    })();
    return app;

}