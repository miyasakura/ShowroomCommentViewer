const path = require('path')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
    // エントリーポイントの設定
    entry: './src/packs/app.js',
    module: {
        loaders: [
            {
                test: /\.coffee$/,
                loader: 'babel-loader!coffee-loader'
            },
            {
                test: /\.css$/,
                loader: 'css-loader'
            },
            {
                test: /\.scss$/,
                loaders: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {url: false}
                    },
                    'sass-loader'
                ]
            }
        ]
    },
    plugins: [
        new UglifyJSPlugin()
    ],
    // 出力の設定
    output: {
        // 出力するファイル名
        filename: 'bundle.js',
        // 出力先のパス（v2系以降は絶対パスを指定する必要がある）
        path: path.join(__dirname, 'assets/javascripts')
    }
}
