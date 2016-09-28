/**
 * Created by huangjin on 16/4/8.
 */
import app from '../../module'
import Api from '../../module/api/api'
import {validator} from '../../module/api/validator'
import '../../service/loading'

class ApiProvider {
    store: any;
    ins: any;
    lang: string;
    $get: any;
    constructor() {
        this.store = new Map()
        this.ins = null
        this.lang = ''
        this.changeLang(navigator.language)


        this.$get = /*@ngInject*/(loading) => {
            if (this.ins) {
                return this.ins
            }
            this.ins = new Api(this.store, this.lang, loading)
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
        let reqValidate: any = false
        if (requestSchema) {
            reqValidate = 'request-' + apiId
            validator.addSchema(reqValidate, requestSchema)
        }
        let respValidate: any = false
        if (responseSchema) {
            respValidate = 'response-' + apiId
            validator.addSchema(respValidate, responseSchema)
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
