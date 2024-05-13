let activeEffect;

function effect (fn) {

    activeEffect = fn;
    fn();
}

const bucket = new WeakMap();

let data = {
    text:"hello world!"
}

const obj = new Proxy(data, {
    get(target, key) {
        // 判断是否注册了activeEffect
        if(!activeEffect) return target[key];
        //取出副作用桶
        let depsMap = bucket.get(target);
        if(!depsMap) {
            bucket.set(target, (depsMap = new Map()));
        }
        let deps = depsMap.get(key);
        if(!deps) {
            depsMap.set(key, (deps = new Set()));
        } 
        deps.add(activeEffect);
        console.log("get被调用");
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;
        const depsMap = bucket.get(target);
        if(!depsMap) return ;
        const effects = depsMap.get(key);
        console.log("set被调用");
        console.log(effects);
        effects && effects.forEach(fn => fn());
    }
});







effect( () => {
    document.body.innerText = obj.text;
})

obj.text = "vue";


