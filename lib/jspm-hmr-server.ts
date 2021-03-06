/*
 *   Copyright 2016 Piotr Witek <piotrek.witek@gmail.com> (http://piotrwitek.github.io)
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */
'use strict';
// TODO: switch to core http module
const path = require('path');
const httpServer = require('http-server');
const chokidar = require('chokidar-socket-emitter');
const openerCommand = require('opener');
const packageVersion = require('../package.json').version;
const nodeEnv = process.env.NODE_ENV;

export function start(options: {
  path: string,
  key: string,
  cert: string,
  ssl: boolean,
  port: number,
  cache: number,
  open: boolean,
  openCommand?: string,
  proxy?: string,
}) {

  // init
  const hotReload = true;
  const key = options.key || 'key.pem';
  const cert = options.cert || 'cert.pem';
  const ssl = options.ssl || false;
  const protocol = ssl ? 'https' : 'http';
  const host = 'localhost';
  const port = options.port || 8888;
  const url = protocol + '://' + host + ':' + port;

  const open = options.open || false;
  const command = options.openCommand || null;

  const wwwRoot = options.path || '.';
  const cache = options.cache || -1;
  const proxy = options.proxy || undefined;
  const server = createServer(wwwRoot, cache, proxy, ssl, key, cert);

  logOptionsInfo(packageVersion, nodeEnv, cache);

  // inject hmr & start server
  if (hotReload) {
    injectChokidarSocketEmitter(server);
  }
  server.listen(port);

  logStartedInfo(wwwRoot, url);

  // open browser
  if (open) {
    openerCommand(url, {
      command: command
    });
  }

  return server;
}

function createServer(path: string, cache: number, proxy: string, ssl?: boolean, key?: string, cert?: string) {
  let options: any = {
    root: path,
    cache: cache,
    robots: true,
    proxy: proxy,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true'
    }
  };
  if (ssl && key && cert) {
    options.https = {
      key: key,
      cert: cert
    };
  }
  return httpServer.createServer(options);
}

function injectChokidarSocketEmitter(server: any) {
  chokidar({
    app: server.server
  });
}

// log helpers
// TODO: add proxy info
function logOptionsInfo(version: string, nodeEnv: string, cache: number) {
  const environmentText = (nodeEnv === 'production' ? 'production ' : 'development');
  const cacheText = (cache ? 'enabled ' : 'disabled');

  console.log('\n' +
    '  ###################################' + '\n' +
    '  #  JSPM Hot-Module-Reload v' + packageVersion + '  #' + '\n' +
    '  #----------------+----------------#' + '\n' +
    '  # environment    | ' + environmentText + '    #' + '\n' +
    '  # cache          | ' + cacheText + '       #' + '\n' +
    '  ###################################' + '\n'
  );
}

function logStartedInfo(wwwRoot: string, url: string) {
  console.log(`wwwroot at ${path.resolve(wwwRoot)}`);
  console.log(`server running at ${url}`);
  console.log('\n>>> hit CTRL-C twice to exit <<<\n');
}
