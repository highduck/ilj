import {Joint, JointDef} from "../Joint";
import {Vec2} from "../common/Vec2";
import {Body} from "../Body";
import {Rot} from "../common/Rot";
import {Settings} from "../Settings";
import {MathUtil} from "../common/Math";
import {World} from "../World";
import {TimeStep} from "../TimeStep";

/**
 * @typedef {Object} DistanceJointDef
 *
 * Distance joint definition. This requires defining an anchor point on both
 * bodies and the non-zero length of the distance joint. The definition uses
 * local anchor points so that the initial configuration can violate the
 * constraint slightly. This helps when saving and loading a game. Warning: Do
 * not use a zero or short length.
 *
 * @prop {float} frequencyHz The mass-spring-damper frequency in Hertz. A value
 *       of 0 disables softness.
 * @prop {float} dampingRatio The damping ratio. 0 = no damping, 1 = critical
 *       damping.
 *
 * @prop {Vec2} def.localAnchorA The local anchor point relative to bodyA's origin.
 * @prop {Vec2} def.localAnchorB The local anchor point relative to bodyB's origin.
 * @prop {number} def.length Distance length.
 *  * @param {Vec2} anchorA Anchor A in global coordination.
 * @param {Vec2} anchorB Anchor B in global coordination.
 */

export interface DistanceJointDef extends JointDef {
    localAnchorA?: Vec2;
    localAnchorB?: Vec2;
    anchorA?: Vec2;
    anchorB?: Vec2;

    frequencyHz?: number; // 0
    dampingRatio?: number; // 0
    length?: number;
}

/**
 * A distance joint constrains two points on two bodies to remain at a fixed
 * distance from each other. You can view this as a massless, rigid rod.
 *
 * @param {DistanceJointDef} def
 * @param {Body} bodyA
 * @param {Body} bodyB
 * @param {Vec2} anchorA Anchor A in global coordination.
 * @param {Vec2} anchorB Anchor B in global coordination.
 */
export class DistanceJoint extends Joint {
    static readonly TYPE = 'distance-joint';

    m_frequencyHz: number;
    m_dampingRatio: number;
    m_localAnchorA: Vec2;
    m_localAnchorB: Vec2;
    m_length: number;

    m_impulse = 0.0;
    m_gamma = 0.0;
    m_bias = 0.0;

    // Solver temp
    m_u = Vec2.zero();
    m_rA = Vec2.zero();
    m_rB = Vec2.zero();
    m_localCenterA = Vec2.zero();
    m_localCenterB = Vec2.zero();
    m_invMassA = 0;
    m_invMassB = 0;
    m_invIA = 0;
    m_invIB = 0;
    m_mass = 0;

    constructor(def: DistanceJointDef) {
        super(def, DistanceJoint.TYPE);

        // Solver shared
        this.m_localAnchorA = Vec2.clone(def.anchorA ? def.bodyA.getLocalPoint(def.anchorA) : def.localAnchorA || Vec2.zero());
        this.m_localAnchorB = Vec2.clone(def.anchorB ? def.bodyB.getLocalPoint(def.anchorB) : def.localAnchorB || Vec2.zero());
        this.m_length = def.length !== undefined ? def.length :
            Vec2.distance(
                def.bodyA.getWorldPoint(this.m_localAnchorA),
                def.bodyB.getWorldPoint(this.m_localAnchorB)
            );
        this.m_frequencyHz = def.frequencyHz ?? 0;
        this.m_dampingRatio = def.dampingRatio ?? 0;
        this.m_impulse = 0.0;
        this.m_gamma = 0.0;
        this.m_bias = 0.0;

        // 1-D constrained system
        // m (v2 - v1) = lambda
        // v2 + (beta/h) * x1 + gamma * lambda = 0, gamma has units of inverse mass.
        // x2 = x1 + h * v2

        // 1-D mass-damper-spring system
        // m (v2 - v1) + h * d * v2 + h * k *

        // C = norm(p2 - p1) - L
        // u = (p2 - p1) / norm(p2 - p1)
        // Cdot = dot(u, v2 + cross(w2, r2) - v1 - cross(w1, r1))
        // J = [-u -cross(r1, u) u cross(r2, u)]
        // K = J * invM * JT
        // = invMass1 + invI1 * cross(r1, u)^2 + invMass2 + invI2 * cross(r2, u)^2
    }

