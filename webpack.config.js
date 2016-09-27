'use strict'

let webpack = require('webpack');
// 自动补全css前缀
let autoprefixer = require('autoprefixer');
// 打包时自动生成html文件的插件
let HtmlWebpackPlugin = require('html-webpack-plugin');
// 提取出css的插件
let ExtractTextPlugin = require('extract-text-webpack-plugin');
// postcss 用到的东西
let precss = require('precss')

// 判断当前的环境
// TODO 不太明白
let ENV = process.env.npm_lifecycle_event;
// 对应单元测试的时候
let isTest = ENV === 'test' || ENV === 'test-watch';
// build 和 release 分别对应 shrek 和 线上环境
let isProd = ENV === 'build' || ENV === 'release';

let modulesDirectories = process.env.NODE_DOCKER_MODULES ? [process.env.NODE_DOCKER_MODULES] : ['node_modules', 'other_modules']

module.exports = function makeWebpackConfig() {

    // 配置对象
    let config = {};

    // resolve
    config.resolve = {
        modulesDirectories: modulesDirectories,
        alias: {},
        extensions: ['', '.js']
    }

    // entry
    config.entry = isTest ? {} : {
        app: './src/app.ts',
        vendor: [
            'babel-polyfill/dist/polyfill',
            'redux',
            // 用来处理异步action的中间件，http://www.tuicool.com/articles/u6JRjyz
            'redux-thunk',
            'angular',
            // 'angular-sanitize',      // 用于使用 ng-bind-html 来绑定html，相当于jq里的text（）和html（）
            'angular-ui-router',     // 路由模块
            'angular-ui-bootstrap',  // ui组件模块
            'angular-animate',       // 动画模块
            // 'angular-translate',     // 国际化模块
            'ng-redux',
            'redux-ui-router',
/*            'moment',               // 格式化时间的模块
            'object-hash',          // 生成 hash 值的模块
            'numeral',              // 用来格式化数字，比如将 10000 变为 10,000
            'echarts',
            'echarts-maps/china',
            'echarts-maps/world',
            'jjv',  // json validate, https://github.com/acornejo/jjv
            'lz-string',  // 搞缓存的，没太看明白咋用，http://pieroxy.net/blog/pages/lz-string/index.html
            'clone', // 深度复制对象
            'level-js'*/
        ]
    }

    /**
     *  Output
     * */
    config.output = isTest ? {} : {
        path: __dirname + '/dist',
        publicPath: isProd ? '/' : '/',
        filename: isProd ? '[name].[hash].js' : '[name].bundle.js',
        chunkFilename: isProd ? '[name].[hash].js' : '[name].bundle.js'
    }

    /**
     * Devtool
     * */
    if (isTest) {
        config.devtool = 'inline-source-map';
    } else if (isProd) {
        // config.devtool = 'source-map';
    } else {
        config.devtool = 'eval'
    }

    // Initialize module
    config.module = {
        preLoaders: [],
        loaders: [{
            // 加载 ts 文件
            test: /\.tsx?$/,
            loaders: [
                'ng-annotate',
                'awesome-typescript-loader'
            ],
            exclude: [/node_modules/]
        }, {
            // 加载 js 文件
            test: /\.js$/,
            loaders: [
                'ng-annotate',
                'babel?presets[]=es2015&plugins[]=transform-async-to-generator'
            ],
            exclude: [/node_modules/, /other_modules/]
        }, {
            // 加载 css 文件
            test: /\.css$/,
            loader: isTest ? 'null' : ExtractTextPlugin.extract('style', 'css!postcss')
        }, {
            // 加载 scss 文件
            test: /\.scss$/,
            loader: isTest ? 'null' : ExtractTextPlugin.extract('style', 'css?modules!postcss?parser=postcss-scss')
        }, {
            // 加载字体文件
            test: /\.(ico|woff|woff2|ttf|eot)(\?.+)?$/,
            loader: 'file'
        }, {
            // 加载图片
            test: /\.(png|jpg|jpeg|gif|svg)(\?.+)?$/,
            loader: isProd ? 'file!image-webpack?{progressive:true, optimizationLevel: 7, interlaced: false, pngquant:{quality: "65-90", speed: 4}}' : 'file'
        }, {
            // 加载 html 文件
            test: /\.html$/,
            loader: 'html-attr-scope-loader'
        }, {
            // 加载 yaml 文件
            test: /\.yaml$/,
            loaders: [
                'json',
                'yaml'
            ]
        }]
    };

    // module noParse
    config.module.noParse = [
        /babel-polyfill\Wdist\Wpolyfill/,
        // /echarts\Wdist\Wecharts/,
        // /moment-with-locales/,
        /angular\Wangular/,
        // /angular-sanitize\Wangular-sanitize/,
        /angular-ui-router\Wrelease\Wangular-ui-router/,
        /angular-ui-bootstrap\Wdist\Wui-bootstrap-tpls/,
        /angular-animate\Wangular-animate/,
        // /numeral\Wnumeral/
    ];

    /**
     * PostCSS
     * */
    config.postcss = [
        precss({
            import: {
                extension: 'scss'
            }
        }),
        autoprefixer({
            browsers: ['last 2 version', '> 5%']
        })
    ];

    /**
     * Plugin
     * */
    config.plugins = []

    if (!isTest) {
        config.plugins.push(
            new ExtractTextPlugin('[name].[hash].css', {disable: !isProd}),

            // 打包时动态生成html文件
            new HtmlWebpackPlugin({
                // 模版html文件的路径
                template: './src/index.html',
                // script和link标签插入的位置
                inject: 'body',
                favicon: './src/favicon.ico'
            })
        )
    }

    if (isProd) {
        config.plugins.push(
            // 允许错误不打断程序
            new webpack.NoErrorsPlugin(),

            // 貌似是对依赖去重的，https://zhuanlan.zhihu.com/p/20914387?refer=jscss
            new webpack.optimize.DedupePlugin(),

            // 压缩的插件
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    drop_debugger: true,
                    warnings: false,
                    dead_code: true,
                    unused: true,
                    // drop_console: true,
                    global_defs: {
                        DEBUG: !isProd
                    }
                },
                comments: false,
                sourceMap: false
            }),

            new webpack.DefinePlugin({
                'process.env.NODE_ENV': '"production"'
            })
        )
    } else {
        config.plugins.push(
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': '"development"',
                DEBUG: !isProd
            })
        )
    }

    config.plugins.push(
        ///* chunkName = */"vendor", /* filename */"vendor.bundle.js"
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            // minChunks: 3
            // name: 'vendor',
            // filename: 'vendor.js'
            minChunks: Infinity
        })
    )

    /**
     * Dev server configuration
     * */
    config.devServer = {
        contentBase: './public',
        stats: {
            modules: false,
            cached: false,
            colors: true,
            chunk: false
        },
        porxy: {
            // '/api/*': {
            //     target: 'http://shrek.avlyun.org',
            //     secure: false
            // }
        },
        host: '0.0.0.0',
        port: 8080
    };

    return config
}();


















