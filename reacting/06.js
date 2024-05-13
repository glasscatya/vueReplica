// 分支切换


// 将对象的属性与副作用函数一一对应
// 数据结构为WeakMap->Map->Set,
// WeakMap--target:Map
// Map--prop:Set
// Set--activeEffect

//存储副作用函数的桶
let bucket = new WeakMap()
    //存储副作用函数
let activeEffect

let data = {
    ok: true,
    text: 'test',
}

data = new Proxy(data, {
    get(target, prop) {
        track(target, prop)
        return target[prop]
    },
    set(target, prop, val) {
        target[prop] = val
        trigger(target, prop)
        console.log('set被触发');

        return true
    }
})

function track(target, prop) {
    if (!activeEffect) {
        return
    }
    if (!bucket.has(target)) {
        bucket.set(target, new Map())
    }
    if (!bucket.get(target).has(prop)) {
        bucket.get(target).set(prop, new Set())
    }
    bucket.get(target).get(prop).add(activeEffect)
    activeEffect.deps.push(bucket.get(target).get(prop))
    console.log('track被触发');
    console.log('activeEffect.deps', activeEffect.deps);
}

function trigger(target, prop) {
    const effectsToRun = new Set(bucket.get(target).get(prop))
    effectsToRun.forEach(fn => fn())

}



//注册副作用函数
function effect(fn) {
    const effectFn = () => {
            //清除工作
            cleanup(effectFn)
            activeEffect = effectFn
            fn()
        }
        //存储与副作用函数相关联的依赖合集
    effectFn.deps = []
        //执行副作用函数的时候会触发track，从而将依赖函数放进effectFn.deps数组里
    effectFn()
}

function cleanup(effectFn) {
    console.log('cleanup被触发');

    for (let i = 0; i < effectFn.deps.length; i++) {
        const deps = effectFn.deps[i]
        deps.delete(effectFn)
    }
    effectFn.deps.length = 0
}

function fn() {
    document.body.innerText = data.ok ? data.text : 'not'
    console.log('fn run');
}



effect(fn)

setTimeout(() => {
    data.ok = false
}, 2000)



// setTimeout(() => {
//     data.text = 'not change'
// }, 2000)