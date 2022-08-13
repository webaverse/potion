import metaversefile from 'metaversefile';

const {useApp, useFrame, useWear, usePhysics, useCleanup, useLocalPlayer} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

export default e => {
    const app = useApp();
    const physics = usePhysics();
    const localPlayer = useLocalPlayer();

    const potionData = app.getComponent("potion") || {};
    const{fluidName, potionName, emptyName, effect, stats } = potionData;

    app.name = potionName || "Potion";
    
    let triggerTime,initialTime = 1.2;  // In seconds / save twice to normalize later
    let fluid = null;                   // The 3d model of the fluid inside the gltf file
    let potionApp = null;               // The subapp that holds the model information
    let wearing = false;

    // Load 3d model of potion
    e.waitUntil((async () => {
        let u = `${baseUrl}potion.glb`;
        if (/^https?:/.test(u)) {
            u = '/@proxy/' + u;
        }
        potionApp = await metaversefile.createAppAsync({
            start_url:u, 
        });

        // Once loaded, dont forget to add it to your main App to be displayed in the scene
        app.add(potionApp);

        // Use the imported model to create a geometry physics.
        physics.addGeometry(potionApp);

        // Find an object in the imported model hierarchy with the name "fluid" or the fluidName set by user in the components
        potionApp.traverse( (o) => {
            if (fluid === null && o.name.includes((fluidName||"fluid"))){
                fluid = o;
            }
        });
    })());

    const _drinkPotion = (timeDiff) =>{
        // TimeDiff is in miliseconds, multiply it by 0.001 to get it in seconds
        triggerTime -= timeDiff * 0.001;
        if (triggerTime < 0){

            _triggerPotionEffect(effect || 'cure');
            triggerTime = 0;
            
        }
        _setFluidScale(triggerTime/initialTime);
    }

    // Set the fluid scale depending on the time user has used the potion
    const _setFluidScale = (scale) => {
        // Set it only in y value, in your 3d model application make sure the pivot of the fluid is in the bottom of the fluid model
        if (fluid) 
            fluid.scale.set(1,scale,1);
    }

    // The actual trigger, here is what happens when the user finish triggering the potion
    const _triggerPotionEffect = (useEffect) =>{

        // Visual effects of the potion
        const effectAction = {
            type: useEffect
        };
        localPlayer.addAction(effectAction);

        // TODO: localPlayer apply "stats"

        // Disable the ability to use the potion
        // In this case remove "drink" behaviour
        app.removeComponent("use"); 
        // TODO: instead of removing the use action, change it from "drink" to "swing" (to fill the bottle again)
        app.name = emptyName || "Empty Bottle";
        if (fluid) fluid.visible = false;
    }

    useFrame(({timeDiff})=>{
        // Action "use" is valid everytime the user is clicking while wearing in hand anything that can be used, so make sure you're also validating user is wearing this app
        if (wearing && localPlayer.getAction('use')){
            _drinkPotion(timeDiff);
        }
        // If user does not click for at least the trigger time, reset to original state of the fluid and the triggerTime counter
        else{
            if (triggerTime != initialTime) {
                triggerTime = initialTime;
                _setFluidScale(1);
            }
        }         
    });
    
    // Detects when the user is holding this item
    useWear(e => {
      wearing = e.wear;
    });

    
    return app;

}