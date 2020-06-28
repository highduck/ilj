import {Joint, JointDef} from "../Joint";
import {assert} from "../util/common";
import {MathUtil} from "../common/Math";
import {Vec2} from "../common/Vec2";
import {Mat22} from "../common/Mat22";
import {Transform} from "../common/Transform";
import {Rot} from "../common/Rot";
import {TimeStep} from "../TimeStep";


/**
 * @typedef {Object} MouseJointDef
 *
 * Mouse joint definition. This requires a world target point, tuning
 * parameters, and the time step.
 *
 * @prop [maxForce = 0.0] The maximum constraint force that can be exerted to
 *       move the candidate body. Usually you will express as some multiple of
 *       the weight (multiplier * mass * gravity).
 * @prop [frequencyHz = 5.0] The response speed.
 * @prop [dampingRatio = 0.7] The damping ratio. 0 = no damping, 1 = critical
 *       damping.
 *
 * @prop {Vec2} target The initial world target point. This is assumed to
 *       coincide with the body anchor initially.
 */

export interface MouseJointDef extends JointDef {
    target: Vec2;
    maxForce?: number;// 0.0,
    frequencyHz?: number;// 5.0,
    dampingRatio?: number;// 0.7
}

/**
 * A mouse joint is used to make a point on a body track a specified world
 * point. This a soft constraint with a maximum force. This allows the
 * constraint to stretch and without applying huge forces.
 *
 * NOTE: this joint is not documented in the manual because it was developed to
 * be used in the testbed. If you want to learn how to use the mouse joint, look
 * at the testbed.
 *
 * @param {MouseJointDef} def
 * @param {Body} bodyA
 * @param {Body} bodyB
 */
export class MouseJoint extends Joint {
    static readonly TYPE = 'mouse-joint';

    m_targetA: Vec2;
    m_localAnchorB: Vec2;
    m_maxForce: number;
    m_frequencyHz: number;
    m_dampingRatio: number;

    m_impulse = Vec2.zero();
    m_beta = 0.0;
    m_gamma = 0.0;
    m_mass = Mat22.zero();

    // Solver temp
    m_rB = Vec2.zero();
    m_localCenterB = Vec2.zero();
    m_invMassB = 0.0;
    m_invIB = 0.0;
    m_C = Vec2.zero();


    constructor(def: MouseJointDef) {
        super(def, MouseJoint.TYPE);
        PLANCK_ASSERT && assert(def.maxForce && MathUtil.isFinite(def.maxForce) && def.maxForce >= 0.0);
        PLANCK_ASSERT && assert(def.frequencyHz && MathUtil.isFinite(def.frequencyHz) && def.frequencyHz >= 0.0);
        PLANCK_ASSERT && assert(def.dampingRatio && MathUtil.isFinite(def.dampingRatio) && def.dampingRatio >= 0.0);

        this.m_targetA = def.target ?? Vec2.zero();
        this.m_localAnchorB = Transform.mulTVec2(def.bodyB.getTransform(), this.m_targetA);
        this.m_maxForce = def.maxForce ?? 0;
        this.m_frequencyHz = def.frequencyHz ?? 5.0;
        this.m_dampingRatio = def.dampingRatio ?? 0.7;

        // p = attached point, m = mouse point
        // C = p - m
        // Cdot = v
        // = v + cross(w, r)
        // J = [I r_skew]
        // Identity used:
        // w k % (rx i + ry j) = w * (-ry i + rx j)
    }

    /**
     * Use this to update the target point.
     */
    setTarget(target: Vec2) {
        if (!this.m_bodyB.isAwake()) {
            this.m_bodyB.setAwake(true);
        }
        this.m_targetA = Vec2.clone(target);
    }

    getTarget() {
        return this.m_targetA;
    }

    /**
     * Set/get the maximum force in Newtons.
     */
    setMaxForce(force: number) {
        this.m_maxForce = force;
    }

    getMaxForce() {
        return this.m_maxForce;
    }

    /**
     * Set/get the frequency in Hertz.
     */
    setFrequency(hz: number) {
        this.m_frequencyHz = hz;
    }

    getFrequency() {
        return this.m_frequencyHz;
    }

    /**
     * Set/get the damping ratio (dimensionless).
     */
    setDampingRatio(ratio: number) {
        this.m_dampingRatio = ratio;
    }

    getDampingRatio(): number {
        return this.m_dampingRatio;
    }

    getAnchorA() {
        return Vec2.clone(this.m_targetA);
    }

