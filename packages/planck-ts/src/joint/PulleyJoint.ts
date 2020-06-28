import {Joint, JointDef} from "../Joint";
import {Settings} from "../Settings";
import {Vec2} from "../common/Vec2";
import {Rot} from "../common/Rot";
import {assert} from "../util/common";
import {MathUtil} from "../common/Math";
import {TimeStep} from "../TimeStep";


/**
 * @typedef {Object} PulleyJointDef
 *
 * Pulley joint definition. This requires two ground anchors, two dynamic body
 * anchor points, and a pulley ratio.
 *
 * @prop {Vec2} groundAnchorA The first ground anchor in world coordinates.
 *          This point never moves.
 * @prop {Vec2} groundAnchorB The second ground anchor in world coordinates.
 *          This point never moves.
 * @prop {Vec2} localAnchorA The local anchor point relative to bodyA's origin.
 * @prop {Vec2} localAnchorB The local anchor point relative to bodyB's origin.
 * @prop {float} ratio The pulley ratio, used to simulate a block-and-tackle.
 * @prop {float} lengthA The reference length for the segment attached to bodyA.
 * @prop {float} lengthB The reference length for the segment attached to bodyB.
 */
export interface PulleyJointDef extends JointDef {
    collideConnected?: boolean; //true,

    groundAnchorA?: Vec2;
    groundAnchorB?: Vec2;
    groundA?: Vec2;
    groundB?: Vec2;

    localAnchorA?: Vec2;
    localAnchorB?: Vec2;
    anchorA?: Vec2;
    anchorB?: Vec2;

    ratio: number;
    lengthA?: number;
    lengthB?: number;
}


/**
 * The pulley joint is connected to two bodies and two fixed ground points. The
 * pulley supports a ratio such that: length1 + ratio * length2 <= constant
 *
 * Yes, the force transmitted is scaled by the ratio.
 *
 * Warning: the pulley joint can get a bit squirrelly by itself. They often work
 * better when combined with prismatic joints. You should also cover the the
 * anchor points with static shapes to prevent one side from going to zero
 * length.
 *
 * @param {PulleyJointDef} def
 * @param {Body} bodyA
 * @param {Body} bodyB
 */
export class PulleyJoint extends Joint {
    static readonly TYPE = 'pulley-joint';
    static readonly MIN_PULLEY_LENGTH = 2.0; // minPulleyLength

    m_groundAnchorA: Vec2;
    m_groundAnchorB: Vec2;
    m_localAnchorA: Vec2;
    m_localAnchorB: Vec2;
    m_lengthA: number;
    m_lengthB: number;
    m_ratio: number;
    m_constant: number;

    m_impulse = 0.0;

    // Solver temp
    m_uA = Vec2.zero();
    m_uB = Vec2.zero();
    m_rA = Vec2.zero();
    m_rB = Vec2.zero();
    m_localCenterA = Vec2.zero();
    m_localCenterB = Vec2.zero();
    m_invMassA = 0;
    m_invMassB = 0;
    m_invIA = 0;
    m_invIB = 0;
    m_mass = 0;

    constructor(def: PulleyJointDef) {
        //, bodyB, groundA, groundB, anchorA, anchorB, ratio
        super(def, PulleyJoint.TYPE);

        this.m_groundAnchorA = def.groundA ? def.groundA : def.groundAnchorA || new Vec2(-1, 1);
        this.m_groundAnchorB = def.groundB ? def.groundB : def.groundAnchorB || new Vec2(1, 1);
        this.m_localAnchorA = def.anchorA ? def.bodyA.getLocalPoint(def.anchorA) : def.localAnchorA || new Vec2(-1, 0);
        this.m_localAnchorB = def.anchorB ? def.bodyB.getLocalPoint(def.anchorB) : def.localAnchorB || new Vec2(1, 0);
        if (def.lengthA === undefined && (!def.anchorA || !def.groundA)) throw new Error('invalid def');
        if (def.lengthB === undefined && (!def.anchorB || !def.groundB)) throw new Error('invalid def');
        this.m_lengthA = def.lengthA !== undefined ? def.lengthA : Vec2.distance(def.anchorA!, def.groundA!);
        this.m_lengthB = def.lengthB !== undefined ? def.lengthB : Vec2.distance(def.anchorB!, def.groundB!);
        this.m_ratio = def.ratio;

        PLANCK_ASSERT && assert(def.ratio > MathUtil.EPSILON);

        this.m_constant = this.m_lengthA + this.m_ratio * this.m_lengthB;

        // Pulley:
        // length1 = norm(p1 - s1)
        // length2 = norm(p2 - s2)
        // C0 = (length1 + ratio * length2)_initial
        // C = C0 - (length1 + ratio * length2)
        // u1 = (p1 - s1) / norm(p1 - s1)
        // u2 = (p2 - s2) / norm(p2 - s2)
        // Cdot = -dot(u1, v1 + cross(w1, r1)) - ratio * dot(u2, v2 + cross(w2, r2))
        // J = -[u1 cross(r1, u1) ratio * u2 ratio * cross(r2, u2)]
        // K = J * invM * JT
        // = invMass1 + invI1 * cross(r1, u1)^2 + ratio^2 * (invMass2 + invI2 *
        // cross(r2, u2)^2)
    }


