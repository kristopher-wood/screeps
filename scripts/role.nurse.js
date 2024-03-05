const jobs = require('./jobs');

const roleNurse = {
  run: function (creep) {
    if (typeof creep.memory.nursing === 'undefined') creep.memory.nursing = false; // Default to not nursing
    const wasNursing = creep.memory.nursing;

    // This needs to be reworked so that the nurse keeps nourishing until empty, and then collects until full. It should not collect if it has any energy left.

    if (creep.store[RESOURCE_ENERGY] < 50) {
      creep.memory.nursing = false;
    } else {
      creep.memory.nursing = true;
    }

    if (creep.memory.nursing) {
      jobs.nourish(creep);
    } else {
      jobs.collect(creep);
    }

    if (wasNursing !== creep.memory.nursing) {
      // The nursing state needs a baby bottle icon
      creep.say(creep.memory.nursing ? '🍼nurse' : '🔄collect');
    }
  }
};

module.exports = roleNurse;
