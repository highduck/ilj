import {Joint, JointDef, JointType} from "../Joint";
import {Settings} from "../Settings";
import {Rot} from "../common/Rot";
import {Vec2} from "../common/Vec2";
import {RevoluteJoint} from "./RevoluteJoint";
import {MathUtil} from "../common/Math";
import {assert} from "../util/common";
import {Body} from '../Body';
import {PrismaticJoint} from "./PrismaticJoint";
import {TimeStep} from "../TimeStep";

/**
 * @typedef {Object} GearJointDef
 *
 * Gear joint definition.
 *
 * @prop {float} ratio The gear ratio. See GearJoint for explanation.
 *
 * @prop {RevoluteJoint|PrismaticJoint} joint1 The first revolute/prismatic
 *          joint attached to the gear joint.
 * @prop {PrismaticJoint|RevoluteJoint} joint2 The second prismatic/revolute
 *          joint attached to the gear joint.
 */
export interface GearJointDef extends JointDef {
    joint1: RevoluteJoint | PrismaticJoint;
    joint2: RevoluteJoint | PrismaticJoint;

    ratio?: number; // 1
}

/**
 * A gear joint is used to connect two joints together. Either joint can be a
 * revolute or prismatic joint. You specify a gear ratio to bind the motions
 * together: coordinate1 + ratio * coordinate2 = constant
 *
 * The ratio can be negative or positive. If one joint is a revolute joint and
 * the other joint is a prismatic joint, then the ratio will have units of
 * length or units of 1/length. Warning: You have to manually destroy the gear
 * joint if joint1 or joint2 is destroyed.
 *
 * This definition requires two existing revolute or prismatic joints (any
 * combination will work).
 *
 * @param {GearJointDef} def
 * @param {Body} bodyA
 * @param {Body} bodyB
 */
export class GearJoint extends Joint {
    static readonly TYPE = 'gear-joint';

    m_joint1: RevoluteJoint | PrismaticJoint;
    m_joint2: RevoluteJoint | PrismaticJoint;
    m_type1: JointType;//'revolute-joint' | 'prismatic-joint';
    m_type2: JointType;//'revolute-joint' | 'prismatic-joint';
    m_bodyC: Body;
    m_localAnchorC: Vec2;
    m_localAnchorA: Vec2;
    m_referenceAngleA: number;
    m_localAxisC: Vec2;
    m_bodyD: Body;
    m_localAnchorD: Vec2;
    m_localAnchorB: Vec2;
    m_referenceAngleB: number;
    m_localAxisD: Vec2;
    m_ratio: number;
    m_constant: number;
    m_impulse = 0;

    // Solver temp
    m_lcA = Vec2.zero();
    m_lcB = Vec2.zero();
    m_lcC = Vec2.zero();
    m_lcD = Vec2.zero();
    m_mA = 0;
    m_mB = 0;
    m_mC = 0;
    m_mD = 0;
    m_iA = 0;
    m_iB = 0;
    m_iC = 0;
    m_iD = 0;
    m_JvAC = Vec2.zero();
    m_JvBD = Vec2.zero();
    m_JwA = 0;
    m_JwB = 0;
    m_JwC = 0;
    m_JwD = 0;
    m_mass = 0;

