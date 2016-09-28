/**
 * Created by huangjin on 16/8/10.
 */

const template = require('./dialog.html')

type Status = 'success' | 'info' | 'error' | ''
interface ILoadingScope extends angular.IScope {
    hide: boolean
    isLoading: boolean
    text: string
    status: Status
    loadingCounter: number
}
interface IError {
    meta: {
        errCode: number
        errMsg: string
        reqId: string
    }
}
import app from '../../module/index'

class LoadingService {
    private $scope: ILoadingScope
    private lang: string
    // @ngInject
    constructor($rootScope: angular.IRootScopeService, $document: angular.IDocumentService, $compile: angular.ICompileService, private $timeout: angular.ITimeoutService, $ngRedux) {
        let $scope = <ILoadingScope>$rootScope.$new(true)

        $ngRedux.connect(state => {
            return {
                lang: state.lang
            }
        }, {})(this)

        this.$scope = $scope
        $scope.hide = true
        $scope.isLoading = false
        $scope.text = ''
        $scope.status = ''

        let bgDomEl = angular.element(template)
        let body = $document.find('body').eq(0)
        let panelEl = $compile(bgDomEl)($scope)
        body.append(panelEl)

        $scope.loadingCounter = 0
        $scope.$watch('loadingCounter', (v: number) => {
            if (0 >= v) {
                $scope.hide = true
            }
        })
    }

    showInfo(text: string = 'Processing now', status: Status = 'info', isLoading = true) {
        let $scope = this.$scope
        this.$timeout(() => {
            $scope.hide = false
            $scope.text = text
            $scope.isLoading = isLoading
            $scope.status = status
        }, 0)
    }

    startLoading(text: string = 'Processing now') {
        let $scope = this.$scope
        this.$timeout(() => {
            $scope.loadingCounter += 1
            this.showInfo(text)
        }, 0)
    }

    stopLoading(err: any = null) {
        let $scope = this.$scope
        if (!err) {
            this.$timeout(() => {
                $scope.loadingCounter -= 1
            }, 500)
            return
        }

        if (err.validation) {
            // json schema error
            this.showInfo('JSON Schema 验证失败, 请打开控制台查看详细错误', 'error', false)
            this.$timeout(() => {
                $scope.loadingCounter -= 1
            }, 5000)
            return
        }

        if (!err.meta) {
            // err is string
            this.showInfo(err, 'error', false)
            this.$timeout(() => {
                $scope.loadingCounter -= 1
            }, 5000)
            return
        }
        err = <IError>err
        this.showInfo(err.meta.errMsg, 'error', false)
        this.$timeout(() => {
            $scope.loadingCounter -= 1
        }, 5000)
        return
    }
}

app.service('loading', LoadingService)