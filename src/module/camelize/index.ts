/**
 * Created by huangjin on 16/4/8.
 */

let sr = /(\w)_(\w)/g
let cr = /[A-Z]/g

function s2c(str = '') {
    return str.replace(sr, ($0, $1 = '', $2 = '') => {
        return $1 + $2.toUpperCase()
    })
}

function c2s(str) {
    // do nothing
    return str.replace(cr, ($0 = '') => {
        return '_' + $0.toLowerCase()
    })
}

export function camelize(obj, depth = 20) {
    if (depth < 0) {
        throw new Error('maybe cycle reference')
    }
    let type = Object.prototype.toString.call(obj).slice(8, -1).toLowerCase()
    if (['number', 'string', 'boolean', 'null', 'undefined'].indexOf(type) > -1) {
        return obj
    }
    let newObj
    if (Array.isArray(obj)) {
        newObj = obj.map(o => {
            return camelize(o, depth - 1)
        })
    } else if (type === 'object') {
        let keys = Object.keys(obj)
        newObj = {}
        for (let k of keys) {
            let ck = s2c(k)
            newObj[ck] = camelize(obj[k], depth - 1)
        }
    }
    return newObj
}

export function unCamelize(obj, depth = 20) {
    if (depth < 0) {
        throw new Error('maybe cycle reference')
    }
    let type = Object.prototype.toString.call(obj).slice(8, -1).toLowerCase()
    if (['number', 'string', 'boolean', 'null', 'undefined'].indexOf(type) > -1) {
        return obj
    }
    let newObj
    if (Array.isArray(obj)) {
        newObj = obj.map(o => {
            return unCamelize(o, depth - 1)
        })
    } else if (type === 'object') {
        let keys = Object.keys(obj)
        newObj = {}
        for (let k of keys) {
            let ck = c2s(k)
            newObj[ck] = unCamelize(obj[k], depth - 1)
        }
    }
    return newObj
}
