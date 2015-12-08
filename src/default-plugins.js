import blessed from 'blessed';

// Plugin format takes a pipboycli, appends itself to screen
var hpMeter = function hpMeter(pipboycli){
  const hpBar = blessed.progressbar({
    label: 'HP',
    top: "95%",
    left: "0%",
    width: "100%",
    height: "7%",
    mouse: false,
    keys: false,
    border: {
        type: 'none'
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

  pipboycli.database.map(db => db.PlayerInfo)
    .map(p => {
      var percent = 0;
      if (p.MaxHP > 0) {
        percent = p.CurrHP / p.MaxHP;
      }
      return { CurrHP: p.CurrHP, MaxHP: p.MaxHP,  filled: Math.round(percent*100) };
    })
    .distinctUntilChanged()
    .subscribe(p => {
      hpBar.label = `HP - ${p.CurrHP}`;
      hpBar.filled = p.filled;
      pipboycli.screen.render();
    })

  pipboycli.log("HP Meter setup!")
  pipboycli.screen.append(hpBar);
  return hpBar;
}

var xpMeter = function xpMeter(pipboycli) {
  const xpBar = blessed.progressbar({
    label: 'XP',
    top: "90%",
    left: "0%",
    width: "100%",
    height: "7%",
    mouse: false,
    keys: false,
    border: {
        type: 'none'
    },
    style: {
      border: {
        fg: 'gray'
      },
      bar: {
        bg: 'gray'
      }
    }
  });

  pipboycli.database.map(db => {
      return {
        xpPct: Math.round(db.PlayerInfo.XPProgressPct*100),
        level: db.PlayerInfo.XPLevel
      }
    })
    .distinctUntilChanged()
    .subscribe(p => {
      xpBar.filled = p.xpPct
      xpBar.label = `Level ${p.level}`
      pipboycli.screen.render();
    })

  pipboycli.log("XP Meter setup!")
  pipboycli.screen.append(xpBar);
  return xpBar;
}

var radio = function radio(pbc) {
  const radioList = blessed.list({
    label: 'Radio',
    left: "50%",
    width: "50%",
    height: "30%",
    border: {
        type: 'line'
    },
    style: {
      border: {
        fg: 'gray'
      }
    }
  });

  var textify = function (station) {
    let active = 	station.active ? '■' : ' ';
    return [active, station.text].join(' ');
  }

  pbc.database
    .map(db => db.Radio)
    .distinctUntilChanged()
    .subscribe(stations => {
      pbc.log(stations);
      let stationSelections = stations.map(textify);
      radioList.setItems(stationSelections);
      radioList.select(0);
      pbc.screen.render();
    })
  pbc.screen.append(radioList);
}

var meh = function meh(pbc) {
  pbc.database
    .map(db => {
      return Object.keys(db)
    }).distinctUntilChanged()
    .subscribe(a => {
      pbc.log(a);
    })
}

module.exports = [
  hpMeter,
  xpMeter,
  radio,
  meh
]
