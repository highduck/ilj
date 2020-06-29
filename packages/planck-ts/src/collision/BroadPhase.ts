import {AABB} from "./AABB";
import {assert} from "../util/common";
import {DynamicTree} from "./DynamicTree";
import {RayCastInput} from "./RayCastOptions";
import {Vec2} from "../common/Vec2";
import {FixtureProxy} from "../Fixture";

/**
 * The broad-phase wraps and extends a dynamic-tree to keep track of moved
 * objects and query them on update.
 */
export class BroadPhase {
    readonly m_tree = new DynamicTree();
    m_proxyCount = 0;
    m_moveBuffer: number[] = [];

    // temp stack
    m_queryProxyId = 0;
    m_callback: (proxyA: FixtureProxy, proxyB: FixtureProxy) => void = (a, v) => {
    };

    constructor() {
        this.queryCallback = this.queryCallback.bind(this);
    };

    /**
     * Get user data from a proxy. Returns null if the id is invalid.
     */
    getUserData(proxyId: number) {
        return this.m_tree.getUserData(proxyId);
    }

    /**
     * Test overlap of fat AABBs.
     */
    testOverlap(proxyIdA: number, proxyIdB: number) {
        const aabbA = this.m_tree.getFatAABB(proxyIdA);
        const aabbB = this.m_tree.getFatAABB(proxyIdB);
        return AABB.testOverlap(aabbA, aabbB);
    }

    /**
     * Get the fat AABB for a proxy.
     */
    getFatAABB(proxyId: number) {
        return this.m_tree.getFatAABB(proxyId);
    }

    /**
     * Get the number of proxies.
     */
    getProxyCount() {
        return this.m_proxyCount;
    }

    /**
     * Get the height of the embedded tree.
     */
    getTreeHeight() {
        return this.m_tree.getHeight();
    }

    /**
     * Get the balance (integer) of the embedded tree.
     */
    getTreeBalance() {
        return this.m_tree.getMaxBalance();
    }

    /**
     * Get the quality metric of the embedded tree.
     */
    getTreeQuality() {
        return this.m_tree.getAreaRatio();
    }

    /**
     * Query an AABB for overlapping proxies. The callback class is called for each
     * proxy that overlaps the supplied AABB.
     */
    query(aabb: AABB, queryCallback: (proxyId: number) => boolean) {
        this.m_tree.query(aabb, queryCallback);
    }

    /**
     * Ray-cast against the proxies in the tree. This relies on the callback to
     * perform a exact ray-cast in the case were the proxy contains a shape. The
     * callback also performs the any collision filtering. This has performance
     * roughly equal to k * log(n), where k is the number of collisions and n is the
     * number of proxies in the tree.
     *
     * @param input The ray-cast input data. The ray extends from p1 to p1 +
     *          maxFraction * (p2 - p1).
     * @param rayCastCallback A function that is called for each proxy that is hit by
     *          the ray.
     */
    rayCast(input: RayCastInput, rayCastCallback: (subInput: RayCastInput, id: number) => number) {
        this.m_tree.rayCast(input, rayCastCallback);
    }

    /**
     * Shift the world origin. Useful for large worlds. The shift formula is:
     * position -= newOrigin
     *
     * @param newOrigin The new origin with respect to the old origin
     */

    shiftOrigin(newOrigin: Vec2) {
        this.m_tree.shiftOrigin(newOrigin);
    }

    /**
     * Create a proxy with an initial AABB. Pairs are not reported until UpdatePairs
     * is called.
     */
    createProxy(aabb: AABB, userData: any) {
        PLANCK_ASSERT && assert(AABB.isValid(aabb));
        const proxyId = this.m_tree.createProxy(aabb, userData);
        this.m_proxyCount++;
        this.bufferMove(proxyId);
        return proxyId;
    }

    /**
     * Destroy a proxy. It is up to the client to remove any pairs.
     */
    destroyProxy(proxyId: number) {
        this.unbufferMove(proxyId);
        this.m_proxyCount--;
        this.m_tree.destroyProxy(proxyId);
    }

    /**
     * Call moveProxy as many times as you like, then when you are done call
     * UpdatePairs to finalized the proxy pairs (for your time step).
     */
    moveProxy(proxyId: number, aabb: AABB, displacement: Vec2) {
        PLANCK_ASSERT && assert(AABB.isValid(aabb));
        const changed = this.m_tree.moveProxy(proxyId, aabb, displacement);
        if (changed) {
            this.bufferMove(proxyId);
        }
    }

    /**
     * Call to trigger a re-processing of it's pairs on the next call to
     * UpdatePairs.
     */
    touchProxy(proxyId: number) {
        this.bufferMove(proxyId);
    }

    bufferMove(proxyId: number) {
        this.m_moveBuffer.push(proxyId);
    }

    unbufferMove(proxyId: number) {
        for (let i = 0; i < this.m_moveBuffer.length; ++i) {
            if (this.m_moveBuffer[i] === proxyId) {
                this.m_moveBuffer[i] = 0;
            }
        }
    }

    /**
     * @function BroadPhase~addPair
     * @param {Object} userDataA
     * @param {Object} userDataB
     */

    /**
     * Update the pairs. This results in pair callbacks. This can only add pairs.
     *
     * @param {BroadPhase~AddPair} addPairCallback
     */
    updatePairs(addPairCallback: (proxyA: FixtureProxy, proxyB: FixtureProxy) => void) {
        this.m_callback = addPairCallback;
        // Perform tree queries for all moving proxies.

        // while (this.m_moveBuffer.length > 0) {
        //     this.m_queryProxyId = this.m_moveBuffer.pop()!;
        //     if (!this.m_queryProxyId) {
        //         continue;
        //     }
        //
        //     // We have to query the tree with the fat AABB so that
        //     // we don't fail to create a pair that may touch later.
        //     const fatAABB = this.m_tree.getFatAABB(this.m_queryProxyId);
        //
        //     // Query tree, create pairs and add them pair buffer.
        //     this.m_tree.query(fatAABB, this.queryCallback);
        // }
        
        const tree = this.m_tree;
        const buf = this.m_moveBuffer;
        for (let i = 0; i < buf.length; ++i) {
            const queryProxyId = buf[i];
            if (queryProxyId === 0) {
                // skip unbuffered
                continue;
            }

            // We have to query the tree with the fat AABB so that
            // we don't fail to create a pair that may touch later.
            const fatAABB = tree.getFatAABB(queryProxyId);

            // Query tree, create pairs and add them pair buffer.
            this.m_queryProxyId = queryProxyId;
            tree.query(fatAABB, this.queryCallback);
        }
        buf.length = 0;


        // Try to keep the tree balanced.
        // this.m_tree.rebalance(4);
    }

    queryCallback(proxyId: number): boolean {
        const queryProxyId = this.m_queryProxyId;
        // A proxy cannot form a pair with itself.
        if (proxyId === queryProxyId) {
            return true;
        }

        const proxyIdA = Math.min(proxyId, queryProxyId);
        const proxyIdB = Math.max(proxyId, queryProxyId);

        // TODO: Skip any duplicate pairs.

        const userDataA = this.m_tree.getUserData(proxyIdA);
        const userDataB = this.m_tree.getUserData(proxyIdB);

        // Send the pairs back to the client.
        this.m_callback(userDataA, userDataB);

        return true;
    }
}
