//全局变量储存副作用函数
let activeEffect;

function effect(fn) {
    //调用effect注册副作用函数时, activeEffect被赋值。
    activeEffect = fn;
    // 真正的执行
    fn();
}

// 定义data对象，它将被代理
let data = {
    text: 'Hello World' // 假设初始值
};

const bucket = new WeakMap();
//实现对象代理：拦截所有get和set



const obj = new Proxy(data, {
    get(target, key) {
        if(!activeEffect) return target[key]
        
        //判断当前桶里是否存储了target  如果存储了 直接下一步，如果没有新建 k：target v：new Map
        let depsMap = bucket.get(target);
        if (!depsMap) {
            bucket.set(target, (depsMap = new Map()));
        }

        let deps = depsMap.get(key);
        if(!deps) {
            depsMap.set(key, (deps = new Set()));
        }
        
        deps.add(activeEffect);
        console.log("T:"+target+"K:"+key);
        console.log("get被调用")
        return target[key];
    },
    set(target, key, newVal) {
        target[key] = newVal;

        //取出当前target的Map
        const depsMap = bucket.get(target);
        if(!depsMap) return ;
        //取出当前key的副作用函数
        const effects = depsMap.get(key);

        //短路语法  当effects不为空时，才执行后面的语句（后半句永远为真
         //判断是否有当前key的副作用函数
        console.log("set被调用")
        effects && effects.forEach( fn => fn());
    }
})

console.log(obj.text);

//调用effect 传入匿名副作用函数
effect( 
    () => {
        console.log("1");
        document.body.innerText = obj.text;
    }
)

// setTimeout(() => {
//     effect( 
//         () => {    
//             console.log("2");
//             document.body.innerText = obj.text;
//         }
//     )
// }, 2000);

obj.text = "vue3"

// obj.text = "vue4"


