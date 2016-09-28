import app from '../module/index'

import main from './main/index'
import test from './test/index'

import apiList from '../api/api-list'

import {combineReducers, ReducersMapObject} from 'redux'
import {router, stateGo} from 'redux-ui-router'
const {STATE_CHANGE_ERROR} = require('redux-ui-router/lib/action-types')

const {'default': thunk} = require('redux-thunk')

interface IChromeWindows extends Window {
    chrome?: {
        runtime?: any
    }
    requestFileSystem?: any
    webkitRequestFileSystem?: any
}

app
    .config(/*@ngInject*/(apiProvider) => {

    })
    .config(/*@ngInject*/function ($stateProvider, $urlRouterProvider, $locationProvider) {

    // check chrome
    let isElectron = navigator.userAgent.toLowerCase().indexOf('avlinsightapp') > -1
    let isChrome = (<IChromeWindows>window).chrome && (<IChromeWindows>window).chrome.runtime && navigator.userAgent.indexOf('Chrome') > -1 && ((<IChromeWindows>window).requestFileSystem || (<IChromeWindows>window).webkitRequestFileSystem)

    if (!isElectron && !isChrome) {
        alert('请使用 Chrome 访问.')
    }

    $locationProvider.html5Mode({
        enabled: true
    });

    $urlRouterProvider.otherwise('/main');
    console.log('进来了没有啊')
    $stateProvider
        .state('main', main)
        .state('test', test)
}).config(/*@ngInject*/$ngReduxProvider => {
    let middleware = ['ngUiRouterMiddleware']

    if (DEBUG) {
        let createLogger = require('redux-logger')
        let logger = createLogger({
            level: 'info'
        })
        middleware.push(logger)
    }
    middleware.push(thunk)

    const reducers: ReducersMapObject = {
/*        redirect: (state, action) => {
            switch (action.type) {
                case STATE_CHANGE_ERROR :
                    if (action.payload) {
                        switch (action.payload.err) {
                            case 'not login':
                                return {
                                    action: 'login',
                                    stateName: action.payload.toState.name || ''
                                }
                        }
                    }
                    if (action.payload && action.payload.err && action.payload.err.status === 401) {
                        return {
                            action: 'login',
                            stateName: action.payload.toState.name || ''
                        }
                    }
            }
            return {
                action: '',
                stateName: ''
            }
        },*/
        router,
        // lang: langReducer,
        // session: sessionReducer,
        // [discoveryName]: discoveryReducer,
        // [aggregationName]: aggregationReducer,
        // [actionTTPDetailName]: actionTTPDetailReducer,
        // [actionDashboardName]: actionDashboardReducer,
        // [actionTagManagement.name]: actionTagManagement.reducer,
        // [login.name]: login.reducer,
        // [search.name]: search.reducer,
        // [actionFeed.name]: actionFeed.reducer,
        // [actionTTP.name]: actionTTP.reducer,
        // [actionTargetAsset.name]: actionTargetAsset.reducer,
        // [visualizeSpoofingHash.name]: visualizeSpoofingHash.reducer,
        // [visualizeSpoofingAppName.name]: visualizeSpoofingAppName.reducer,
        // [directiveUserMenu.name]: directiveUserMenu.reducer,
        // [directiveQueryNext.name]: directiveQueryNext.reducer,
        // [actionApi.name]: actionApi.reducer,
        // [myCenterChangePassword.name]: myCenterChangePassword.reducer
    }

    $ngReduxProvider.createStoreWith(combineReducers(reducers), middleware)
})