    constructor(def: GearJointDef) {
        super(def, GearJoint.TYPE);

        PLANCK_ASSERT && assert(def.joint1.m_type === RevoluteJoint.TYPE
            || def.joint1.m_type === PrismaticJoint.TYPE);
        PLANCK_ASSERT && assert(def.joint2.m_type === RevoluteJoint.TYPE
            || def.joint2.m_type === PrismaticJoint.TYPE);

        this.m_joint1 = def.joint1;
        this.m_joint2 = def.joint2;
        this.m_ratio = def.ratio ?? 1;

        this.m_type1 = this.m_joint1.getType();
        this.m_type2 = this.m_joint2.getType();

        // joint1 connects body A to body C
        // joint2 connects body B to body D

        let coordinateA: number;
        let coordinateB: number;

        // TODO_ERIN there might be some problem with the joint edges in Joint.

        this.m_bodyC = this.m_joint1.getBodyA();
        this.m_bodyA = this.m_joint1.getBodyB();

        // Get geometry of joint1
        const xfA = this.m_bodyA.m_xf;
        const aA = this.m_bodyA.m_sweep.a;
        const xfC = this.m_bodyC.m_xf;
        const aC = this.m_bodyC.m_sweep.a;

        if (this.m_type1 === RevoluteJoint.TYPE) {
            const revolute = this.m_joint1 as RevoluteJoint;
            this.m_localAnchorC = revolute.m_localAnchorA;
            this.m_localAnchorA = revolute.m_localAnchorB;
            this.m_referenceAngleA = revolute.m_referenceAngle;
            this.m_localAxisC = Vec2.zero();

            coordinateA = aA - aC - this.m_referenceAngleA;
        } else {
            const prismatic = this.m_joint1 as PrismaticJoint;
            this.m_localAnchorC = prismatic.m_localAnchorA;
            this.m_localAnchorA = prismatic.m_localAnchorB;
            this.m_referenceAngleA = prismatic.m_referenceAngle;
            this.m_localAxisC = prismatic.m_localXAxisA;

            const pC = this.m_localAnchorC;
            const pA = Rot.mulTVec2(xfC.q, Vec2.add(Rot.mulVec2(xfA.q, this.m_localAnchorA), Vec2.sub(xfA.p, xfC.p)));
            coordinateA = Vec2.dot(pA, this.m_localAxisC) - Vec2.dot(pC, this.m_localAxisC);
        }

        this.m_bodyD = this.m_joint2.getBodyA();
        this.m_bodyB = this.m_joint2.getBodyB();

        // Get geometry of joint2
        const xfB = this.m_bodyB.m_xf;
        const aB = this.m_bodyB.m_sweep.a;
        const xfD = this.m_bodyD.m_xf;
        const aD = this.m_bodyD.m_sweep.a;

        if (this.m_type2 === RevoluteJoint.TYPE) {
            const revolute = this.m_joint2 as RevoluteJoint;
            this.m_localAnchorD = revolute.m_localAnchorA;
            this.m_localAnchorB = revolute.m_localAnchorB;
            this.m_referenceAngleB = revolute.m_referenceAngle;
            this.m_localAxisD = Vec2.zero();

            coordinateB = aB - aD - this.m_referenceAngleB;
        } else {
            const prismatic = this.m_joint2 as PrismaticJoint;
            this.m_localAnchorD = prismatic.m_localAnchorA;
            this.m_localAnchorB = prismatic.m_localAnchorB;
            this.m_referenceAngleB = prismatic.m_referenceAngle;
            this.m_localAxisD = prismatic.m_localXAxisA;

            const pD = this.m_localAnchorD;
            const pB = Rot.mulTVec2(xfD.q, Vec2.add(Rot.mulVec2(xfB.q, this.m_localAnchorB), Vec2.sub(xfB.p, xfD.p)));
            coordinateB = Vec2.dot(pB, this.m_localAxisD) - Vec2.dot(pD, this.m_localAxisD);
        }

        this.m_constant = coordinateA + this.m_ratio * coordinateB;

        // Gear Joint:
        // C0 = (coordinate1 + ratio * coordinate2)_initial
        // C = (coordinate1 + ratio * coordinate2) - C0 = 0
        // J = [J1 ratio * J2]
        // K = J * invM * JT
        // = J1 * invM1 * J1T + ratio * ratio * J2 * invM2 * J2T
        //
        // Revolute:
        // coordinate = rotation
        // Cdot = angularVelocity
        // J = [0 0 1]
        // K = J * invM * JT = invI
        //
        // Prismatic:
        // coordinate = dot(p - pg, ug)
        // Cdot = dot(v + cross(w, r), ug)
        // J = [ug cross(r, ug)]
        // K = J * invM * JT = invMass + invI * cross(r, ug)^2
    }


    /**
     * Get the first joint.
     */
    getJoint1() {
        return this.m_joint1;
    }

    /**
     * Get the second joint.
     */
    getJoint2() {
        return this.m_joint2;
    }