    /**
     * Get the first ground anchor.
     */
    getGroundAnchorA() {
        return this.m_groundAnchorA;
    }

    /**
     * Get the second ground anchor.
     */
    getGroundAnchorB() {
        return this.m_groundAnchorB;
    }

    /**
     * Get the current length of the segment attached to bodyA.
     */
    getLengthA() {
        return this.m_lengthA;
    }

    /**
     * Get the current length of the segment attached to bodyB.
     */
    getLengthB() {
        return this.m_lengthB;
    }

    /**
     * Get the pulley ratio.
     */
    getRatio() {
        return this.m_ratio;
    }

    /**
     * Get the current length of the segment attached to bodyA.
     */
    getCurrentLengthA() {
        const p = this.m_bodyA.getWorldPoint(this.m_localAnchorA);
        const s = this.m_groundAnchorA;
        return Vec2.distance(p, s);
    }

    /**
     * Get the current length of the segment attached to bodyB.
     */
    getCurrentLengthB() {
        const p = this.m_bodyB.getWorldPoint(this.m_localAnchorB);
        const s = this.m_groundAnchorB;
        return Vec2.distance(p, s);
    }

    shiftOrigin(newOrigin: Vec2) {
        this.m_groundAnchorA.sub(newOrigin);
        this.m_groundAnchorB.sub(newOrigin);
    }

    getAnchorA() {
        return this.m_bodyA.getWorldPoint(this.m_localAnchorA);
    }

    getAnchorB() {
        return this.m_bodyB.getWorldPoint(this.m_localAnchorB);
    }

    getReactionForce(inv_dt: number): Vec2 {
        return Vec2.mul(this.m_impulse, this.m_uB).mul(inv_dt);
    }

    getReactionTorque(inv_dt: number): number {
        return 0.0;
    }

    initVelocityConstraints(step: TimeStep) {
        this.m_localCenterA = this.m_bodyA.m_sweep.localCenter;
        this.m_localCenterB = this.m_bodyB.m_sweep.localCenter;
        this.m_invMassA = this.m_bodyA.m_invMass;
        this.m_invMassB = this.m_bodyB.m_invMass;
        this.m_invIA = this.m_bodyA.m_invI;
        this.m_invIB = this.m_bodyB.m_invI;

        const cA = this.m_bodyA.c_position.c;
        const aA = this.m_bodyA.c_position.a;
        const vA = this.m_bodyA.c_velocity.v;
        let wA = this.m_bodyA.c_velocity.w;

        const cB = this.m_bodyB.c_position.c;
        const aB = this.m_bodyB.c_position.a;
        const vB = this.m_bodyB.c_velocity.v;
        let wB = this.m_bodyB.c_velocity.w;

        const qA = Rot.forAngle(aA);
        const qB = Rot.forAngle(aB);

        this.m_rA = Rot.mulVec2(qA, Vec2.sub(this.m_localAnchorA, this.m_localCenterA));
        this.m_rB = Rot.mulVec2(qB, Vec2.sub(this.m_localAnchorB, this.m_localCenterB));

        // Get the pulley axes.
        this.m_uA = Vec2.sub(Vec2.add(cA, this.m_rA), this.m_groundAnchorA);
        this.m_uB = Vec2.sub(Vec2.add(cB, this.m_rB), this.m_groundAnchorB);

        const lengthA = this.m_uA.length();
        const lengthB = this.m_uB.length();

        if (lengthA > 10.0 * Settings.linearSlop) {
            this.m_uA.mul(1.0 / lengthA);
        } else {
            this.m_uA.setZero();
        }

        if (lengthB > 10.0 * Settings.linearSlop) {
            this.m_uB.mul(1.0 / lengthB);
        } else {
            this.m_uB.setZero();
        }

        // Compute effective mass.
        const ruA = Vec2.cross(this.m_rA, this.m_uA); // float
        const ruB = Vec2.cross(this.m_rB, this.m_uB); // float

        const mA = this.m_invMassA + this.m_invIA * ruA * ruA; // float
        const mB = this.m_invMassB + this.m_invIB * ruB * ruB; // float

        this.m_mass = mA + this.m_ratio * this.m_ratio * mB;

        if (this.m_mass > 0.0) {
            this.m_mass = 1.0 / this.m_mass;
        }

        if (step.warmStarting) {
            // Scale impulses to support variable time steps.
            this.m_impulse *= step.dtRatio;

            // Warm starting.
            const PA = Vec2.mul(-this.m_impulse, this.m_uA);
            const PB = Vec2.mul(-this.m_ratio * this.m_impulse, this.m_uB);

            vA.addMul(this.m_invMassA, PA);
            wA += this.m_invIA * Vec2.cross(this.m_rA, PA);

            vB.addMul(this.m_invMassB, PB);
            wB += this.m_invIB * Vec2.cross(this.m_rB, PB);

        } else {
            this.m_impulse = 0.0;
        }

        // this.m_bodyA.c_velocity.v = vA;
        this.m_bodyA.c_velocity.w = wA;
        // this.m_bodyB.c_velocity.v = vB;
        this.m_bodyB.c_velocity.w = wB;
    }

