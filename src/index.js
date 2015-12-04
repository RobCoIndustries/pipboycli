#!/usr/bin/env node

import blessed from 'blessed';

import {
  connection,
  decoding,
  status,
  constants
} from 'pipboylib';

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

const launchCli = function launchCli(subject) {
  connected(subject)
    .then(handshake => {
      /**
       * Rendering the screen.
       */
      const screen = blessed.screen({
        autoPadding: true,
        smartCSR: true,
        title: 'PipBoy'
      });

      const hpMeter = blessed.progressbar({
        label: 'HP',
        top: "60%",
        left: "60%",
        width: "40%",
        height: "10%",
        border: {
            type: 'line'
        },
        style: {
          border: {
            fg: 'green'
          },
          bar: {
            bg: 'green'
          }
        }
      });
      screen.append(hpMeter);

      screen.key(['escape', 'q', 'C-c'], function(ch, key) {
        return process.exit(0);
      });


      const database = subject
        .filter(x => x.type === channels.DatabaseUpdate)
        .map(x => parseBinaryDatabase(x.payload))
        .scan(aggregateBundles, {})
        .map(x => generateTreeFromDatabase(x))

      const playerInfo = database
        .map(x => x.PlayerInfo)

      playerInfo.map(p => p.PlayerName)
        .distinctUntilChanged()
        .subscribe(name => {
          screen.title = 'PipBoy - ' + name;
        })

      playerInfo
        .map(x => { return { CurrHP: x.CurrHP, MaxHP: x.MaxHP }; })
        .distinctUntilChanged()
        .subscribe(p => {
          var percent = 0;
          if (p.MaxHP > 0) {
            percent = p.CurrHP / p.MaxHP;
          }
          hpMeter.label = `HP - ${p.CurrHP}`;
          hpMeter.filled = percent * 100;
          screen.render();
        })
    })
    .catch(err => {
      console.error('Couldn\'t establish connection!', err);
      console.error(err.stack);
      throw err;
    })
}



discover()
  .then(server => createSocket(server.info.address))
  .then(socket => {
    sendPeriodicHeartbeat(socket)
    return createConnectionSubject(socket)
  })
  .then(launchCli)
  .catch(err => {
    throw err
  })
