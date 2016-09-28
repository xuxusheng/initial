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
    private translate: Function
    // @ngInject
    constructor($rootScope: angular.IRootScopeService, $document: angular.IDocumentService, $compile: angular.ICompileService, private $timeout: angular.ITimeoutService, $ngRedux, $filter) {
        this.translate = $filter('translate')
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
            this.showInfo(this.translate('err-3000202'), 'error', false)
            this.$timeout(() => {
                $scope.loadingCounter -= 1
            }, 3000)
            return
        }

        if (!err.meta) {
            // err is string
            if (this.lang === 'zh-CN') {
                this.showInfo('出错啦，请刷新后再试', 'error', false)
            } else {
                this.showInfo('We feel sorry that a problem might occur, please refresh and try again.', 'error', false)
            }
            console.warn(err)
            this.$timeout(() => {
                $scope.loadingCounter -= 1
            }, 3000)
            return
        }
        err = <IError>err
        let errMsg = this.translate('err-' + err.meta.errCode)
        let errHasShown = false
        if (errMsg !== 'err-' + err.meta.errCode) {
            errHasShown = true
            this.showInfo(errMsg, 'error', false)
            this.$timeout(() => {
                $scope.loadingCounter -= 1
            }, 3000)
        }
        switch (err.meta.errCode) {
            // case 404:
            //     this.showInfo('Your search did not return any data, please check and try again.', 'info', false)
            //     this.$timeout(() => {
            //         $scope.loadingCounter -= 1
            //     }, 2000)
            //     break
            // case 401:
            //     this.showInfo('Not logged in? Go to the login page right now!', 'error', true)
            //     this.$timeout(() => {
            //         $scope.loadingCounter -= 1
            //     }, 1000)
            //     // setTimeout(() => {
            //     //     this.$state.go('login', {
            //     //         u: this.$state.current.name
            //     //     })
            //     // }, 1500)
            //     break
            // case 403:
            //     if (this.lang === 'zh-CN') {
            //         this.showInfo('抱歉，因权限原因，无法查看', 'error', false)
            //     } else {
            //         this.showInfo('We feel sorry that you don\'t have authority', 'error', false)
            //     }
            //     this.$timeout(() => {
            //         $scope.loadingCounter -= 1
            //     }, 2000)
            //     break
            case 3000602:
            case 3000603:
                if (this.lang === 'zh-CN') {
                    this.showInfo('请先登录', 'error', false)
                } else {
                    this.showInfo('Not logged in? Go to the login page right now!', 'error', true)
                }
                this.$timeout(() => {
                    $scope.loadingCounter -= 1
                }, 1000)
                setTimeout(() => {
                    location.href = '/login'
                }, 1500)
                break
            case 3000203:
                if (this.lang === 'zh-CN') {
                    this.showInfo('所选时间跨度不能超过7天，且字段不能超过6个', 'error', false)
                } else {
                    this.showInfo('Time period limit is 7 days and fileds limit is 6.', 'error', false)
                }
                this.$timeout(() => {
                    $scope.loadingCounter -= 1
                }, 3000)
                break
            default:
                if (errHasShown) {
                    return
                }
                if (this.lang === 'zh-CN') {
                    this.showInfo('出错啦，请刷新后再试', 'error', false)
                } else {
                    this.showInfo('We feel sorry that a problem might occur, please refresh and try again.', 'error', false)
                }
                this.$timeout(() => {
                    $scope.loadingCounter -= 1
                }, 3000)
        }
    }
}

app.service('loading', LoadingService)