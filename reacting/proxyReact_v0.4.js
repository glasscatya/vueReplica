//全局变量储存副作用函数
let activeEffect;

// 定义data对象，它将被代理
const data = { ok: true, text: 'hello world' }


const bucket = new WeakMap();


function effect(fn) {
    //调用effect注册副作用函数时, activeEffect被赋值。
    activeEffect = fn;
    // 真正的执行
    fn();
}


function track(target, key) {
    if(!activeEffect) return target[key]
    let depsMap = bucket.get(target);
    if (!depsMap) {
        bucket.set(target, (depsMap = new Map()));
    }

    let deps = depsMap.get(key);
    if(!deps) {
        depsMap.set(key, (deps = new Set()));
    }
    deps.add(activeEffect);
}


function trigger(target, key) {
    //取出当前target的Map
    const depsMap = bucket.get(target);
    if(!depsMap) return ;
    //取出当前key的副作用函数
    const effects = depsMap.get(key);
    effects && effects.forEach( fn => fn());
}


//实现对象代理：拦截所有get和set
const obj = new Proxy(data, {
    get(target, key) {
        track(target, key)
        console.log("get被触发! 触发者："+key);
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;
        console.log("set被触发! 触发者："+key);
        trigger(target, key);
    }
})


//调用effect 传入匿名副作用函数


// effect(function effectFn() {
//     console.log("effect被执行！");
//     document.body.innerText = obj.ok ? obj.text : 'not'
//  })


effect(function effectFn() {
    //访问obj.text  触发get   
    document.body.innerText = obj.text;
    console.log("effect被执行！");

 })

 obj.text = "ss"
// var t = obj.text;