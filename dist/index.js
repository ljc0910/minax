class Store {
  constructor(store) {
    this.easyMode = !!store.easyMode
    this.bindStorageMode = !!store.bindStorageMode
    this.state = store.state
    this.mutation = store.mutation
  }

  commit(type, payload) {
    this.mutation[type](this.state, payload)
    if (this.registerQueue[type]) {
      this.registerQueue[type].forEach(context => {
        this.assignment(context, type, this.state[type])
      })
    }
  }

  /*
  * 赋值操作, 将值赋遇到上下文（这里指页面或组件）的data中，调用组件或页面的setData方法
  * @
  */
  assignment(context, key, value) {
    if (!context.setData) {
      console.error('Context not has setData method of assignment')
    }
    let obj = {}
    obj[key] = value
    context.setData(obj)
  }

  registerQueue = {}

  // 注册订阅列表
  registe(types = [], context) {
    // 注册时给定初始值，将其映射到页面或组件上
    types.forEach(type => {
      this.assignment(context, type, this.state[type])
      // 如果队列未注册，则添加一个空数组
      if (!this.registerQueue[type]) {
        this.registerQueue[type] = []
      }
      // 如果不存在该页面实例， 则push
      if (this.registerQueue[type].indexOf(context) < 0) {
        this.registerQueue[type].push(context)
      }
    })


  }

  install(fn, path) {
    if (typeof fn !== 'function') {
      console.error('[minax]:The first parameter of installer expect function, but got other!')
      return
    }
    let _store = this
    const oFn = fn
    fn = (config) => {
      !config && (config = {})
      // 携带path的基本是组件了
      if (path) {
        !config[path] && (config[path] = {})
        config.methods.$store = this
        if (config.mapState) {
          !config.attached && (config.attached = function () {})
          const oAttached = config.attached
          config.attached = function () {
            if (this.mapState) {
              // 接受传入的数据，传的是数组，则返回数组，如果传的是字符串，则使用字符串
              // TODO，后期会改成接受key: value的形式，key 为type, 可以是getter函数的形式，达成类似vuex的效果
              let list = []
              if (Array.isArray(this.mapState)) {
                list = this.mapState
              } else if (typeof this.mapState === 'string') {
                list.push(this.mapState)
              }
              _store.registe(list, this)
            }
            oAttached.apply(this, arguments)
          }
          // TODO 后期会增加对卸载的处理
        }
      } else { // 这里是对页面的处理
        config.$store = this
        // 如果有mapState属性，则劫持onLoad注册
        if (config.mapState) {
          !config.onLoad && (config.onLoad = function () {})
          const oOnLoad = config.onLoad
          config.onLoad = function () {
            if (this.mapState) {
              // 接受传入的数据，传的是数组，则返回数组，如果传的是字符串，则使用字符串
              // TODO，后期会改成接受key: value的形式，key 为type, 可以是getter函数的形式，达成类似vuex的效果
              let list = []
              if (Array.isArray(this.mapState)) {
                list = this.mapState
              } else if (typeof this.mapState === 'string') {
                list.push(this.mapState)
              }
              _store.registe(list, this)
            }
            oOnLoad.apply(this, arguments)
          }
        }
      }
      oFn(config)
    }
    return fn
  }
}

module.exports = Store
