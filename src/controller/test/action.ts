import app from '../../module/index'
import {stateGo} from 'redux-ui-router'

export const NAME = 'test'
export const PREFIX = 'CONTROLLER_TEST_'
export const DESTROY = PREFIX + 'DESTROY'
export const INITIAL = PREFIX + 'INITIAL'
export const GO_TO_MAIN = PREFIX + 'GO_TO_MAIN'
export const CHANGE = PREFIX + 'CHANGE'

interface IState {
    name: string,
    age: number,
    city: string
}

const defaultState = {
    name: 'default name',
    age: 0,
    city: 'default city'
}

export let name = NAME
export function reducer(state: IState = defaultState, action) {
    switch (action.type) {
        case DESTROY:
            return Object.assign({}, defaultState)
        case INITIAL:
            return Object.assign({}, {
                name: 'xusheng',
                age: 23,
                city: 'wuhan'
            })
        case CHANGE:
            return Object.assign({}, {
                name: action.data.name,
                age: action.data.age,
                city: action.data.city
            })
    }
}

app.factory('controllerTestActions', /*@ngInject*/(api) => {
    return {
        change,
        goToMain
    }

    function change() {
        return dispatch => {
            dispatch({
                type: CHANGE,
                data: {
                    name: 'fangling',
                    age: 25,
                    city: 'wuhan'
                }
            })
        }
    }

    function goToMain() {
        return stateGo('main')
    }
})