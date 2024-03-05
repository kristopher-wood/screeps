const jobs = require('jobs');
const E51N15 = require('E51N15Handler');
const E51N16 = require('E51N16Handler');

/**
 const statuses = {
 idle: '💤 idle',
 charging: '⚡ charging',
 building: '🚧 building',
 upgrading: '⬆ upgrading',
 repairing: '🔧 repairing',
 hauling: '🚚 hauling'
 };
 */

/**
 * purgeMemory - removes no-longer-used memory entries
 * @returns {void}
 */
function purgeMemory() {
  // tidy up dead creeps
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }
}

const roomStrategies = {
  E51N15: function (room) {
    // Track room energy
    const currentEnergy = room.energyAvailable;
    const energyCapacity = room.energyCapacityAvailable;
    //console.log(`Room Energy: ${currentEnergy} / ${energyCapacity}`);
    //console.log(`Total Creeps: ${_.size(Game.creeps)}`);

    const towers = _.filter(Game.structures, s => s.structureType === STRUCTURE_TOWER);

    towers.forEach(tower => {
      // Find the closest hostile unit
      const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if (closestHostile) {
        // Attack the closest hostile unit
        tower.attack(closestHostile);
        // Check if energy is over 500 and if so, find the most damaged structure and repair
      } else if (tower.store.getUsedCapacity(RESOURCE_ENERGY) > 850) {
        // If no hostiles and energy is over 50%, find the most damaged structure and repair except for roads filter by structure.hits <= 200000
        const targets = tower.room.find(FIND_STRUCTURES, {
          filter: (structure) => structure.hits < structure.hitsMax
            && structure.hits <= 150000
            && structure.structureType !== STRUCTURE_ROAD
            && structure.structureType !== STRUCTURE_WALL
        });//structure.structureType === STRUCTURE_RAMPART &&

        if (targets.length > 0) {
          // Sort the ramparts by hits in ascending order to find the most damaged one
          targets.sort((a, b) => a.hits - b.hits);
          // Repair the most damaged target
          tower.repair(targets[0]);
        }
      }
    });

    // Cleanup inactive creeps
    purgeMemory();

    // Controller for creeps
    E51N15.run();
    _.forEach(Game.creeps, (creep) => {
      if (creep.memory.role === 'universalWorker' && creep.memory.assignedRoom === room.name) {
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) < 50 || creep.memory.nursing) {
          creep.memory.nursing = true;
          jobs.collect(creep);
        } else {
          const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
          if (constructionSites.length > 0) {
            jobs.build(creep);
          } else {
            // if there are extensions, spawns, that need energy, fill them
            const nourishTargets = creep.room.find(FIND_MY_STRUCTURES, {
              filter: (structure) => {
                return (structure.structureType === STRUCTURE_SPAWN
                    || structure.structureType === STRUCTURE_EXTENSION)
                  && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
              }
            });
            if (nourishTargets.length > 0) {
              jobs.nourish(creep);
            } else {
              // If there are towers that need energy, fill them
              const towers = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                  return structure.structureType === STRUCTURE_TOWER
                    && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
              });
              if (towers.length > 0) {
                jobs.refillTowers(creep);
              } else {
                  jobs.upgrade(creep);
              }
            }
          }
        }

        if (creep.store.getFreeCapacity() === 0 && creep.memory.nursing) {
          creep.memory.nursing = false;
        }
      }
    });

  },
  E51N16: function (room) {
    E51N16.handleRoom(room);
  }
};

const inspectE51N16 = function () {
  const room = Game.rooms['E51N16'];
  if (!room) return;

  //console.log(`Room Level: ${room.controller.level}`);
  //console.log(`Room ${room.name} data: ${JSON.stringify(room)}.`);
  // Room E51N16 data: {"name":"E51N16","energyAvailable":550,"energyCapacityAvailable":800,"visual":{"roomName":"E51N16"}}.

  const sources = room.find(FIND_SOURCES);
  //console.log(`Room ${room.name} sources: ${JSON.stringify(sources)}.`);
  //Room E51N16 sources: [{"room":{"name":"E51N16","energyAvailable":550,"energyCapacityAvailable":800,"visual":{"roomName":"E51N16"}},"pos":{"x":18,"y":43,"roomName":"E51N16"},"id":"5bbcb0109099fc012e63b89b","energy":3000,"energyCapacity":3000}].

  // Structures Inspection
  const structures = room.find(FIND_STRUCTURES);
  const summary = structures.reduce((acc, struct) => {
    const type = struct.structureType;
    if (!acc[type]) acc[type] = {count: 0, totalHits: 0, totalHitsMax: 0, energy: 0, energyCapacity: 0};

    acc[type].count++;
    acc[type].totalHits += struct.hits || 0;
    acc[type].totalHitsMax += struct.hitsMax || 0;

    if (struct.store) {
      acc[type].energy += struct.store[RESOURCE_ENERGY] || 0;
      acc[type].energyCapacity += struct.store.getCapacity(RESOURCE_ENERGY) || 0;
    } else if (struct.energyCapacity) {
      acc[type].energy += struct.energy || 0;
      acc[type].energyCapacity += struct.energyCapacity;
    }
    return acc;
  }, {});

  // Log the summary
  //console.log(`Structures in E51N16:`);
  //Object.entries(summary).forEach(([type, data]) => {
  //  console.log(`${type.toUpperCase()}: Count = ${data.count}, Health = ${data.totalHits}/${data.totalHitsMax}, Energy = ${data.energy}/${data.energyCapacity}`);
  //});
};

module.exports.loop = function () {
  // Purge memory of dead creeps not in game anymore
  purgeMemory();

  // Loop through each room controlled by your creeps
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (room && room.controller && room.controller.my) {
      // Check if we have a strategy defined for the room
      if (roomStrategies[roomName]) {
        roomStrategies[roomName](room);
      } else {
        // Optional: Implement a default room logic or log a warning
        //console.log(`No specific strategy defined for room ${roomName}. Implementing default strategy or skipping.`);
      }
    }
  }

  inspectE51N16();
  /**
   * [10:22:11 PM][shard3]Structures in E51N16:
   * [10:22:11 PM][shard3]CONSTRUCTEDWALL: Count = 58, Health = 12825538/17400000000, Energy = 0/0
   * [10:22:11 PM][shard3]ROAD: Count = 20, Health = 118400/120000, Energy = 0/0
   * [10:22:11 PM][shard3]CONTROLLER: Count = 1, Health = 0/0, Energy = 0/0
   * [10:22:11 PM][shard3]SPAWN: Count = 1, Health = 5000/5000, Energy = 300/300
   * [10:22:11 PM][shard3]EXTENSION: Count = 10, Health = 10000/10000, Energy = 250/500
   * [10:22:11 PM][shard3]TOWER: Count = 1, Health = 3000/3000, Energy = 350/1000
   */

  // Other global logic can be placed outside the room loop
  // For example, managing market orders, global alerts, etc.
};
