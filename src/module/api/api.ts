/**
 *
 * Created by huangjin on 16/4/8.
 */
import {Once} from '../once'
const clone = require('clone')
const hash = require('object-hash')
import {camelize, unCamelize} from '../camelize'
import {validator} from './validator'
import * as session from '../session'
interface ApiResponse {
    data?: any
    meta?: {
        errCode?: number
    }
}
export default class Api {

    private once = new Once('api')

    constructor(private store: Map<string, any>, private lang = 'zh-CN', private loading) {
    }

    changeLang(lang = '') {
        if (lang.indexOf('zh') > -1) {
            this.lang = 'zh-CN'
        } else {
            this.lang = 'en'
        }
    }

    /**
     * @param {string} apiName
     * @param {*} requestBody [optional]
     * @param {boolean} blockUI
     * @returns {*}
     */
    request(apiName, requestBody, blockUI = true) {
        let id = apiName + '||' + hash({requestBody, lang: this.lang})
        let apiTag = '';
        ([apiName, apiTag] = apiName.split('!') || ['', ''])
        let {method = 'GET', url, withCredentials, cached, reqValidate, respValidate} = this.store.get(apiName)
        if (typeof url === 'undefined') {
            return Promise.reject('api not register [' + apiName + ']')
        }
        if (reqValidate) {
            let errors
            try {
                errors = validator.validate(reqValidate, requestBody)
            } catch (err) {
                errors = err
            }
            if (errors) {
                console.warn('json validate', apiName, errors, requestBody)
                return Promise.reject(errors)
            }
        }
        if (apiTag) {
            let [path, query] = url.split('?')
            path += '?' + apiTag
            if (query) {
                url = path + '&' + query
            } else {
                url = path
            }
        }
        let headers = new Headers()
        headers.set('Accept-Language', this.lang)
        headers.set('X-Request-With', 'insight-web')
        let body
        if (typeof requestBody === 'boolean') {
            blockUI = requestBody
            requestBody = null
        }

        if (requestBody) {
            requestBody = unCamelize(requestBody)
            switch (method) {
                case 'GET':
                    url += '?' + Object.keys(requestBody).map(k => {
                            return k + '=' + requestBody[k]
                        }).join('&')
                    break
                default:
                    headers.set('Content-Type', 'application/json')
                    body = JSON.stringify(requestBody)
                    break
            }
        }


        return this.once.do(id, async() => {
            if (blockUI) {
                this.loading.startLoading()
            }
            let ret = (async() => {
                let isLogin = false
                try {
                    let token = await session.check()
                    headers.set('Authorization', `bearer ${token}`)
                    isLogin = true
                } catch (err) {
                    // nothing
                    isLogin = false
                }

                //  check login
                if (withCredentials && !isLogin) {
                    await Promise.reject(session.ERR_NO_SESSION)
                    return
                }

                let response: ApiResponse = {}
                let needRefresh = false
                let request = new Request(url, {
                    method,
                    headers,
                    body
                })
                try {
                    let resp = await fetch(request);
                    let xBuild = resp.headers.get('x-build')
                    if (xBuild) {
                        try {
                            let xBR = localStorage.getItem('x-build') || ''
                            localStorage.setItem('x-build', xBuild)
                            if (xBR && xBR !== xBuild) {
                                window.location.reload(true)
                            }
                        } catch (err) {
                            // nothing
                        }
                    }
                    let data = await resp.json()
                    response = data.data || {}
                    if (data.meta.errCode !== 0) {
                        await Promise.reject(data)
                    }
                } catch (err) {
                    let {data} = err
                    if (!data || !data.meta || data.meta.errCode !== 3000604 || !withCredentials) {
                        // 异常状态
                        log(err)
                        await Promise.reject(err)
                        return
                    }
                    needRefresh = true
                }
                if (needRefresh) {
                    // 尝试刷新 token 后再次请求
                    try {
                        let token = await session.refresh()
                        headers.set('Authorization', `bearer ${token}`)
                        let resp = await fetch(request);
                        let data = await resp.json()
                        response = data.data || {}
                    } catch (err) {
                        // 异常状态
                        log(err)
                        await Promise.reject(err)
                        return
                    }
                }

                response = camelize(response)

                if (respValidate) {
                    let errors
                    try {
                        errors = validator.validate(respValidate, response)
                    } catch (err) {
                        errors = err
                    }
                    if (errors) {
                        console.warn('json validate', apiName, errors, response)
                        await Promise.reject(errors)
                        return
                    }
                }
                return await Promise.resolve(response)
            })()

            if (blockUI) {
                ret.then(() => {
                    this.loading.stopLoading()
                }).catch(err => {
                    this.loading.stopLoading(err)
                })
            }
            return await ret
        }, cached)
    }


    clean() {
        this.once.clean()
    }

}
function log({config, data}, during = 0) {
    try {
        let t = encodeURIComponent(config.url)
        let img = new Image()
        img.src = '/log?a=request&t=' + t + '&d=' + encodeURIComponent(JSON.stringify(data.meta)) +
            '&ms=' + during +
            '&u=' + session.id()
    } catch (e) {
        // do nothing
    }
}
