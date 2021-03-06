(function (ghg, undefined) {

var Physics = function (options) {
  var that = this;

  that.eventHandlers = {};
  that.world = options.world;
  that.projectilesToRemove = [];
};

Physics.prototype = {
  update: function (t, dt) {
    var that = this;
        projectiles = that.world.projectiles,
        planets = that.world.planets;

    that.clearProjectiles();

    for (var i = projectiles.length - 1; i >= 0; i--) {
      var projectile = projectiles[i];

      var planetsForce = _(planets).chain().map(function (planet){
        return that.getForceVector(planet, projectile);
      }).reduce(function (f1, f2) {
        return {
          fx: (f1.fx + f2.fx),
          fy: (f1.fy + f2.fy)
        };
      }).value();

      projectile.fx = projectile.fx + planetsForce.fx;
      projectile.fy = projectile.fy + planetsForce.fy;
      projectile.x = projectile.x + projectile.fx / projectile.mass;
      projectile.y = projectile.y + projectile.fy / projectile.mass;

      for (var j = planets.length - 1; j >= 0; j--) {
        var planet = planets[j],
            dx = planet.x - projectile.x,
            dy = planet.y - projectile.y,
            d = Math.sqrt(dx * dx + dy * dy);

        if (d <= planet.radius) {
          that.markToRemove(projectile);
        }
      };

      var player = that.world.player;
      if (projectile.x >= player.x - 20 && projectile.x <= player.x + 20
          && projectile.y >= player.y - 20 && projectile.y <= player.y + 20) {
        that.markToRemove(projectile);
      }

      for (var k = that.world.remotePlayers.length - 1; k >= 0; k--) {
        var player = that.world.remotePlayers[k].player;
        if (projectile.x >= player.x - 20 && projectile.x <= player.x + 20
            && projectile.y >= player.y - 20 && projectile.y <= player.y + 20) {
          that.markToRemove(projectile);

          if(projectile.localPlayer) {
            that.trigger('hit-remote-player', projectile);
          }
        }
      };

    };

    that.world.player.x = that.world.player.x + -that.world.player.speed * Math.sin(that.world.player.angle);
    that.world.player.y = that.world.player.y + that.world.player.speed * Math.cos(that.world.player.angle);

    that.world.player.angle = that.world.player.angle + that.world.player.turningSpeed;
  },

  getForceVector: function(planet, projectile) {
    var dx = planet.x - projectile.x,
        dy = planet.y - projectile.y,
        d = Math.sqrt(dx * dx + dy * dy);

    var force = (1e-14 * planet.mass * projectile.mass) / (d * d);

    return { fx: force * dx / d, fy: force * dy / d };
  },

  fireProjectile: function (projectile) {
    var that = this;

    that.world.projectiles.push(projectile);

    setTimeout(function () {
      that.markToRemove(projectile);
    }, 20000);

    return projectile;
  },

  markToRemove: function(projectile) {
    var that = this;
    that.projectilesToRemove.push(projectile);
  },

  clearProjectiles: function () {
    var that = this;
    for (var i = that.projectilesToRemove.length - 1; i >= 0; i--) {
      var projectile = that.projectilesToRemove[i];
      if (that.world.projectiles.indexOf(projectile) === -1) { continue; }
      that.world.projectiles.splice(that.world.projectiles.indexOf(projectile), 1);
      that.trigger('projectile-explosion', projectile);
    };
    that.projectilesToRemove = [];
  },

  startMovingFoward: function () {
    var that = this;

    that.world.player.speed = 2;
  },

  startMovingBackward: function () {
    var that = this;

    that.world.player.speed = -3;
  },

  stopMoving: function () {
    var that = this;

    that.world.player.speed = 0;
  },

  startTurningLeft: function () {
    var that = this;

    that.world.player.turningSpeed = -0.1;
  },

  startTurningRight: function () {
    var that = this;

    that.world.player.turningSpeed = 0.1;
  },

  stopTurning: function () {
    var that = this;

    that.world.player.turningSpeed = 0;
  },

  on: function (event, callback) {
    var that = this;
    that.eventHandlers[event] = callback;
  },

  trigger: function (event, data) {
    var that = this;
    that.eventHandlers[event] && that.eventHandlers[event](data);
  },

  addRemotePlayer: function (player) {
    var that = this;
    that.world.remotePlayers.push({id : player.id, player : player});
  },

  removeRemotePlayerById: function (id) {
    var that = this,
        remotePlayers = that.world.remotePlayers;

    for (var i = remotePlayers.length - 1; i >= 0; i--) {
      if (remotePlayers[i].id === id) {
        remotePlayers.splice(i, 1);
        return;
      }
    };
  },

  updateRemotePlayerPosition: function (position) {
    var that = this,
        remotePlayers = that.world.remotePlayers;

    for (var i = remotePlayers.length - 1; i >= 0; i--) {
      if (remotePlayers[i].id === position.id) {
        var player = remotePlayers[i].player;
        player.x = position.x;
        player.y = position.y;
        player.angle = position.angle;
        return;
      }
    };
  }
};
ghg.Physics = Physics;

}(ghg));