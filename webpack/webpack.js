import webpack from 'webpack';
import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory.

const webpackSettings = {
    entry: './client/index.js',
    output: {
        // Compile the source files into a bundle.
        filename: 'bundle.js',
        path: path.resolve(__dirname, '../z_dist'),
        clean: true,
    },
    // Enable webpack-dev-server to get hot refresh of the app.
    devServer: {
        static: './z_dist',
    },
    module: {
        rules: [
            {
                // Load CSS files. They can be imported into JS files.
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
                type: 'asset/resource'
            }
        ],
    },
    plugins: [
        // Generate the HTML index page based on our template.
        // This will output the same index page with the bundle we
        // created above added in a script tag.
        new HtmlWebpackPlugin({
            template: 'client/index.html',
        }),
    ],
}

if(global.env === 'dev'){
    // Set the output path to the `dev` directory
    // so we don't clobber production builds.
    webpackSettings.output.path = path.resolve(__dirname, '../z_dev');

    // Generate source maps for our code for easier debugging.
    // Not suitable for production builds. If you want source maps in
    // production, choose a different one from https://webpack.js.org/configuration/devtool
    webpackSettings.devtool = 'eval-cheap-module-source-map';

    // Ignore spurious warnings from source-map-loader
    // It can't find source maps for some Closure modules and that is expected
    webpackSettings.ignoreWarnings = [/Failed to parse source map/];
}

const compiler = webpack(webpackSettings);

if(global.env === 'build') {
    compiler.run((err, stats) => {
        if (err != null) console.log('webpack error! ', err);
        else if(stats.hasErrors() === true) console.log('fatal webpack error!!', stats.toJson().errors)
        else console.log('Built Successfully.');
    });
} else {
    // watch for changes and compile if there are any
    compiler.watch(
        {aggregateTimeout: 300},
        (err, stats) => {
            // send msg to all clients telling them to reload. Might want a more sophisticated setup later?
            if(err != null) console.log('webpack error! ', err);
            if(stats.hasErrors() === true) console.log('fatal webpack error!!', stats.toJson().errors)
            const buf = new Uint8Array(1);
            buf[0] = 2;// type 2 - reload

            for(let i = 0; i < global.clients.length; i++){
                if(global.clients[i] === undefined) continue;
                send(global.clients[i].me, buf);
            }
        }
    );
}