(function () {
    'use strict';
    var webpack = require("webpack"),
        config = {
            entry: './src',               // entry point
            output: {                     // output folder
                path: './dist',           // folder path
                filename: 'check-it-for-me.js'     // file name
            },
            plugins: [
                new webpack.optimize.UglifyJsPlugin({
                    compress: {
                        warnings: false
                    }
                }),
                new webpack.BannerPlugin(
                    [
                        '// ==UserScript==',
                        '// @name         CheckItForMe',
                        '// @version      0.48',
                        '// @match        https://scrap.tf/raffles',
                        '// @require      https://code.jquery.com/jquery-2.2.4.min.js#sha256=BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44',
                        '// @updateURL    https://raw.githubusercontent.com/GuilloOme/CheckThisForMe/master/checkItForMe.js',
                        '// @grant        none',
                        '// ==/UserScript=='
                    ].join('\n'),
                    {raw: true, entryOnly: true})

            ]
        };
    module.exports = config;

})();
