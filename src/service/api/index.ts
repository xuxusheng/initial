/**
 * Created by huangjin on 16/4/8.
 */
import app from '../../module/index'
import Api from '../../module/api/api'
import {validator} from '../../module/api/validator'
import '../../service/loading'

class ApiProvider implements angular.IServiceProvider {
    public $get: any
    private lang
    private ins
    private store

    constructor() {
        this.store = new Map()
        this.ins = null
        this.lang = ''
        this.changeLang(navigator.language)

        this.$get = /*@ngInject*/(loading, $q) => {
            if (this.ins) {
                return this.ins
            }
            let x = new Api(this.store, this.lang, loading)
            this.ins = {
                request: (apiName, requestBody, blockUI) => {
                    let defer = $q.defer()
                    x.request(apiName, requestBody, blockUI).then(data => {
                        defer.resolve(data)
                    }).catch(err => {
                        defer.reject(err)
                    })
                    return defer.promise
                },
                clean: () => {
                    return x.clean()
                },
                changeLang: (lang) => {
                    return x.changeLang(lang)
                }
            }
            return this.ins
        }
    }

    changeLang(lang = '') {
        if (lang.indexOf('zh') > -1) {
            this.lang = 'zh-CN'
        } else {
            this.lang = 'en'
        }
        if (this.ins) {
            this.ins.changeLang(this.lang)
        }
    }

    /**
     *
     * @param apiId
     * @param apiUrl
     * @param apiMethod
     * @param withCredentials
     * @param requestSchema
     * @param responseSchema
     * @param {boolean|number} cached
     */
    register(apiId, apiUrl, apiMethod = 'GET', {withCredentials = false, requestSchema = null, responseSchema = null, cached = true} = {}) {
        if (this.store.has(apiId)) {
            throw new Error('duplicate apiId [' + apiId + ']')
        }
        let reqValidate: string|boolean = false
        if (requestSchema) {
            reqValidate = 'request-' + apiId
            validator.addSchema(<string>reqValidate, requestSchema)
        }
        let respValidate: string|boolean = false
        if (responseSchema) {
            respValidate = 'response-' + apiId
            validator.addSchema(<string>respValidate, responseSchema)
        }
        let api = {
            method: apiMethod.toUpperCase(),
            url: apiUrl,
            withCredentials,
            cached,
            reqValidate,
            respValidate
        }
        this.store.set(apiId, api)
    }
}

app.provider('api', ApiProvider)
