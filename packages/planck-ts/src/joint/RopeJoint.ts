import {Joint, JointDef} from "../Joint";
import {Vec2} from "../common/Vec2";
import {Rot} from "../common/Rot";
import {MathUtil} from "../common/Math";
import {Settings} from "../Settings";
import {TimeStep} from "../TimeStep";

const inactiveLimit = 0;
const atLowerLimit = 1;
const atUpperLimit = 2;
const equalLimits = 3;

/**
 * @typedef {Object} RopeJointDef
 *
 * Rope joint definition. This requires two body anchor points and a maximum
 * lengths. Note: by default the connected objects will not collide. see
 * collideConnected in JointDef.
 *
 * @prop {float} maxLength The maximum length of the rope. Warning: this must be
 *       larger than linearSlop or the joint will have no effect.
 *
 * @prop {Vec2} def.localAnchorA The local anchor point relative to bodyA's origin.
 * @prop {Vec2} def.localAnchorB The local anchor point relative to bodyB's origin.
 */

export interface RopeJointDef extends JointDef {
    maxLength?: number;// : 0.0,
    localAnchorA?: Vec2;
    localAnchorB?: Vec2;
    anchor?: Vec2;
}

/**
 * A rope joint enforces a maximum distance between two points on two bodies. It
 * has no other effect.
 *
 * Warning: if you attempt to change the maximum length during the simulation
 * you will get some non-physical behavior.
 *
 * A model that would allow you to dynamically modify the length would have some
 * sponginess, so I chose not to implement it that way. See DistanceJoint if you
 * want to dynamically control length.
 *
 * @param {RopeJointDef} def
 * @param {Body} bodyA
 * @param {Body} bodyB
 */
export class RopeJoint extends Joint {
    static readonly TYPE = 'rope-joint';

    m_localAnchorA: Vec2;
    m_localAnchorB: Vec2;
    m_maxLength: number;

    m_mass = 0.0;
    m_impulse = 0.0;
    m_length = 0.0;
    m_state = inactiveLimit;

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