    solveVelocityConstraints(step: TimeStep) {
        const vA = this.m_bodyA.c_velocity.v;
        let wA = this.m_bodyA.c_velocity.w;
        const vB = this.m_bodyB.c_velocity.v;
        let wB = this.m_bodyB.c_velocity.w;

        const vpA = Vec2.add(vA, Vec2.crossSV(wA, this.m_rA));
        const vpB = Vec2.add(vB, Vec2.crossSV(wB, this.m_rB));

        const Cdot = -Vec2.dot(this.m_uA, vpA) - this.m_ratio
            * Vec2.dot(this.m_uB, vpB); // float
        const impulse = -this.m_mass * Cdot; // float
        this.m_impulse += impulse;

        const PA = Vec2.mul(-impulse, this.m_uA); // Vec2
        const PB = Vec2.mul(-this.m_ratio * impulse, this.m_uB); // Vec2
        vA.addMul(this.m_invMassA, PA);
        wA += this.m_invIA * Vec2.cross(this.m_rA, PA);
        vB.addMul(this.m_invMassB, PB);
        wB += this.m_invIB * Vec2.cross(this.m_rB, PB);

        // this.m_bodyA.c_velocity.v = vA;
        this.m_bodyA.c_velocity.w = wA;
        // this.m_bodyB.c_velocity.v = vB;
        this.m_bodyB.c_velocity.w = wB;
    }

    solvePositionConstraints(step: TimeStep) {
        const cA = this.m_bodyA.c_position.c;
        let aA = this.m_bodyA.c_position.a;
        const cB = this.m_bodyB.c_position.c;
        let aB = this.m_bodyB.c_position.a;

        const qA = Rot.forAngle(aA), qB = Rot.forAngle(aB);

        const rA = Rot.mulVec2(qA, Vec2.sub(this.m_localAnchorA, this.m_localCenterA));
        const rB = Rot.mulVec2(qB, Vec2.sub(this.m_localAnchorB, this.m_localCenterB));

        // Get the pulley axes.
        const uA = Vec2.sub(Vec2.add(cA, this.m_rA), this.m_groundAnchorA);
        const uB = Vec2.sub(Vec2.add(cB, this.m_rB), this.m_groundAnchorB);

        const lengthA = uA.length();
        const lengthB = uB.length();

        if (lengthA > 10.0 * Settings.linearSlop) {
            uA.mul(1.0 / lengthA);
        } else {
            uA.setZero();
        }

        if (lengthB > 10.0 * Settings.linearSlop) {
            uB.mul(1.0 / lengthB);
        } else {
            uB.setZero();
        }

        // Compute effective mass.
        const ruA = Vec2.cross(rA, uA);
        const ruB = Vec2.cross(rB, uB);

        const mA = this.m_invMassA + this.m_invIA * ruA * ruA; // float
        const mB = this.m_invMassB + this.m_invIB * ruB * ruB; // float

        let mass = mA + this.m_ratio * this.m_ratio * mB; // float

        if (mass > 0.0) {
            mass = 1.0 / mass;
        }

        const C = this.m_constant - lengthA - this.m_ratio * lengthB; // float
        const linearError = Math.abs(C); // float

        const impulse = -mass * C; // float

        const PA = Vec2.mul(-impulse, uA); // Vec2
        const PB = Vec2.mul(-this.m_ratio * impulse, uB); // Vec2

        cA.addMul(this.m_invMassA, PA);
        aA += this.m_invIA * Vec2.cross(rA, PA);
        cB.addMul(this.m_invMassB, PB);
        aB += this.m_invIB * Vec2.cross(rB, PB);

        // this.m_bodyA.c_position.c = cA;
        this.m_bodyA.c_position.a = aA;
        // this.m_bodyB.c_position.c = cB;
        this.m_bodyB.c_position.a = aB;

        return linearError < Settings.linearSlop;
    }
}