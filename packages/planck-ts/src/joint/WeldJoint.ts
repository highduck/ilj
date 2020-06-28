import {Joint, JointDef} from "../Joint";
import {Settings} from "../Settings";
import {Vec2} from "../common/Vec2";
import {Vec3} from "../common/Vec3";
import {Mat33} from "../common/Mat33";
import {Rot} from "../common/Rot";
import {TimeStep} from "../TimeStep";


/**
 * @typedef {Object} WeldJointDef
 *
 * Weld joint definition. You need to specify local anchor points where they are
 * attached and the relative body angle. The position of the anchor points is
 * important for computing the reaction torque.
 *
 * @prop {float} frequencyHz The mass-spring-damper frequency in Hertz. Rotation
 *       only. Disable softness with a value of 0.
 * @prop {float} dampingRatio The damping ratio. 0 = no damping, 1 = critical
 *       damping.
 *
 * @prop {Vec2} localAnchorA The local anchor point relative to bodyA's origin.
 * @prop {Vec2} localAnchorB The local anchor point relative to bodyB's origin.
 * @prop {float} referenceAngle The bodyB angle minus bodyA angle in the
 *       reference state (radians).
 */
export interface WeldJointDef extends JointDef {
    localAnchorA?: Vec2;
    localAnchorB?: Vec2;
    anchor?: Vec2;
    referenceAngle?: number;

    frequencyHz?: number; // 0.0,
    dampingRatio?: number; // 0.0,
}

/**
 * A weld joint essentially glues two bodies together. A weld joint may distort
 * somewhat because the island constraint solver is approximate.
 *
 * @param {WeldJointDef} def
 * @param {Body} bodyA
 * @param {Body} bodyB
 */
export class WeldJoint extends Joint {
    static readonly TYPE = 'weld-joint';

    m_localAnchorA: Vec2;
    m_localAnchorB: Vec2;
    m_referenceAngle: number;
    m_frequencyHz: number;
    m_dampingRatio: number;

    readonly m_impulse = new Vec3(0, 0, 0);
    m_bias = 0.0;
    m_gamma = 0.0;

    // Solver temp
    m_rA = Vec2.zero();
    m_rB = Vec2.zero();
    m_localCenterA = Vec2.zero();
    m_localCenterB = Vec2.zero();
    m_invMassA = 0;
    m_invMassB = 0;
    m_invIA = 0;
    m_invIB = 0;
    readonly m_mass = Mat33.zero();

