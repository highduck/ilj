import {Vec2} from "./common/Vec2";
import {assert} from "./util/common";
import {Body} from './Body';
import {TimeStep} from "./TimeStep";

/**
 * A joint edge is used to connect bodies and joints together in a joint graph
 * where each body is a node and each joint is an edge. A joint edge belongs to
 * a doubly linked list maintained in each attached body. Each joint has two
 * joint nodes, one for each attached body.
 *
 * @prop {Body} other provides quick access to the other body attached.
 * @prop {Joint} joint the joint
 * @prop {JointEdge} prev the previous joint edge in the body's joint list
 * @prop {JointEdge} next the next joint edge in the body's joint list
 */

export class JointEdge {
    other: Body | null = null;
    joint: Joint | null = null;
    prev: JointEdge | null = null;
    next: JointEdge | null = null;
}

/**
 * @typedef {Object} JointDef
 *
 * Joint definitions are used to construct joints.
 *
 * @prop userData Use this to attach application specific data to your joints.
 *       void userData;
 * @prop {boolean} collideConnected Set this flag to true if the attached bodies
 *       should collide.
 *
 * @prop {Body} bodyA The first attached body.
 * @prop {Body} bodyB The second attached body.
 */

export interface JointDef {
    bodyA: Body;
    bodyB: Body;
    collideConnected?: boolean; // false
    userData?: any; // null
}

export type JointType = string;

/**
 * The base joint class. Joints are used to constraint two bodies together in
 * various fashions. Some joints also feature limits and motors.
 *
 * @param {JointDef} def
 */
export class Joint {
    static TYPES: { [type: string]: object } = {};

    m_bodyA: Body;
    m_bodyB: Body;
    m_collideConnected: boolean;
    m_userData: any;

    m_prev: Joint | null = null;
    m_next: Joint | null = null;

    readonly m_edgeA = new JointEdge();
    readonly m_edgeB = new JointEdge();

    m_islandFlag = false;

    m_index = 0;
    m_type: JointType;

    constructor(def: JointDef, type: JointType) {
        PLANCK_ASSERT && assert(def.bodyA);
        PLANCK_ASSERT && assert(def.bodyB);
        PLANCK_ASSERT && assert(def.bodyA !== def.bodyB);

        this.m_type = type;
        this.m_bodyA = def.bodyA;
        this.m_bodyB = def.bodyB;

        this.m_collideConnected = !!def.collideConnected;
        this.m_userData = def.userData;
    }

    // static _deserialize(data, context, restore) {
    //     const clazz = Joint.TYPES[data.type];
    //     return clazz && restore(clazz, data);
    // }

    /**
     * Short-cut function to determine if either body is inactive.
     *
     * @returns {boolean}
     */
    isActive() {
        return this.m_bodyA.isActive() && this.m_bodyB.isActive();
    }

    /**
     * Get the type of the concrete joint.
     *
     * @returns JointType
     */
    getType(): JointType {
        return this.m_type;
    }

    /**
     * Get the first body attached to this joint.
     *
     * @returns Body
     */
    getBodyA(): Body {
        return this.m_bodyA;
    }

    /**
     * Get the second body attached to this joint.
     *
     * @returns Body
     */
    getBodyB(): Body {
        return this.m_bodyB;
    }

    /**
     * Get the next joint the world joint list.
     *
     * @returns Joint
     */
    getNext(): Joint | null {
        return this.m_next;
    }

    getUserData(): any {
        return this.m_userData;
    }

    setUserData(data: any) {
        this.m_userData = data;
    }

    /**
     * Get collide connected. Note: modifying the collide connect flag won't work
     * correctly because the flag is only checked when fixture AABBs begin to
     * overlap.
     *
     * @returns {boolean}
     */
    getCollideConnected(): boolean {
        return this.m_collideConnected;
    }

    /**
     * Get the anchor point on bodyA in world coordinates.
     *
     * @return {Vec2}
     */
    getAnchorA(): Vec2 {
        return Vec2.zero();
    }

    /**
     * Get the anchor point on bodyB in world coordinates.
     *
     * @return {Vec2}
     */
    getAnchorB(): Vec2 {
        return Vec2.zero();
    }

    /**
     * Get the reaction force on bodyB at the joint anchor in Newtons.
     *
     * @param {float} inv_dt
     * @return {Vec2}
     */
    getReactionForce(inv_dt: number): Vec2 {
        return Vec2.zero();
    }

    /**
     * Get the reaction torque on bodyB in N*m.
     *
     * @param {float} inv_dt
     * @return {float}
     */
    getReactionTorque(inv_dt: number): number {
        return 0;
    }

    /**
     * Shift the origin for any points stored in world coordinates.
     *
     * @param {Vec2} newOrigin
     */
    shiftOrigin(newOrigin: Vec2) {
    }

    /**
     */
    initVelocityConstraints(step: TimeStep) {
    }

    /**
     */
    solveVelocityConstraints(step: TimeStep) {
    }

    /**
     * This returns true if the position errors are within tolerance.
     */
    solvePositionConstraints(step: TimeStep): boolean {
        return true;
    }
}