    /**
     * Set/Get the gear ratio.
     */
    setRatio(ratio: number) {
        PLANCK_ASSERT && assert(MathUtil.isFinite(ratio));
        this.m_ratio = ratio;
    }

    getRatio() {
        return this.m_ratio;
    }

    getAnchorA() {
        return this.m_bodyA.getWorldPoint(this.m_localAnchorA);
    }

    getAnchorB() {
        return this.m_bodyB.getWorldPoint(this.m_localAnchorB);
    }

    getReactionForce(inv_dt: number): Vec2 {
        return Vec2.mul(this.m_impulse, this.m_JvAC).mul(inv_dt);
    }

    getReactionTorque(inv_dt: number): number {
        const L = this.m_impulse * this.m_JwA;
        return inv_dt * L;
    }

    initVelocityConstraints(step: TimeStep) {
        this.m_lcA = this.m_bodyA.m_sweep.localCenter;
        this.m_lcB = this.m_bodyB.m_sweep.localCenter;
        this.m_lcC = this.m_bodyC.m_sweep.localCenter;
        this.m_lcD = this.m_bodyD.m_sweep.localCenter;
        this.m_mA = this.m_bodyA.m_invMass;
        this.m_mB = this.m_bodyB.m_invMass;
        this.m_mC = this.m_bodyC.m_invMass;
        this.m_mD = this.m_bodyD.m_invMass;
        this.m_iA = this.m_bodyA.m_invI;
        this.m_iB = this.m_bodyB.m_invI;
        this.m_iC = this.m_bodyC.m_invI;
        this.m_iD = this.m_bodyD.m_invI;

        const aA = this.m_bodyA.c_position.a;
        const vA = this.m_bodyA.c_velocity.v;
        let wA = this.m_bodyA.c_velocity.w;

        const aB = this.m_bodyB.c_position.a;
        const vB = this.m_bodyB.c_velocity.v;
        let wB = this.m_bodyB.c_velocity.w;

        const aC = this.m_bodyC.c_position.a;
        const vC = this.m_bodyC.c_velocity.v;
        let wC = this.m_bodyC.c_velocity.w;

        const aD = this.m_bodyD.c_position.a;
        const vD = this.m_bodyD.c_velocity.v;
        let wD = this.m_bodyD.c_velocity.w;

        const qA = Rot.forAngle(aA);
        const qB = Rot.forAngle(aB);
        const qC = Rot.forAngle(aC);
        const qD = Rot.forAngle(aD);

        this.m_mass = 0.0;

        if (this.m_type1 == RevoluteJoint.TYPE) {
            this.m_JvAC = Vec2.zero();
            this.m_JwA = 1.0;
            this.m_JwC = 1.0;
            this.m_mass += this.m_iA + this.m_iC;
        } else {
            const u = Rot.mulVec2(qC, this.m_localAxisC); // Vec2
            const rC = Rot.mulSub(qC, this.m_localAnchorC, this.m_lcC); // Vec2
            const rA = Rot.mulSub(qA, this.m_localAnchorA, this.m_lcA); // Vec2
            this.m_JvAC = u;
            this.m_JwC = Vec2.cross(rC, u);
            this.m_JwA = Vec2.cross(rA, u);
            this.m_mass += this.m_mC + this.m_mA + this.m_iC * this.m_JwC * this.m_JwC + this.m_iA * this.m_JwA * this.m_JwA;
        }

        if (this.m_type2 == RevoluteJoint.TYPE) {
            this.m_JvBD = Vec2.zero();
            this.m_JwB = this.m_ratio;
            this.m_JwD = this.m_ratio;
            this.m_mass += this.m_ratio * this.m_ratio * (this.m_iB + this.m_iD);
        } else {
            const u = Rot.mulVec2(qD, this.m_localAxisD); // Vec2
            const rD = Rot.mulSub(qD, this.m_localAnchorD, this.m_lcD); // Vec2
            const rB = Rot.mulSub(qB, this.m_localAnchorB, this.m_lcB); // Vec2
            this.m_JvBD = Vec2.mul(this.m_ratio, u);
            this.m_JwD = this.m_ratio * Vec2.cross(rD, u);
            this.m_JwB = this.m_ratio * Vec2.cross(rB, u);
            this.m_mass += this.m_ratio * this.m_ratio * (this.m_mD + this.m_mB) + this.m_iD * this.m_JwD * this.m_JwD + this.m_iB * this.m_JwB * this.m_JwB;
        }

        // Compute effective mass.
        this.m_mass = this.m_mass > 0.0 ? 1.0 / this.m_mass : 0.0;

        if (step.warmStarting) {
            vA.addMul(this.m_mA * this.m_impulse, this.m_JvAC);
            wA += this.m_iA * this.m_impulse * this.m_JwA;

            vB.addMul(this.m_mB * this.m_impulse, this.m_JvBD);
            wB += this.m_iB * this.m_impulse * this.m_JwB;

            vC.subMul(this.m_mC * this.m_impulse, this.m_JvAC);
            wC -= this.m_iC * this.m_impulse * this.m_JwC;

            vD.subMul(this.m_mD * this.m_impulse, this.m_JvBD);
            wD -= this.m_iD * this.m_impulse * this.m_JwD;

        } else {
            this.m_impulse = 0.0;
        }

        // this.m_bodyA.c_velocity.v.copyFrom(vA);
        this.m_bodyA.c_velocity.w = wA;
        // this.m_bodyB.c_velocity.v.copyFrom(vB);
        this.m_bodyB.c_velocity.w = wB;
        // this.m_bodyC.c_velocity.v.copyFrom(vC);
        this.m_bodyC.c_velocity.w = wC;
        // this.m_bodyD.c_velocity.v.copyFrom(vD);
        this.m_bodyD.c_velocity.w = wD;
    }

