const roleHauler = {
  run: function (creep) {
    const wasDelivering = creep.memory.delivering;
    // Ensure the creep has a valid state
    if (creep.store.getFreeCapacity() > 0 && !creep.memory.delivering) {
      this.collectEnergy(creep);
    } else if (creep.store.getUsedCapacity() === 0) {
      this.collectEnergy(creep);
      creep.memory.delivering = false; // Reset state to collecting
    } else {
      creep.memory.delivering = true;
      this.deliverEnergy(creep);
    }

    if (wasDelivering !== creep.memory.delivering && creep.memory.delivering) {
      creep.say('🚚 deliver');
    } else if (wasDelivering !== creep.memory.delivering && !creep.memory.delivering) {
      creep.say('🔄 collect');
    }
  },

  collectEnergy: function (creep) {
    const source = Game.getObjectById(creep.memory.sourceId);
    if (!source) {
      console.log(`Source not found for ID: ${creep.memory.sourceId}`);
      // Handle reassignment or error
      return;
    }

    // New logic to check for and collect dropped energy within 3 tiles of the creep's position
    const nearbyDroppedEnergy = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
      filter: (r) => r.resourceType === RESOURCE_ENERGY
    });

    if (nearbyDroppedEnergy.length > 0) {
      if (creep.pickup(nearbyDroppedEnergy[0]) === ERR_NOT_IN_RANGE) {
        creep.moveTo(nearbyDroppedEnergy[0], { visualizePathStyle: { stroke: '#ffaa00' } });
      }
    } else {

      // Find closest dropped energy near the assigned source
      const droppedEnergy = source.pos.findInRange(FIND_DROPPED_RESOURCES, 10, {
        filter: (r) => r.resourceType === RESOURCE_ENERGY
      });

      if (droppedEnergy.length > 0) {
        if (creep.pickup(droppedEnergy[0]) === ERR_NOT_IN_RANGE) {
          creep.moveTo(droppedEnergy[0], { visualizePathStyle: { stroke: '#0af' } });
        }
      } else {
        // Consider waiting or moving to a default position near the source
      }
    }
  },
  deliverEnergy: function (creep) {
    // Find the NEAREST container with available capacity
    const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });

    // Filter by containers first, then towers, then storage
    const tower = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => s.structureType === STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });

    // find storage
    const storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });

    if (container) {
      if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(container, { visualizePathStyle: { stroke: '#0af' } });
      }
    } else {
      if (tower) {
        if (creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(tower, { visualizePathStyle: { stroke: '#0af' } });
        }
      } else {
        if (storage) {
          if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(storage, { visualizePathStyle: { stroke: '#0af' } });
          }
        } else {
          // If no storage, tower or container is, drop at the nearest spawn or extension that has room
          const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          });
          if (target) {
            if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
              creep.moveTo(target, { visualizePathStyle: { stroke: '#0af' } });
            }
          } else {
            console.log(`${creep.name} can't find a valid drop-off point.`);
            // Handle case where no valid container is found - could involve waiting or seeking alternative actions
          }
        }
      }
    }
  }
};

module.exports = roleHauler;
