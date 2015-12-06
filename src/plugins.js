import blessed from 'blessed';

// Plugin format takes a pipboycli, appends itself to screen
var hpMeter = function hpMeter(pipboycli){
  const hpBar = blessed.progressbar({
    label: 'HP',
    top: "95%",
    left: "50%",
    width: "50%",
    height: "7%",
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

  pipboycli.hpBar = hpBar;

  pipboycli.log("HP Meter setup!")
  return hpBar;
}

module.exports = [
  hpMeter
]
