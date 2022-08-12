import * as THREE from 'three';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
import { Quaternion, Vector3 } from 'three';
const {useApp, useFrame, useActivate, useWear, useLoaders, usePhysics, useCleanup, useLocalPlayer, useScene, useInternals} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const vec3Position = new Vector3();
const vec3Scale = new Vector3();
const quatRotation = new Quaternion();

const _getWorldTransform = (obj) =>{
    obj.getWorldPosition(vec3Position);
    obj.getWorldScale(vec3Scale);
    obj.getWorldQuaternion(quatRotation);
}

export default e => {
    const app = useApp();
    const physics = usePhysics();
    const localPlayer = useLocalPlayer();

    app.name = "potion";
    app.content = 12;

    let fluid = null;
    let potionApp = null;
    let wearing = false;
    let active = true;
    
    _getWorldTransform(app);
    const physicsObject = physics.addCapsuleGeometry(
        vec3Position,
        quatRotation,
        0.2,
        0
    );


    e.waitUntil((async () => {
        let u = `${baseUrl}potion_2.glb`;
        if (/^https?:/.test(u)) {
            u = '/@proxy/' + u;
        }
        potionApp = await metaversefile.createAppAsync({
            start_url:u, 
        });
        app.add(potionApp.glb.scene);
        potionApp.glb.scene.traverse( (o) => {
            if (fluid === null && o.name.includes("fluid"))fluid = o;
        });
    })());


    const drinkPotion = (timeDiff) =>{
        app.content -= timeDiff * 0.01;

        if (app.content < 0){
            const newCureAction = {
                type: 'cure'
            };
            localPlayer.addAction(newCureAction);
            
            
            active = false;
            app.content = 0;
            console.log(app.removeComponent)
            app.removeComponent("use");
            app.name = "Empty Bottle";
            if (fluid) fluid.visible = false;

            console.log(app.components);
        }
        if (fluid) 
            fluid.scale.set(1,app.content/12,1);
    }

    useFrame(({timeDiff})=>{
        if (wearing && localPlayer.getAction('use') && active)
            drinkPotion(timeDiff);
    });

    
    useWear(e => {
      wearing = e.wear;
    });

    
    return app;

}