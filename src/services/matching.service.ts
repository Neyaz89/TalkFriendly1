/**
 * Peer matching service.
 * GET /matching/peers — returns recommended peer connections.
 */

import type { PeerMatch } from "@/mocks/matching.mock";
import { MOCK_PEER_MATCHES } from "@/mocks/matching.mock";
import { delay } from "@/lib/utils";

export const matchingService = {
  /**
   * GET /matching/peers
   * Returns peer matches based on shared interests and communities.
   */
  async getPeerMatches(): Promise<PeerMatch[]> {
    await delay(700);
    return MOCK_PEER_MATCHES;
  },
};