    constructor(def: RopeJointDef) {
        super(def, RopeJoint.TYPE);

        this.m_localAnchorA = def.anchor ? def.bodyA.getLocalPoint(def.anchor) : def.localAnchorA || new Vec2(-1, 0);
        this.m_localAnchorB = def.anchor ? def.bodyB.getLocalPoint(def.anchor) : def.localAnchorB || new Vec2(1, 0);

        this.m_maxLength = def.maxLength ?? 0;

        // Limit:
        // C = norm(pB - pA) - L
        // u = (pB - pA) / norm(pB - pA)
        // Cdot = dot(u, vB + cross(wB, rB) - vA - cross(wA, rA))
        // J = [-u -cross(rA, u) u cross(rB, u)]
        // K = J * invM * JT
        // = invMassA + invIA * cross(rA, u)^2 + invMassB + invIB * cross(rB, u)^2
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
     * Set/Get the maximum length of the rope.
     */
    setMaxLength(length:number) {
        this.m_maxLength = length;
    }

    getMaxLength() {
        return this.m_maxLength;
    }

    getLimitState() {
        // TODO LimitState
        return this.m_state;
    }

    getAnchorA() {
        return this.m_bodyA.getWorldPoint(this.m_localAnchorA);
    }

    getAnchorB() {
        return this.m_bodyB.getWorldPoint(this.m_localAnchorB);
    }

    getReactionForce(inv_dt:number) {
        return Vec2.mul(this.m_impulse, this.m_u).mul(inv_dt);
    }

    getReactionTorque(inv_dt:number) {
        return 0.0;
    }

    initVelocityConstraints(step:TimeStep) {
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

        this.m_rA = Rot.mulSub(qA, this.m_localAnchorA, this.m_localCenterA);
        this.m_rB = Rot.mulSub(qB, this.m_localAnchorB, this.m_localCenterB);
        this.m_u = Vec2.zero();
        this.m_u.addCombine(1, cB, 1, this.m_rB);
        this.m_u.subCombine(1, cA, 1, this.m_rA); // Vec2

        this.m_length = this.m_u.length();

        const C = this.m_length - this.m_maxLength; // float
        if (C > 0.0) {
            this.m_state = atUpperLimit;
        } else {
            this.m_state = inactiveLimit;
        }

        if (this.m_length > Settings.linearSlop) {
            this.m_u.mul(1.0 / this.m_length);
        } else {
            this.m_u.setZero();
            this.m_mass = 0.0;
            this.m_impulse = 0.0;
            return;
        }

        // Compute effective mass.
        const crA = Vec2.cross(this.m_rA, this.m_u); // float
        const crB = Vec2.cross(this.m_rB, this.m_u); // float
        const invMass = this.m_invMassA + this.m_invIA * crA * crA + this.m_invMassB
            + this.m_invIB * crB * crB; // float

        this.m_mass = invMass != 0.0 ? 1.0 / invMass : 0.0;

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

    solveVelocityConstraints(step:TimeStep) {
        const vA = this.m_bodyA.c_velocity.v;
        let wA = this.m_bodyA.c_velocity.w;
        const vB = this.m_bodyB.c_velocity.v;
        let wB = this.m_bodyB.c_velocity.w;

        // Cdot = dot(u, v + cross(w, r))
        const vpA = Vec2.addCrossSV(vA, wA, this.m_rA); // Vec2
        const vpB = Vec2.addCrossSV(vB, wB, this.m_rB); // Vec2
        const C = this.m_length - this.m_maxLength; // float
        let Cdot = Vec2.dot(this.m_u, Vec2.sub(vpB, vpA)); // float

        // Predictive constraint.
        if (C < 0.0) {
            Cdot += step.inv_dt * C;
        }

        let impulse = -this.m_mass * Cdot; // float
        const oldImpulse = this.m_impulse; // float
        this.m_impulse = Math.min(0.0, this.m_impulse + impulse);
        impulse = this.m_impulse - oldImpulse;

        const P = Vec2.mul(impulse, this.m_u); // Vec2
        vA.subMul(this.m_invMassA, P);
        wA -= this.m_invIA * Vec2.cross(this.m_rA, P);
        vB.addMul(this.m_invMassB, P);
        wB += this.m_invIB * Vec2.cross(this.m_rB, P);

        // this.m_bodyA.c_velocity.v = vA;
        this.m_bodyA.c_velocity.w = wA;
        // this.m_bodyB.c_velocity.v = vB;
        this.m_bodyB.c_velocity.w = wB;
    }

    solvePositionConstraints(step:TimeStep) {
        const cA = this.m_bodyA.c_position.c; // Vec2
        let aA = this.m_bodyA.c_position.a; // float
        const cB = this.m_bodyB.c_position.c; // Vec2
        let aB = this.m_bodyB.c_position.a; // float

        const qA = Rot.forAngle(aA);
        const qB = Rot.forAngle(aB);

        const rA = Rot.mulSub(qA, this.m_localAnchorA, this.m_localCenterA);
        const rB = Rot.mulSub(qB, this.m_localAnchorB, this.m_localCenterB);
        const u = Vec2.zero();
        u.addCombine(1, cB, 1, rB);
        u.subCombine(1, cA, 1, rA); // Vec2

        const length = u.normalize(); // float
        const C = MathUtil.clamp(length - this.m_maxLength, 0.0, Settings.maxLinearCorrection);

        const impulse = -this.m_mass * C; // float
        const P = Vec2.mul(impulse, u); // Vec2

        cA.subMul(this.m_invMassA, P);
        aA -= this.m_invIA * Vec2.cross(rA, P);
        cB.addMul(this.m_invMassB, P);
        aB += this.m_invIB * Vec2.cross(rB, P);

        // this.m_bodyA.c_position.c.set(cA);
        this.m_bodyA.c_position.a = aA;
        // this.m_bodyB.c_position.c.set(cB);
        this.m_bodyB.c_position.a = aB;

        return length - this.m_maxLength < Settings.linearSlop;
    }
}