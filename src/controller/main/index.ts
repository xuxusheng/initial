const html = require('./index.html')

export default {
    url: '/main',
    template: html,
    controller: class Controller {
        // @ngInject
        constructor($scope) {
            $scope.name = '首页'
            console.log($scope.name)
            $scope.$on('$stateChangeStart', function () {
                console.log('开始跳转')
            })
        }
    }
}