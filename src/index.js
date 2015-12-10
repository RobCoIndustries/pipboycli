#!/usr/bin/env node

import path from 'path';
import blessed from 'blessed';

import plugins from './default-plugins';

import * as pipboylib from 'pipboylib'
global.pb = pipboylib

const {
  connection,
  decoding,
  status,
  constants
} = pipboylib;

import {
  Observable
} from 'rx'

const {
  discover,
  createSocket,
  sendPeriodicHeartbeat,
  createConnectionSubject
} = connection

const {
  parseBinaryMap,
  parseBinaryDatabase,
  aggregateBundles,
  generateTreeFromDatabase
} = decoding

const {
  connected
} = status

const {
  channels
} = constants

class PipBoyClient {
  constructor(subject) {
    this.screen = blessed.screen({
      autoPadding: true,
      smartCSR: true,
      title: 'PipBoy'
    });

    this.screen.key(['escape', 'q', 'C-c'], function(ch, key) {
      return process.exit(0);
    });

    // Set up the logger to be used as
    //   this.log(message)
    this.logger = blessed.log( {
      fg: "white",
      label: "log",
      height: "50%",
      width: "50%",
      tags: true,
      border: {
        type: "line",
        fg: "gray"
      }
    })
    this.screen.append(this.logger);

    this.subject = subject;
    const database = subject
      .filter(x => x.type === channels.DatabaseUpdate)
      .map(x => parseBinaryDatabase(x.payload))
      .scan(aggregateBundles, {})
      .map(x => generateTreeFromDatabase(x))

    this.database = database;

    this.database.map(db => db.PlayerInfo.PlayerName)
      .distinctUntilChanged()
      .subscribe(name => {
        this.screen.title = 'PipBoy - ' + name;
      })
  }

  log(args){
    this.logger.log.apply(this.logger, arguments)
  }

  register(f) {
    // Literally, f this
    f(this);
  }
}

const launchCli = function launchCli(subject) {

  var pbc = new PipBoyClient(subject);
  for (var plugin of plugins) {
    pbc.register(plugin);
  }

  var extraPlugins = [];
  let extras = path.join(process.cwd(), "plugins.js")

  try {
    extraPlugins = require(extras)
  } catch(e) {
    pbc.log("No extra plugins loaded from ", extras)
  }

  for (var plugin of extraPlugins) {
    try {
      pbc.register(plugin);
    } catch (e) {
      pbc.log("Unable to register", plugin)
      pbc.log(e)
    }
  }
}

function main() {
  // TODO: use createDiscovery and prompt user to pick if there are multiple
  discover()
    .then(server => createSocket(server.info.address))
    .then(socket => {
      sendPeriodicHeartbeat(socket)
      return createConnectionSubject(socket)
    })
    .then(function(subject) {
      connected(subject).then(handshake => {
        return launchCli(subject);
      }).catch(err => {
        console.error('Couldn\'t establish connection!', err);
        console.error(err.stack);
        throw err;
      })
    })
    .catch(err => {
      throw err
    })
}

main()
