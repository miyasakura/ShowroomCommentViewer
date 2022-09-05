const path = require('path')

module.exports = {
    // エントリーポイントの設定
    entry: './src/packs/app.js',
    module: {
        rules: [
            {
                loader: "babel-loader",
                options: {
                    presets: [
                       "minify",
                       [
                           "@babel/preset-env",
                           {
                               modules: false
                           }
                        ]
                    ]
                },
            },
            {
                test: /\.coffee$/,
                use: ['babel-loader', 'coffee-loader']
            },
            {
                test: /\.css$/,
                use: ['css-loader']
            },
            {
                test: /\.scss$/,
                use: [
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
    ],
    // 出力の設定
    output: {
        // 出力するファイル名
        filename: 'bundle.js',
        // 出力先のパス（v2系以降は絶対パスを指定する必要がある）
        path: path.join(__dirname, 'assets/javascripts')
    }
}
