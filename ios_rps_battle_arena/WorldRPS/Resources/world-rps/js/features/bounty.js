import {
  BOUNTY_LEAD,
  BOUNTY_SHARE,
} from "../config/constants.js";

export function createBountyFeature({
  state,
  typeInfo,
  audio,
  countEntities,
  addEvent,
}) {
  function resetBountyState() {
    state.bounty.active = false;
    state.bounty.leader = null;
    state.bounty.lastLeader = null;
  }

  function updateBountyLeadership(now) {
    if (!state.options.bounty) {
      state.bounty.active = false;
      state.bounty.leader = null;
      return;
    }
    const counts = countEntities();
    const total = counts.reduce((sum, count) => sum + count, 0);
    if (total < 12) {
      state.bounty.active = false;
      state.bounty.leader = null;
      return;
    }
    const ranked = counts
      .map((count, type) => ({ count, type }))
      .sort((a, b) => b.count - a.count);
    const leader = ranked[0];
    const lead = leader.count - ranked[1].count;
    const shouldBounty = leader.count / total >= BOUNTY_SHARE && lead >= BOUNTY_LEAD;
    if (!shouldBounty) {
      if (state.bounty.active && now - state.roundStart > 1400) {
        addEvent("悬赏解除", "#637067");
      }
      state.bounty.active = false;
      state.bounty.leader = null;
      return;
    }
    state.bounty.active = true;
    state.bounty.leader = leader.type;
    if (state.bounty.lastLeader !== leader.type) {
      state.bounty.lastLeader = leader.type;
      addEvent(`${typeInfo[leader.type].emoji} 成为悬赏头名`, "#f0b429");
      audio.event();
    }
  }

  return {
    resetBountyState,
    updateBountyLeadership,
  };
}
