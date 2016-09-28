const LZString = require('lz-string')
import {camelize} from '../camelize'
const storeKeyName = 'av-session'
const APP = 'warriors of the night assemble'
export const ERR_NO_SESSION = 'no-session'
export const ERR_EXPIRED = 'expired'
export const ERR_REFRESH_FAILED = 'refresh-failed'
export const ERR_TOKEN_NEED_REFRESH = 3000604
interface ISessionState {

}
let lastId = 'unknown'
let sessionResolve
let sessionPromise = new Promise((resolve) => {
    sessionResolve = resolve
})


export async function ensure() {
    return await sessionPromise
}

export async function login(email: string, password: string, remember: boolean = false, app: string = APP) {
    let url = '/auth/login'
    let data = {
        email,
        password,
        app
    }
    let myHeaders = new Headers()
    myHeaders.set('X-Request-With', 'insight-web')
    myHeaders.set('Content-Type', 'application/json')
    let response = await fetch(url, {
        method: 'POST', body: JSON.stringify(data),
        headers: myHeaders
    })
    let json = await response.json()
    if (json.meta.errCode !== 0) {
        await Promise.reject(json)
        return false
    }
    let {token, expire_in: expire} = json.data
    saveToken(token, expire, remember)
    sessionResolve()
    return true

    // return this.$http.post(url, data)
    //     .then(({data}) => {
    //     })
}
export async function logout() {
    let {token} = await getToken()
    let myHeaders = new Headers()
    myHeaders.set('Authorization', `bearer ${token}`)
    myHeaders.set('Content-Type', 'application/json')
    myHeaders.set('X-Request-With', 'insight-web')
    let url = '/auth/logout'
    try {
        await fetch(url, {
            method: 'POST',
            headers: myHeaders
        })
    } catch (err) {
        // nothing
    }
    return clean('logout')
}
let refreshCounter = 0
let refreshDefer

export async function refresh(oldToken = '', remember = false) {
    if (refreshCounter === 0) {
        refreshCounter++
        refreshDefer = new Promise((resolve, reject) => {
            (async() => {
                if (!oldToken) {
                    let d = await getToken()
                    oldToken = d.token
                    remember = d.remember
                }
                let myHeaders = new Headers()
                myHeaders.set('Authorization', `bearer ${oldToken}`)
                myHeaders.set('Content-Type', 'application/json')
                myHeaders.set('X-Request-With', 'insight-web')
                let url = '/auth/refresh'
                let response = await fetch(url, {
                    method: 'POST',
                    headers: myHeaders,
                    body: JSON.stringify({app: APP})
                })
                let json = await response.json()
                let {token, expire_in: expire} = json.data
                saveToken(token, expire, remember)
                sessionResolve()
                return await Promise.resolve(token)
            })()
                .then((token: string) => {
                    refreshCounter = 0
                    resolve(token)
                })
                .catch(() => {
                    refreshCounter = 0
                    clean('refresh')
                    reject(ERR_REFRESH_FAILED)
                })
        })
    }
    return refreshDefer
}

export async function check() {
    let data: string = localStorage.getItem(storeKeyName) || ''
    if (!data) {
        clean('check')
        return await Promise.reject(ERR_NO_SESSION)
    }
    let {token, expire, remember} = JSON.parse(LZString.decompressFromUTF16(data))
    if (expire < Date.now()) {
        return await refresh(token, remember)
    }
    return await Promise.resolve(token)
}

export async function checkInfo() {
    let token = await check()
    let myHeaders = new Headers()
    myHeaders.set('Authorization', `bearer ${token}`)
    myHeaders.set('Content-Type', 'application/json')
    myHeaders.set('X-Request-With', 'insight-web')
    let url = '/api/user/info'
    let response = await fetch(url, {
        method: 'GET',
        headers: myHeaders
    })
    let json = await response.json()
    if (json.meta.errCode !== 0) {
        await Promise.reject(json)
        return
    }
    let {id, email, developer, pages, exportLimit} = camelize(json.data)
    lastId = id
    sessionResolve()
    return await Promise.resolve({
        id, email, developer, pages, exportLimit
    })
}

/**
 * this api ignore token expire
 * @returns {any}
 */
export async function getToken() {
    let data: string = localStorage.getItem(storeKeyName) || ''
    if (!data) {
        clean('getToken')
        await Promise.reject(ERR_NO_SESSION)
        return
    }
    let {token, remember} = JSON.parse(LZString.decompressFromUTF16(data))
    return await Promise.resolve({token, remember})
}

export function clean(id = '') {
    if (localStorage.getItem(storeKeyName)) {
        localStorage.removeItem(storeKeyName)
    }
    refreshDefer = null
    refreshCounter = 0
    sessionPromise = new Promise(resolve => {
        sessionResolve = resolve
    })
}

export function saveToken(token, expire, remember: boolean = false) {
    if (!remember) {
        window.addEventListener('unload', sessionClean)
    } else {
        window.removeEventListener('unload', sessionClean)
    }
    expire = Date.now() + expire * 1000
    let data = LZString.compressToUTF16(JSON.stringify({token, expire, remember}))

    localStorage.setItem(storeKeyName, data)
}
export function id() {
    return lastId
}

function sessionClean() {
    clean('unload')
}


// 当页面在后台时, 不刷新页面, 直到页面重新激活 且 用户身份变化
interface IHiddenDocument extends Document {
    mozHidden?: boolean
    msHidden?: boolean
    webkitHidden?: boolean
}
let hidden, visibilityChange;
let doc = <IHiddenDocument>document
if (typeof doc.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
    hidden = 'hidden';
    visibilityChange = 'visibilitychange';
} else if (typeof doc.mozHidden !== 'undefined') {
    hidden = 'mozHidden';
    visibilityChange = 'mozvisibilitychange';
} else if (typeof doc.msHidden !== 'undefined') {
    hidden = 'msHidden';
    visibilityChange = 'msvisibilitychange';
} else if (typeof doc.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden';
    visibilityChange = 'webkitvisibilitychange';
}

// 用户身份变化标记, 当 storageEvent 触发时修改
let userSessionHasChanged = false
// // If the page is hidden, 啥都不做
// // if the page is shown, 先移除 unload 事件, 再刷新页面
function handleVisibilityChange() {
    if (doc[hidden]) {

    } else {
        if (userSessionHasChanged) {
            userSessionHasChanged = false
            // 当用户未勾选记住我时, unload 会删除当前的 session, 所以 刷新之前先 删除 unload
            window.removeEventListener('unload', sessionClean)
            window.location.reload(true)
        }
    }
}

// Warn if the browser doesn't support addEventListener or the Page Visibility API
if (typeof doc.addEventListener === 'undefined' || typeof doc[hidden] === 'undefined') {
    // 暂时不用考虑不支持的浏览器
} else {
    // Handle page visibility change
    doc.addEventListener(visibilityChange, handleVisibilityChange, false);
}
// 当打开多个标签并切换用户, 或刷新 token 时, 设置标记位为 true
window.addEventListener('storage', ev => {
    if (ev.key === storeKeyName) {
        userSessionHasChanged = true
    }
})
