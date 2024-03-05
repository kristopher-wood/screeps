const roleDrone = {
  /** @param {Creep} creep **/
  run: function (creep) {
    const targetRoom = 'E52N15';
    // Check if the creep is in the target room
    if (creep.room.name !== targetRoom) {
      // Find exit to target room and move to it
      const exitDir = Game.map.findExit(creep.room, targetRoom);
      const exit = creep.pos.findClosestByRange(exitDir);
      creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffffff' } });
    } else {
      // Once in the target room, move towards the controller
      if (creep.room.controller) {
        if (creep.claimController(creep.room.controller) === ERR_NOT_IN_RANGE) {
          // Move towards the controller if not in range to claim it
          creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
        }
      } else {
        console.log('Error: No controller found in the target room.');
      }
    }
  }
};

module.exports = roleDrone;
