const leveljs = require('level-js')
const clone = require('clone')
interface IAction {
    (...params): Promise<any>
}
export const ERR_ID = 'id should be string'
export const ERR_DATA_EXPIRED = 'data expired'
export class Once {
    private $cache = new Map()
    private db: Promise<LevelUp>

    constructor(name: string = 'once') {
        this.$cache = new Map()
        this.db = new Promise((resolve, reject) => {
            let db = leveljs(name)
            db.open((err) => {
                if (err) {
                    return reject(err)
                }
                resolve(db)
            })
        })
        this.cleanExpire()
        setInterval(() => {
            this.cleanExpire()
        }, 30 * 1000)
    }

    async 'do'(id: string, action: IAction, cache: boolean|number) {
        if (typeof id !== 'string') {
            return await Promise.reject(ERR_ID)
        }
        let p: Promise<any> = this.$cache.get(id)
        if (p && p.then) {
            // clone 一份, 确保多个请求不会修改同一个对象
            try {
                let d = await p
                return await Promise.resolve(clone(d))
            } catch (err) {
                return await Promise.reject(err)
            }
            // return await new Promise((resolve, reject) => {
            //     p.then(d => resolve(clone(d)))
            //         .catch(err => reject(err))
            // })
        }

        p = (async() => {
            if (!cache) {
                // 不缓存则直接
                return await action()
            }
            // 查询异步缓存
            let db = await this.db
            try {
                let cacheData = await new Promise((resolve, reject) => {
                    db.get(id, {raw: true}, (err, value) => {
                        if (err) {
                            this.$cache.delete(id)
                            return reject(err)
                        }
                        // db 写入过期时间
                        if (!value || !value.expire || value.expire < Date.now()) {
                            // 发现过期, 清除缓存
                            this.$cache.delete(id)
                            return reject(ERR_DATA_EXPIRED)
                        }
                        resolve(value.data)
                    })
                })
                return await Promise.resolve(cacheData)
            } catch (err) {
                // do nothing
            }

            try {
                let result = await action()
                // 命中结果, 进缓存
                await new Promise((resolve, reject) => {
                    let expire
                    // 因为前面已经判断过 cache 为假的情况, 所以现在只处理 cache 为真 或 数字时的情况

                    if (typeof cache === 'boolean') {
                        // 最长保存一天
                        expire = Date.now() + 24 * 60 * 60 * 1000
                    } else {
                        expire = Date.now() + (+cache)
                    }
                    db.put(id, {
                        expire,
                        data: result
                    }, {raw: true}, (err) => {
                        if (err) {
                            return reject(err)
                        }
                        resolve()
                    })
                })

                return await Promise.resolve(result)
            } catch (err) {
                return await Promise.reject(err)
            }
        })()

        this.$cache.set(id, p)
        p.catch(() => {
            this.$cache.delete(id)
        })
        if (!cache) {
            p.then(() => {
                this.$cache.delete(id)
            }).catch(() => {
                this.$cache.delete(id)
            })
        }

        // clone 一份, 确保多个请求不会修改同一个对象
        try {
            let d = await p
            return await Promise.resolve(clone(d))
        } catch (err) {
            return await Promise.reject(err)
        }
    }

    async remove(id) {
        this.$cache.delete(id)
        let db = await this.db
        return await new Promise((resolve, reject) => {
            db.del(id, err => {
                if (err) {
                    return reject(err)
                }
                resolve()
            })
        })
    }

    clean() {
        this.$cache = new Map()
        this.db = (async() => {
            let db = await this.db

            let x = db.iterator({
                keys: true,
                values: false
            })
            let allKeys = []
            x.next((err, key) => {
                if (err) {
                    console.error(err)
                    return
                }
                // db 写入过期时间
                if (key) {
                    allKeys.push(key)
                    this.$cache.delete(key)
                }
                if (!err && !key) {
                    db.batch(allKeys.map(key => {
                        return {
                            type: 'del',
                            key
                        }
                    }), (err) => {
                        if (err) {
                            console.error(err)
                        }
                    })
                }
            })
            return db
        })()
    }

    async cleanExpire() {
        let db = await this.db

        let x = db.iterator({
            keys: true,
            values: true,
            raw: true
        })
        let expiredKeys = []
        x.next((err, key, value) => {
            // db 写入过期时间
            if (!value || !value.expire || value.expire < Date.now()) {
                if (key) {
                    expiredKeys.push(key)
                    // 发现过期, 清除缓存
                    this.$cache.delete(key)
                }
            }
            if (!err && !key && !value) {
                db.batch(expiredKeys.map(key => {
                    return {
                        type: 'del',
                        key
                    }
                }), (err) => {
                    if (err) {
                        console.error(err)
                    }
                })
            }
        })
    }
}