    // _serialize() {
    //     return {
    //         type: this.m_type,
    //         bodyA: this.m_bodyA,
    //         bodyB: this.m_bodyB,
    //         collideConnected: this.m_collideConnected,
    //
    //         frequencyHz: this.m_frequencyHz,
    //         dampingRatio: this.m_dampingRatio,
    //
    //         localAnchorA: this.m_localAnchorA,
    //         localAnchorB: this.m_localAnchorB,
    //         length: this.m_length,
    //
    //         impulse: this.m_impulse,
    //         gamma: this.m_gamma,
    //         bias: this.m_bias,
    //     };
    // };
    //
    // static _deserialize(data:any, world:World, restore) {
    //     data.bodyA = restore(Body, data.bodyA, world);
    //     data.bodyB = restore(Body, data.bodyB, world);
    //     const joint = new DistanceJoint(data);
    //     return joint;
    // }

    /**
     * @internal
     */
    _setAnchors(def: DistanceJointDef) {
        if (def.anchorA) {
            this.m_localAnchorA.copyFrom(this.m_bodyA.getLocalPoint(def.anchorA));
        } else if (def.localAnchorA) {
            this.m_localAnchorA.copyFrom(def.localAnchorA);
        }

        if (def.anchorB) {
            this.m_localAnchorB.copyFrom(this.m_bodyB.getLocalPoint(def.anchorB));
        } else if (def.localAnchorB) {
            this.m_localAnchorB.copyFrom(def.localAnchorB);
        }

        const len = def.length ?? 0;
        if (len > 0) {
            this.m_length = len;
        } else if (len < 0) {
            // don't change length
        } else if (def.anchorA || def.anchorB || def.localAnchorA || def.localAnchorB) {
            this.m_length = Vec2.distance(
                this.m_bodyA.getWorldPoint(this.m_localAnchorA),
                this.m_bodyB.getWorldPoint(this.m_localAnchorB)
            );
        }
    }

    /**
     * The local anchor point relative to bodyA's origin.
     */
    getLocalAnchorA() {
        return this.m_localAnchorA;
    }

    /**
     * The local anchor point relative to bodyB's origin.
     */
    getLocalAnchorB() {
        return this.m_localAnchorB;
    }

    /**
     * Set/get the natural length. Manipulating the length can lead to non-physical
     * behavior when the frequency is zero.
     */
    setLength(length: number) {
        this.m_length = length;
    }

    getLength() {
        return this.m_length;
    }

    setFrequency(hz: number) {
        this.m_frequencyHz = hz;
    }

    getFrequency() {
        return this.m_frequencyHz;
    }

    setDampingRatio(ratio: number) {
        this.m_dampingRatio = ratio;
    }

    getDampingRatio() {
        return this.m_dampingRatio;
    }

    getAnchorA() {
        return this.m_bodyA.getWorldPoint(this.m_localAnchorA);
    }

    getAnchorB() {
        return this.m_bodyB.getWorldPoint(this.m_localAnchorB);
    }

    getReactionForce(inv_dt: number) {
        return Vec2.mul(this.m_impulse, this.m_u).mul(inv_dt);
    }

