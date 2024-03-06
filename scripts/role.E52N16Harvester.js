const jobs = require('./jobs');
const E52N16Harvester = {

  /** @param {Creep} creep **/
  run: function (creep) {

    // Check if creep is bringing energy back to home room or harvesting
    if (creep.memory.harvesting && creep.store.getFreeCapacity() === 0) {
      creep.memory.harvesting = false;
    }
    if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.harvesting = true;
    }

    if (creep.memory.harvesting) {
      // If in target room, harvest from source
      if (creep.room.name === 'E52N16') {
        const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
          //console.log(`[${creep.name}] is in room ${creep.room.name} and moving to source`);
          jobs.collect(creep);
        }
      } else {
        // Move to target room
        const exit = creep.room.findExitTo('E52N16');
        creep.moveTo(creep.pos.findClosestByRange(exit), { visualizePathStyle: { stroke: '#ffaa00' } });
        //console.log(`[${creep.name}] is in room ${creep.room.name} and moving to target room`);
      }
    } else {
      // Return to home room to offload energy
      if (creep.room.name === 'E51N16') {
        const storage = creep.room.storage;
        if (storage && creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          //console.log(`[${creep.name}] is in room ${creep.room.name} and moving to storage`);
          creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
        }
      } else {
        // Move to home room
        const exit = creep.room.findExitTo('E51N16');
        //console.log(`[${creep.name}] is in room ${creep.room.name} and moving to home room`);
        creep.moveTo(creep.pos.findClosestByRange(exit), { visualizePathStyle: { stroke: '#ffffff' } });
      }
    }
  }
};

module.exports = E52N16Harvester;