    solveVelocityConstraints(step: TimeStep) {
        const vA = this.m_bodyA.c_velocity.v;
        let wA = this.m_bodyA.c_velocity.w;
        const vB = this.m_bodyB.c_velocity.v;
        let wB = this.m_bodyB.c_velocity.w;
        const vC = this.m_bodyC.c_velocity.v;
        let wC = this.m_bodyC.c_velocity.w;
        const vD = this.m_bodyD.c_velocity.v;
        let wD = this.m_bodyD.c_velocity.w;

        const Cdot = Vec2.dot(this.m_JvAC, vA) - Vec2.dot(this.m_JvAC, vC)
            + Vec2.dot(this.m_JvBD, vB) - Vec2.dot(this.m_JvBD, vD)
            + (this.m_JwA * wA - this.m_JwC * wC)
            + (this.m_JwB * wB - this.m_JwD * wD);

        const impulse = -this.m_mass * Cdot; // float
        this.m_impulse += impulse;

        vA.addMul(this.m_mA * impulse, this.m_JvAC);
        wA += this.m_iA * impulse * this.m_JwA;
        vB.addMul(this.m_mB * impulse, this.m_JvBD);
        wB += this.m_iB * impulse * this.m_JwB;
        vC.subMul(this.m_mC * impulse, this.m_JvAC);
        wC -= this.m_iC * impulse * this.m_JwC;
        vD.subMul(this.m_mD * impulse, this.m_JvBD);
        wD -= this.m_iD * impulse * this.m_JwD;

        // this.m_bodyA.c_velocity.v.copyFrom(vA);
        this.m_bodyA.c_velocity.w = wA;
        // this.m_bodyB.c_velocity.v.copyFrom(vB);
        this.m_bodyB.c_velocity.w = wB;
        // this.m_bodyC.c_velocity.v.copyFrom(vC);
        this.m_bodyC.c_velocity.w = wC;
        // this.m_bodyD.c_velocity.v.copyFrom(vD);
        this.m_bodyD.c_velocity.w = wD;
    }