    getAnchorB() {
        return this.m_bodyB.getWorldPoint(this.m_localAnchorB);
    }

    getReactionForce(inv_dt: number) {
        return Vec2.mul(inv_dt, this.m_impulse);
    }

    getReactionTorque(inv_dt: number) {
        return 0.0;
    }

    shiftOrigin(newOrigin: Vec2) {
        this.m_targetA.sub(newOrigin);
    }

    initVelocityConstraints(step: TimeStep) {
        this.m_localCenterB = this.m_bodyB.m_sweep.localCenter;
        this.m_invMassB = this.m_bodyB.m_invMass;
        this.m_invIB = this.m_bodyB.m_invI;

        const position = this.m_bodyB.c_position;
        const velocity = this.m_bodyB.c_velocity;

        const cB = position.c;
        const aB = position.a;
        const vB = velocity.v;
        let wB = velocity.w;

        const qB = Rot.forAngle(aB);

        const mass = this.m_bodyB.getMass();

        // Frequency
        const omega = 2.0 * Math.PI * this.m_frequencyHz;

        // Damping coefficient
        const d = 2.0 * mass * this.m_dampingRatio * omega;

        // Spring stiffness
        const k = mass * (omega * omega);

        // magic formulas
        // gamma has units of inverse mass.
        // beta has units of inverse time.
        const h = step.dt;
        PLANCK_ASSERT && assert(d + h * k > MathUtil.EPSILON);
        this.m_gamma = h * (d + h * k);
        if (this.m_gamma != 0.0) {
            this.m_gamma = 1.0 / this.m_gamma;
        }
        this.m_beta = h * k * this.m_gamma;

        // Compute the effective mass matrix.
        this.m_rB = Rot.mulVec2(qB, Vec2.sub(this.m_localAnchorB, this.m_localCenterB));

        // K = [(1/m1 + 1/m2) * eye(2) - skew(r1) * invI1 * skew(r1) - skew(r2) *
        // invI2 * skew(r2)]
        // = [1/m1+1/m2 0 ] + invI1 * [r1.y*r1.y -r1.x*r1.y] + invI2 * [r1.y*r1.y
        // -r1.x*r1.y]
        // [ 0 1/m1+1/m2] [-r1.x*r1.y r1.x*r1.x] [-r1.x*r1.y r1.x*r1.x]

        // TODO: reuse m_mass object!!
        const b_c = -this.m_invIB * this.m_rB.x * this.m_rB.y;
        const K = new Mat22(
            this.m_invMassB + this.m_invIB * this.m_rB.y * this.m_rB.y + this.m_gamma,
            b_c, b_c,
            this.m_invMassB + this.m_invIB * this.m_rB.x * this.m_rB.x + this.m_gamma
        );

        this.m_mass = K.getInverse();

        this.m_C.copyFrom(cB);
        this.m_C.addCombine(1, this.m_rB, -1, this.m_targetA);
        this.m_C.mul(this.m_beta);

        // Cheat with some damping
        wB *= 0.98;

        if (step.warmStarting) {
            this.m_impulse.mul(step.dtRatio);
            vB.addMul(this.m_invMassB, this.m_impulse);
            wB += this.m_invIB * Vec2.cross(this.m_rB, this.m_impulse);

        } else {
            this.m_impulse.setZero();
        }

        // velocity.v.set(vB);
        velocity.w = wB;
    }

    solveVelocityConstraints(step: TimeStep) {
        const velocity = this.m_bodyB.c_velocity;
        const vB = velocity.v;
        let wB = velocity.w;

        // Cdot = v + cross(w, r)

        const Cdot = Vec2.crossSV(wB, this.m_rB);
        Cdot.add(vB);

        Cdot.addCombine(1, this.m_C, this.m_gamma, this.m_impulse);
        Cdot.neg();

        let impulse = Mat22.mulVec2(this.m_mass, Cdot);

        const oldImpulse = Vec2.clone(this.m_impulse);
        this.m_impulse.add(impulse);
        const maxImpulse = step.dt * this.m_maxForce;
        this.m_impulse.clamp(maxImpulse);
        impulse = Vec2.sub(this.m_impulse, oldImpulse);

        vB.addMul(this.m_invMassB, impulse);
        wB += this.m_invIB * Vec2.cross(this.m_rB, impulse);

        // velocity.v.copyFrom(vB);
        velocity.w = wB;
    }

    solvePositionConstraints(step: TimeStep) {
        return true;
    }
}