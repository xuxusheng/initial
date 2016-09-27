const html = require('./index.html')

export default {
    url: '/test',
    template: html,
    controller: class Controller {
        // @ngInject
        constructor() {
            console.log('test')
        }
    }
}