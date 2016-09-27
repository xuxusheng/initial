import 'angular'
// import 'angular-sanitize' // 用于支持 ng-bind-html
import 'angular-ui-router'
import 'angular-ui-bootstrap'
import 'angular-animate'
import ngRedux from 'ng-redux'
import ngReduxRouter from 'redux-ui-router'

require('bootstrap/dist/css/bootstrap.css')
require('font-awesome/css/font-awesome.css')
// import 'angular-translate' // 用于国际化

export default angular.module('app', [
    'ngAnimate',
    'ui.router',
    'ui.bootstrap',
    // 'ngSanitize',
    ngRedux,
    ngReduxRouter
])