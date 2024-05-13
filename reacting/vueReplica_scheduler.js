/**
 * 实现scheduler
 */

//全局变量储存副作用函数
let activeEffect;

// effect 栈
const effectStack = []  //new

// 定义data对象，它将被代理
const data = { ok: true, text: 'hello world' }
const bucket = new WeakMap();


function effect(fn, options = {}) {
    //闭包，用全局变量activeEffect = effectFn;来保证在函数外effectFn仍然生效。
    const effectFn = () => {
        cleanup(effectFn);

        activeEffect = effectFn;
        //放入effectStack
        effectStack.push(effectFn);
        //fn函数中如果有嵌套,在此处触发,即当前副作用函数没有出栈.进入下一个effectFn函数!
        fn();
        //fn调用用后弹出
        effectStack.pop();
        //active放入栈顶函数
        activeEffect = effectStack[effectStack.length - 1];
    }

    effectFn.options = options;

    effectFn.deps = [];

    effectFn();
}


function cleanup(effectFn) {
    console.log('cleanup被触发');

    for (let i = 0; i < effectFn.deps.length; i++) {
        const deps = effectFn.deps[i];
        deps.delete(effectFn);
    }

    effectFn.deps.length = 0;
}


function track(target, key) {
    if (!activeEffect) return;
    let depsMap = bucket.get(target);
    if (!depsMap) {
        bucket.set(target, (depsMap = new Map()));
    }

    let deps = depsMap.get(key);
    if (!deps) {
        depsMap.set(key, (deps = new Set()));
    }
    deps.add(activeEffect);
    activeEffect.deps.push(deps);
}


function trigger(target, key) {
    const depsMap = bucket.get(target);
    if (!depsMap) return;
    const effects = depsMap.get(key);

    const effectsToRun = new Set();
    effects && effects.forEach(effectFn => {
        if(effectFn !== activeEffect) {
            effectsToRun.add(effectFn);
        }
    })


    effectsToRun.forEach(effectFn => {
        //如果用户实现了scheduler 使用scheduler()
        if (effectFn.options.scheduler) {
            effectFn.options.scheduler(effectFn);
        } else {
            effectFn();
        }
    });
    // effects && effects.forEach(fn => fn());
}





//实现对象代理：拦截所有get和set
const obj = new Proxy(data, {
    get(target, key) {
        track(target, key)
        console.log("get被触发! 触发者：" + key);
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;
        console.log("set被触发! 触发者：" + key);
        trigger(target, key);
    }
})



//调用effect 传入匿名副作用函数 执行后  通过get已经给obj树下的ok和text绑定好了activeEffect
effect(function effectFn() {
    console.log("effect被执行！");
    document.body.innerText = obj.text
}
, 
{
    scheduler(fn) {
        setTimeout(fn,2000);
    }
}
)


obj.text = "第三个执行";

console.log("我是第二个执行.")