    constructor(def: WeldJointDef) {
        super(def, WeldJoint.TYPE);

        this.m_localAnchorA = def.anchor ? def.bodyA.getLocalPoint(def.anchor) : def.localAnchorA || Vec2.zero();
        this.m_localAnchorB = def.anchor ? def.bodyB.getLocalPoint(def.anchor) : def.localAnchorB || Vec2.zero();
        this.m_referenceAngle = def.referenceAngle !== undefined ? def.referenceAngle : def.bodyB.getAngle() - def.bodyA.getAngle();

        this.m_frequencyHz = def.frequencyHz ?? 0;
        this.m_dampingRatio = def.dampingRatio ?? 0;

        // Point-to-point constraint
        // C = p2 - p1
        // Cdot = v2 - v1
        // / = v2 + cross(w2, r2) - v1 - cross(w1, r1)
        // J = [-I -r1_skew I r2_skew ]
        // Identity used:
        // w k % (rx i + ry j) = w * (-ry i + rx j)

        // Angle constraint
        // C = angle2 - angle1 - referenceAngle
        // Cdot = w2 - w1
        // J = [0 0 -1 0 0 1]
        // K = invI1 + invI2
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
     * Get the reference angle.
     */
    getReferenceAngle() {
        return this.m_referenceAngle;
    }

    /**
     * Set/get frequency in Hz.
     */
    setFrequency(hz:number) {
        this.m_frequencyHz = hz;
    }

    getFrequency() {
        return this.m_frequencyHz;
    }

    /**
     * Set/get damping ratio.
     */
    setDampingRatio(ratio:number) {
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
        return new Vec2(inv_dt * this.m_impulse.x, inv_dt * this.m_impulse.y);
    }

    getReactionTorque(inv_dt: number) {
        return inv_dt * this.m_impulse.z;
    }

    initVelocityConstraints(step: TimeStep) {
        this.m_localCenterA = this.m_bodyA.m_sweep.localCenter;
        this.m_localCenterB = this.m_bodyB.m_sweep.localCenter;
        this.m_invMassA = this.m_bodyA.m_invMass;
        this.m_invMassB = this.m_bodyB.m_invMass;
        this.m_invIA = this.m_bodyA.m_invI;
        this.m_invIB = this.m_bodyB.m_invI;

        const aA = this.m_bodyA.c_position.a;
        const vA = this.m_bodyA.c_velocity.v;
        let wA = this.m_bodyA.c_velocity.w;

        const aB = this.m_bodyB.c_position.a;
        const vB = this.m_bodyB.c_velocity.v;
        let wB = this.m_bodyB.c_velocity.w;

        const qA = Rot.forAngle(aA);
        const qB = Rot.forAngle(aB);

        this.m_rA = Rot.mulVec2(qA, Vec2.sub(this.m_localAnchorA, this.m_localCenterA));
        this.m_rB = Rot.mulVec2(qB, Vec2.sub(this.m_localAnchorB, this.m_localCenterB));

        // J = [-I -r1_skew I r2_skew]
        // [ 0 -1 0 1]
        // r_skew = [-ry; rx]

        // Matlab
        // K = [ mA+r1y^2*iA+mB+r2y^2*iB, -r1y*iA*r1x-r2y*iB*r2x, -r1y*iA-r2y*iB]
        // [ -r1y*iA*r1x-r2y*iB*r2x, mA+r1x^2*iA+mB+r2x^2*iB, r1x*iA+r2x*iB]
        // [ -r1y*iA-r2y*iB, r1x*iA+r2x*iB, iA+iB]

        const mA = this.m_invMassA;
        const mB = this.m_invMassB; // float
        const iA = this.m_invIA;
        const iB = this.m_invIB; // float

        const K = Mat33.zero();
        K.ex.x = mA + mB + this.m_rA.y * this.m_rA.y * iA + this.m_rB.y * this.m_rB.y * iB;
        K.ey.x = -this.m_rA.y * this.m_rA.x * iA - this.m_rB.y * this.m_rB.x * iB;
        K.ez.x = -this.m_rA.y * iA - this.m_rB.y * iB;
        K.ex.y = K.ey.x;
        K.ey.y = mA + mB + this.m_rA.x * this.m_rA.x * iA + this.m_rB.x * this.m_rB.x * iB;
        K.ez.y = this.m_rA.x * iA + this.m_rB.x * iB;
        K.ex.z = K.ez.x;
        K.ey.z = K.ez.y;
        K.ez.z = iA + iB;

        if (this.m_frequencyHz > 0.0) {
            K.getInverse22(this.m_mass);

            let invM = iA + iB; // float
            const m = invM > 0.0 ? 1.0 / invM : 0.0; // float

            const C = aB - aA - this.m_referenceAngle; // float

            // Frequency
            const omega = 2.0 * Math.PI * this.m_frequencyHz; // float

            // Damping coefficient
            const d = 2.0 * m * this.m_dampingRatio * omega; // float

            // Spring stiffness
            const k = m * omega * omega; // float

            // magic formulas
            const h = step.dt; // float
            this.m_gamma = h * (d + h * k);
            this.m_gamma = this.m_gamma != 0.0 ? 1.0 / this.m_gamma : 0.0;
            this.m_bias = C * h * k * this.m_gamma;

            invM += this.m_gamma;
            this.m_mass.ez.z = invM != 0.0 ? 1.0 / invM : 0.0;
        } else if (K.ez.z == 0.0) {
            K.getInverse22(this.m_mass);
            this.m_gamma = 0.0;
            this.m_bias = 0.0;
        } else {
            K.getSymInverse33(this.m_mass);
            this.m_gamma = 0.0;
            this.m_bias = 0.0;
        }

        if (step.warmStarting) {
            // Scale impulses to support a variable time step.
            this.m_impulse.mul(step.dtRatio);

            const P = new Vec2(this.m_impulse.x, this.m_impulse.y);

            vA.subMul(mA, P);
            wA -= iA * (Vec2.cross(this.m_rA, P) + this.m_impulse.z);

            vB.addMul(mB, P);
            wB += iB * (Vec2.cross(this.m_rB, P) + this.m_impulse.z);

        } else {
            this.m_impulse.setZero();
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

        const mA = this.m_invMassA;
        const mB = this.m_invMassB; // float
        const iA = this.m_invIA;
        const iB = this.m_invIB; // float

        if (this.m_frequencyHz > 0.0) {
            const Cdot2 = wB - wA; // float

            const impulse2 = -this.m_mass.ez.z
                * (Cdot2 + this.m_bias + this.m_gamma * this.m_impulse.z); // float
            this.m_impulse.z += impulse2;

            wA -= iA * impulse2;
            wB += iB * impulse2;

            const Cdot1 = Vec2.zero();
            Cdot1.addCombine(1, vB, 1, Vec2.crossSV(wB, this.m_rB));
            Cdot1.subCombine(1, vA, 1, Vec2.crossSV(wA, this.m_rA)); // Vec2

            const impulse1 = Vec2.neg(Mat33.mulVec2(this.m_mass, Cdot1)); // Vec2
            this.m_impulse.x += impulse1.x;
            this.m_impulse.y += impulse1.y;

            const P = Vec2.clone(impulse1); // Vec2

            vA.subMul(mA, P);
            wA -= iA * Vec2.cross(this.m_rA, P);

            vB.addMul(mB, P);
            wB += iB * Vec2.cross(this.m_rB, P);
        } else {
            const Cdot1 = Vec2.zero();
            Cdot1.addCombine(1, vB, 1, Vec2.crossSV(wB, this.m_rB));
            Cdot1.subCombine(1, vA, 1, Vec2.crossSV(wA, this.m_rA)); // Vec2
            const Cdot2 = wB - wA; // float
            const Cdot = new Vec3(Cdot1.x, Cdot1.y, Cdot2); // Vec3

            const impulse = Vec3.neg(Mat33.mulVec3(this.m_mass, Cdot)); // Vec3
            this.m_impulse.add(impulse);

            const P = new Vec2(impulse.x, impulse.y);

            vA.subMul(mA, P);
            wA -= iA * (Vec2.cross(this.m_rA, P) + impulse.z);

            vB.addMul(mB, P);
            wB += iB * (Vec2.cross(this.m_rB, P) + impulse.z);
        }

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

        const mA = this.m_invMassA, mB = this.m_invMassB; // float
        const iA = this.m_invIA, iB = this.m_invIB; // float

        const rA = Rot.mulVec2(qA, Vec2.sub(this.m_localAnchorA, this.m_localCenterA));
        const rB = Rot.mulVec2(qB, Vec2.sub(this.m_localAnchorB, this.m_localCenterB));

        let positionError: number;
        let angularError: number;

        const K = Mat33.zero();
        K.ex.x = mA + mB + rA.y * rA.y * iA + rB.y * rB.y * iB;
        K.ey.x = -rA.y * rA.x * iA - rB.y * rB.x * iB;
        K.ez.x = -rA.y * iA - rB.y * iB;
        K.ex.y = K.ey.x;
        K.ey.y = mA + mB + rA.x * rA.x * iA + rB.x * rB.x * iB;
        K.ez.y = rA.x * iA + rB.x * iB;
        K.ex.z = K.ez.x;
        K.ey.z = K.ez.y;
        K.ez.z = iA + iB;

        if (this.m_frequencyHz > 0.0) {
            const C1 = Vec2.zero();
            C1.addCombine(1, cB, 1, rB);
            C1.subCombine(1, cA, 1, rA); // Vec2

            positionError = C1.length();
            angularError = 0.0;

            const P = Vec2.neg(K.solve22(C1)); // Vec2

            cA.subMul(mA, P);
            aA -= iA * Vec2.cross(rA, P);

            cB.addMul(mB, P);
            aB += iB * Vec2.cross(rB, P);
        } else {
            const C1 = Vec2.zero();
            C1.addCombine(1, cB, 1, rB);
            C1.subCombine(1, cA, 1, rA);

            const C2 = aB - aA - this.m_referenceAngle; // float

            positionError = C1.length();
            angularError = Math.abs(C2);

            const C = new Vec3(C1.x, C1.y, C2);

            let impulse = new Vec3(0, 0, 0);
            if (K.ez.z > 0.0) {
                impulse = Vec3.neg(K.solve33(C));
            } else {
                const impulse2 = Vec2.neg(K.solve22(C1));
                impulse.set(impulse2.x, impulse2.y, 0.0);
            }

            const P = new Vec2(impulse.x, impulse.y);

            cA.subMul(mA, P);
            aA -= iA * (Vec2.cross(rA, P) + impulse.z);

            cB.addMul(mB, P);
            aB += iB * (Vec2.cross(rB, P) + impulse.z);
        }

        // this.m_bodyA.c_position.c = cA;
        this.m_bodyA.c_position.a = aA;
        // this.m_bodyB.c_position.c = cB;
        this.m_bodyB.c_position.a = aB;

        return positionError <= Settings.linearSlop
            && angularError <= Settings.angularSlop;
    }
}