    getReactionTorque(inv_dt: number) {
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
        this.m_u = Vec2.sub(Vec2.add(cB, this.m_rB), Vec2.add(cA, this.m_rA));

        // Handle singularity.
        const length = this.m_u.length();
        if (length > Settings.linearSlop) {
            this.m_u.mul(1.0 / length);
        } else {
            this.m_u.set(0.0, 0.0);
        }

        const crAu = Vec2.cross(this.m_rA, this.m_u);
        const crBu = Vec2.cross(this.m_rB, this.m_u);
        let invMass = this.m_invMassA + this.m_invIA * crAu * crAu + this.m_invMassB
            + this.m_invIB * crBu * crBu;

        // Compute the effective mass matrix.
        this.m_mass = invMass != 0.0 ? 1.0 / invMass : 0.0;

        if (this.m_frequencyHz > 0.0) {
            const C = length - this.m_length;

            // Frequency
            const omega = 2.0 * Math.PI * this.m_frequencyHz;

            // Damping coefficient
            const d = 2.0 * this.m_mass * this.m_dampingRatio * omega;

            // Spring stiffness
            const k = this.m_mass * omega * omega;

            // magic formulas
            const h = step.dt;
            this.m_gamma = h * (d + h * k);
            this.m_gamma = this.m_gamma != 0.0 ? 1.0 / this.m_gamma : 0.0;
            this.m_bias = C * h * k * this.m_gamma;

            invMass += this.m_gamma;
            this.m_mass = invMass != 0.0 ? 1.0 / invMass : 0.0;
        } else {
            this.m_gamma = 0.0;
            this.m_bias = 0.0;
        }

        if (step.warmStarting) {
            // Scale the impulse to support a variable time step.
            this.m_impulse *= step.dtRatio;

            const P = Vec2.mul(this.m_impulse, this.m_u);

            vA.subMul(this.m_invMassA, P);
            wA -= this.m_invIA * Vec2.cross(this.m_rA, P);

            vB.addMul(this.m_invMassB, P);
            wB += this.m_invIB * Vec2.cross(this.m_rB, P);

        } else {
            this.m_impulse = 0.0;
        }

        // this.m_bodyA.c_velocity.v.set(vA);
        this.m_bodyA.c_velocity.w = wA;
        // this.m_bodyB.c_velocity.v.set(vB);
        this.m_bodyB.c_velocity.w = wB;
    }

    solveVelocityConstraints(step: TimeStep) {
        const vA = this.m_bodyA.c_velocity.v;
        let wA = this.m_bodyA.c_velocity.w;
        const vB = this.m_bodyB.c_velocity.v;
        let wB = this.m_bodyB.c_velocity.w;

        // Cdot = dot(u, v + cross(w, r))
        const vpA = Vec2.add(vA, Vec2.crossSV(wA, this.m_rA));
        const vpB = Vec2.add(vB, Vec2.crossSV(wB, this.m_rB));
        const Cdot = Vec2.dot(this.m_u, vpB) - Vec2.dot(this.m_u, vpA);

        const impulse = -this.m_mass
            * (Cdot + this.m_bias + this.m_gamma * this.m_impulse);
        this.m_impulse += impulse;

        const P = Vec2.mul(impulse, this.m_u);
        vA.subMul(this.m_invMassA, P);
        wA -= this.m_invIA * Vec2.cross(this.m_rA, P);
        vB.addMul(this.m_invMassB, P);
        wB += this.m_invIB * Vec2.cross(this.m_rB, P);

        // this.m_bodyA.c_velocity.v.set(vA);
        this.m_bodyA.c_velocity.w = wA;
        // this.m_bodyB.c_velocity.v.set(vB);
        this.m_bodyB.c_velocity.w = wB;
    }

    solvePositionConstraints(step: TimeStep) {
        if (this.m_frequencyHz > 0.0) {
            // There is no position correction for soft distance constraints.
            return true;
        }

        const cA = this.m_bodyA.c_position.c;
        let aA = this.m_bodyA.c_position.a;
        const cB = this.m_bodyB.c_position.c;
        let aB = this.m_bodyB.c_position.a;

        const qA = Rot.forAngle(aA);
        const qB = Rot.forAngle(aB);

        const rA = Rot.mulSub(qA, this.m_localAnchorA, this.m_localCenterA);
        const rB = Rot.mulSub(qB, this.m_localAnchorB, this.m_localCenterB);
        const u = Vec2.sub(Vec2.add(cB, rB), Vec2.add(cA, rA));

        const length = u.normalize();
        const C = MathUtil.clamp(length - this.m_length, -Settings.maxLinearCorrection, Settings.maxLinearCorrection);

        const impulse = -this.m_mass * C;
        const P = Vec2.mul(impulse, u);

        cA.subMul(this.m_invMassA, P);
        aA -= this.m_invIA * Vec2.cross(rA, P);
        cB.addMul(this.m_invMassB, P);
        aB += this.m_invIB * Vec2.cross(rB, P);

        // this.m_bodyA.c_position.c.set(cA);
        this.m_bodyA.c_position.a = aA;
        // this.m_bodyB.c_position.c.set(cB);
        this.m_bodyB.c_position.a = aB;

        return Math.abs(C) < Settings.linearSlop;
    }
}

Joint.TYPES[DistanceJoint.TYPE] = DistanceJoint;