    solvePositionConstraints(step: TimeStep) {
        const cA = this.m_bodyA.c_position.c;
        let aA = this.m_bodyA.c_position.a;
        const cB = this.m_bodyB.c_position.c;
        let aB = this.m_bodyB.c_position.a;
        const cC = this.m_bodyC.c_position.c;
        let aC = this.m_bodyC.c_position.a;
        const cD = this.m_bodyD.c_position.c;
        let aD = this.m_bodyD.c_position.a;

        const qA = Rot.forAngle(aA);
        const qB = Rot.forAngle(aB);
        const qC = Rot.forAngle(aC);
        const qD = Rot.forAngle(aD);

        const linearError = 0.0; // float

        let coordinateA, coordinateB; // float

        let JvAC, JvBD; // Vec2
        let JwA, JwB, JwC, JwD; // float
        let mass = 0.0; // float

        if (this.m_type1 === RevoluteJoint.TYPE) {
            JvAC = Vec2.zero();
            JwA = 1.0;
            JwC = 1.0;
            mass += this.m_iA + this.m_iC;

            coordinateA = aA - aC - this.m_referenceAngleA;
        } else {
            var u = Rot.mulVec2(qC, this.m_localAxisC); // Vec2
            var rC = Rot.mulSub(qC, this.m_localAnchorC, this.m_lcC); // Vec2
            var rA = Rot.mulSub(qA, this.m_localAnchorA, this.m_lcA); // Vec2
            JvAC = u;
            JwC = Vec2.cross(rC, u);
            JwA = Vec2.cross(rA, u);
            mass += this.m_mC + this.m_mA + this.m_iC * JwC * JwC + this.m_iA * JwA * JwA;

            var pC = Vec2.sub(this.m_localAnchorC, this.m_lcC); // Vec2
            var pA = Rot.mulTVec2(qC, Vec2.add(rA, Vec2.sub(cA, cC))); // Vec2
            coordinateA = Vec2.dot(Vec2.sub(pA, pC), this.m_localAxisC);
        }

        if (this.m_type2 === RevoluteJoint.TYPE) {
            JvBD = Vec2.zero();
            JwB = this.m_ratio;
            JwD = this.m_ratio;
            mass += this.m_ratio * this.m_ratio * (this.m_iB + this.m_iD);

            coordinateB = aB - aD - this.m_referenceAngleB;
        } else {
            var u = Rot.mulVec2(qD, this.m_localAxisD);
            var rD = Rot.mulSub(qD, this.m_localAnchorD, this.m_lcD);
            var rB = Rot.mulSub(qB, this.m_localAnchorB, this.m_lcB);
            JvBD = Vec2.mul(this.m_ratio, u);
            JwD = this.m_ratio * Vec2.cross(rD, u);
            JwB = this.m_ratio * Vec2.cross(rB, u);
            mass += this.m_ratio * this.m_ratio * (this.m_mD + this.m_mB) + this.m_iD
                * JwD * JwD + this.m_iB * JwB * JwB;

            var pD = Vec2.sub(this.m_localAnchorD, this.m_lcD); // Vec2
            var pB = Rot.mulTVec2(qD, Vec2.add(rB, Vec2.sub(cB, cD))); // Vec2
            coordinateB = Vec2.dot(pB, this.m_localAxisD)
                - Vec2.dot(pD, this.m_localAxisD);
        }

        const C = (coordinateA + this.m_ratio * coordinateB) - this.m_constant; // float

        let impulse = 0.0; // float
        if (mass > 0.0) {
            impulse = -C / mass;
        }

        cA.addMul(this.m_mA * impulse, JvAC);
        aA += this.m_iA * impulse * JwA;
        cB.addMul(this.m_mB * impulse, JvBD);
        aB += this.m_iB * impulse * JwB;
        cC.subMul(this.m_mC * impulse, JvAC);
        aC -= this.m_iC * impulse * JwC;
        cD.subMul(this.m_mD * impulse, JvBD);
        aD -= this.m_iD * impulse * JwD;

        // this.m_bodyA.c_position.c.copyFrom(cA);
        this.m_bodyA.c_position.a = aA;
        // this.m_bodyB.c_position.c.copyFrom(cB);
        this.m_bodyB.c_position.a = aB;
        // this.m_bodyC.c_position.c.copyFrom(cC);
        this.m_bodyC.c_position.a = aC;
        // this.m_bodyD.c_position.c.copyFrom(cD);
        this.m_bodyD.c_position.a = aD;

        // TODO_ERIN not implemented
        return linearError < Settings.linearSlop;
    }
}

