//全局变量储存副作用函数
let activeEffect;

// effect 栈
const effectStack = []  //new

// 定义data对象，它将被代理
const data = { ok: true, text: 'hello world' }
const bucket = new WeakMap();


function effect(fn) {
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

    //deps这个数组里 放的是activeEffect函数的set
    effectFn.deps = [];

    /**quote
    "在调用 forEach 遍历 Set 集合时，如果一个值已经被访问过了，但该值被删除并重新添加到集合，
    如果此时 forEach 遍历没有结束，那么该值会重新被访问。"
    **/
    //循环到这里时,因为forEach的特性 显示在cleanup中删除了depsSet的active 然后又去get中触发 无限循环!
    effectFn();
}
//每次进行绑定时 都要清理下当前
function cleanup(effectFn) {
    for (let i = 0; i < effectFn.deps.length; i++) {
        const deps = effectFn.deps[i];
        // 删除set
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
    //当前激活的副作用函数添加到依赖集合deps中
    deps.add(activeEffect);
    //把deps这个Set放入effectFn中.
    activeEffect.deps.push(deps);
}


function trigger(target, key) {
    //取出当前target的Map
    const depsMap = bucket.get(target);
    if (!depsMap) return;
    //取出当前key的副作用函数
    const effects = depsMap.get(key);
    //这一步会执行effectFn  而它又会去调用get过滤器  导致再次注册 方法   
    //因为forEach的特性  会触发一边删除set 一边注册set 无限循环

    const effectsToRun = new Set(effects);
    effectsToRun.forEach(effctFn => effctFn());
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
    document.body.innerText = obj.ok ? obj.text : 'not'
})


obj.text = "string";
