import {Joint, JointDef, JointType} from "../Joint";
import {Settings} from "../Settings";
import {Vec2} from "../common/Vec2";
import {Rot} from "../common/Rot";
import {Body} from "../Body";
import {MathUtil} from "../common/Math";
import {TimeStep} from "../TimeStep";

/**
 * @typedef {Object} WheelJointDef
 *
 * Wheel joint definition. This requires defining a line of motion using an axis
 * and an anchor point. The definition uses local anchor points and a local axis
 * so that the initial configuration can violate the constraint slightly. The
 * joint translation is zero when the local anchor points coincide in world
 * space. Using local anchors and a local axis helps when saving and loading a
 * game.
 *
 * @prop {boolean} enableMotor Enable/disable the joint motor.
 * @prop {float} maxMotorTorque The maximum motor torque, usually in N-m.
 * @prop {float} motorSpeed The desired motor speed in radians per second.
 * @prop {float} frequencyHz Suspension frequency, zero indicates no suspension.
 * @prop {float} dampingRatio Suspension damping ratio, one indicates critical
 *       damping.
 *
 * @prop {Vec2} localAnchorA The local anchor point relative to bodyA's origin.
 * @prop {Vec2} localAnchorB The local anchor point relative to bodyB's origin.
 * @prop {Vec2} localAxisA The local translation axis in bodyA.
 */
export interface WheelJointDef extends JointDef {
    localAnchorA?: Vec2;
    localAnchorB?: Vec2;
    anchor?: Vec2;
    anchorA?: Vec2;
    anchorB?: Vec2;
    localAxisA?: Vec2;
    axis?: Vec2;

    enableMotor?: boolean; // false,
    maxMotorTorque?: number;// 0.0,
    motorSpeed?: number;// 0.0,
    frequencyHz?: number;//2.0,
    dampingRatio?: number;// 0.7,
}

export class WheelJoint extends Joint {
    static readonly TYPE: JointType = 'wheel-joint';

    readonly m_localAnchorA: Vec2;
    readonly m_localAnchorB: Vec2;
    readonly m_localXAxisA: Vec2;
    readonly m_localYAxisA: Vec2;

    m_mass = 0.0;
    m_impulse = 0.0;
    m_motorMass = 0.0;
    m_motorImpulse = 0.0;
    m_springMass = 0.0;
    m_springImpulse = 0.0;

    m_maxMotorTorque: number;
    m_motorSpeed: number;
    m_frequencyHz: number;
    m_dampingRatio: number;
    m_enableMotor: boolean;

    m_bias = 0.0;
    m_gamma = 0.0;

    // Solver temp
    m_localCenterA = Vec2.zero();
    m_localCenterB = Vec2.zero();
    m_invMassA = 0;
    m_invMassB = 0;
    m_invIA = 0;
    m_invIB = 0;

    m_ax = Vec2.zero(); // todo: readonly
    m_ay = Vec2.zero(); // todo: readonly
    m_sAx = 0;
    m_sBx = 0;
    m_sAy = 0;
    m_sBy = 0;


    /**
     * A wheel joint. This joint provides two degrees of freedom: translation along
     * an axis fixed in bodyA and rotation in the plane. In other words, it is a
     * point to line constraint with a rotational motor and a linear spring/damper.
     * This joint is designed for vehicle suspensions.
     *
     * @param {WheelJointDef} def
     */
    constructor(def: WheelJointDef) {
        super(def, WheelJoint.TYPE);
        this.m_localAnchorA = Vec2.clone(def.anchor ? def.bodyA.getLocalPoint(def.anchor) : def.localAnchorA || Vec2.zero());
        this.m_localAnchorB = Vec2.clone(def.anchor ? def.bodyB.getLocalPoint(def.anchor) : def.localAnchorB || Vec2.zero());
        this.m_localXAxisA = Vec2.clone(def.axis ? def.bodyA.getLocalVector(def.axis) : def.localAxisA || new Vec2(1, 0));
        this.m_localYAxisA = Vec2.crossSV(1.0, this.m_localXAxisA);

        this.m_maxMotorTorque = def.maxMotorTorque ?? 0;
        this.m_motorSpeed = def.motorSpeed ?? 0;
        this.m_enableMotor = !!def.enableMotor;
        this.m_frequencyHz = def.frequencyHz ?? 2;
        this.m_dampingRatio = def.dampingRatio ?? 0.7;

        // Linear constraint (point-to-line)
        // d = pB - pA = xB + rB - xA - rA
        // C = dot(ay, d)
        // Cdot = dot(d, cross(wA, ay)) + dot(ay, vB + cross(wB, rB) - vA - cross(wA,
        // rA))
        // = -dot(ay, vA) - dot(cross(d + rA, ay), wA) + dot(ay, vB) + dot(cross(rB,
        // ay), vB)
        // J = [-ay, -cross(d + rA, ay), ay, cross(rB, ay)]

        // Spring linear constraint
        // C = dot(ax, d)
        // Cdot = = -dot(ax, vA) - dot(cross(d + rA, ax), wA) + dot(ax, vB) +
        // dot(cross(rB, ax), vB)
        // J = [-ax -cross(d+rA, ax) ax cross(rB, ax)]

        // Motor rotational constraint
        // Cdot = wB - wA
        // J = [0 0 -1 0 0 1]
    }

    // _serialize() {
    //     return {
    //         type: this.m_type,
    //         bodyA: this.m_bodyA,
    //         bodyB: this.m_bodyB,
    //         collideConnected: this.m_collideConnected,
    //
    //         enableMotor: this.m_enableMotor,
    //         maxMotorTorque: this.m_maxMotorTorque,
    //         motorSpeed: this.m_motorSpeed,
    //         frequencyHz: this.m_frequencyHz,
    //         dampingRatio: this.m_dampingRatio,
    //
    //         localAnchorA: this.m_localAnchorA,
    //         localAnchorB: this.m_localAnchorB,
    //         localAxisA: this.m_localXAxisA,
    //     };
    // }
    //
    // static _deserialize(data, world, restore) {
    //     data.bodyA = restore(Body, data.bodyA, world);
    //     data.bodyB = restore(Body, data.bodyB, world);
    //     const joint = new WheelJoint(data);
    //     return joint;
    // }

    /**
     * @internal
     */
    _setAnchors(def: WheelJointDef) {
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

        if (def.localAxisA) {
            this.m_localXAxisA.copyFrom(def.localAxisA);
            this.m_localYAxisA.copyFrom(Vec2.crossSV(1.0, def.localAxisA));
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
     * The local joint axis relative to bodyA.
     */
    getLocalAxisA() {
        return this.m_localXAxisA;
    }

    /**
     * Get the current joint translation, usually in meters.
     */
    getJointTranslation() {
        const bA = this.m_bodyA;
        const bB = this.m_bodyB;

        const pA = bA.getWorldPoint(this.m_localAnchorA); // Vec2
        const pB = bB.getWorldPoint(this.m_localAnchorB); // Vec2
        const d = Vec2.sub(pB, pA); // Vec2
        const axis = bA.getWorldVector(this.m_localXAxisA); // Vec2

        const translation = Vec2.dot(d, axis); // float
        return translation;
    }

    /**
     * Get the current joint translation speed, usually in meters per second.
     */
    getJointSpeed() {
        const wA = this.m_bodyA.m_angularVelocity;
        const wB = this.m_bodyB.m_angularVelocity;
        return wB - wA;
    }

    /**
     * Is the joint motor enabled?
     */
    isMotorEnabled() {
        return this.m_enableMotor;
    }

    /**
     * Enable/disable the joint motor.
     */
    enableMotor(flag: boolean) {
        this.m_bodyA.setAwake(true);
        this.m_bodyB.setAwake(true);
        this.m_enableMotor = flag;
    }

    /**
     * Set the motor speed, usually in radians per second.
     */
    setMotorSpeed(speed: number) {
        this.m_bodyA.setAwake(true);
        this.m_bodyB.setAwake(true);
        this.m_motorSpeed = speed;
    }

    /**
     * Get the motor speed, usually in radians per second.
     */
    getMotorSpeed() {
        return this.m_motorSpeed;
    }

    /**
     * Set/Get the maximum motor force, usually in N-m.
     */
    setMaxMotorTorque(torque: number) {
        this.m_bodyA.setAwake(true);
        this.m_bodyB.setAwake(true);
        this.m_maxMotorTorque = torque;
    }

    getMaxMotorTorque() {
        return this.m_maxMotorTorque;
    }

    /**
     * Get the current motor torque given the inverse time step, usually in N-m.
     */
    getMotorTorque(inv_dt: number) {
        return inv_dt * this.m_motorImpulse;
    }

    /**
     * Set/Get the spring frequency in hertz. Setting the frequency to zero disables
     * the spring.
     */
    setSpringFrequencyHz(hz: number) {
        this.m_frequencyHz = hz;
    }

    getSpringFrequencyHz() {
        return this.m_frequencyHz;
    }

    /**
     * Set/Get the spring damping ratio
     */
    setSpringDampingRatio(ratio: number) {
        this.m_dampingRatio = ratio;
    }

    getSpringDampingRatio() {
        return this.m_dampingRatio;
    }

    getAnchorA() {
        return this.m_bodyA.getWorldPoint(this.m_localAnchorA);
    }

    getAnchorB() {
        return this.m_bodyB.getWorldPoint(this.m_localAnchorB);
    }

    getReactionForce(inv_dt: number) {
        return Vec2.combine(this.m_impulse, this.m_ay, this.m_springImpulse, this.m_ax).mul(inv_dt);
    }

    getReactionTorque(inv_dt: number) {
        return inv_dt * this.m_motorImpulse;
    }

    initVelocityConstraints(step: TimeStep) {
        this.m_localCenterA = this.m_bodyA.m_sweep.localCenter;
        this.m_localCenterB = this.m_bodyB.m_sweep.localCenter;
        this.m_invMassA = this.m_bodyA.m_invMass;
        this.m_invMassB = this.m_bodyB.m_invMass;
        this.m_invIA = this.m_bodyA.m_invI;
        this.m_invIB = this.m_bodyB.m_invI;

        const mA = this.m_invMassA;
        const mB = this.m_invMassB; // float
        const iA = this.m_invIA;
        const iB = this.m_invIB; // float

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

        // Compute the effective masses.
        const rA = Rot.mulVec2(qA, Vec2.sub(this.m_localAnchorA, this.m_localCenterA));
        const rB = Rot.mulVec2(qB, Vec2.sub(this.m_localAnchorB, this.m_localCenterB));
        const d = Vec2.zero();
        d.addCombine(1, cB, 1, rB);
        d.subCombine(1, cA, 1, rA); // Vec2

        // Point to line constraint
        {
            this.m_ay = Rot.mulVec2(qA, this.m_localYAxisA);
            this.m_sAy = Vec2.cross(Vec2.add(d, rA), this.m_ay);
            this.m_sBy = Vec2.cross(rB, this.m_ay);

            this.m_mass = mA + mB + iA * this.m_sAy * this.m_sAy + iB * this.m_sBy * this.m_sBy;

            if (this.m_mass > 0.0) {
                this.m_mass = 1.0 / this.m_mass;
            }
        }

        // Spring constraint
        this.m_springMass = 0.0;
        this.m_bias = 0.0;
        this.m_gamma = 0.0;
        if (this.m_frequencyHz > 0.0) {
            this.m_ax = Rot.mulVec2(qA, this.m_localXAxisA);
            this.m_sAx = Vec2.cross(Vec2.add(d, rA), this.m_ax);
            this.m_sBx = Vec2.cross(rB, this.m_ax);

            const invMass = mA + mB + iA * this.m_sAx * this.m_sAx + iB * this.m_sBx * this.m_sBx;

            if (invMass > 0.0) {
                this.m_springMass = 1.0 / invMass;

                const C = Vec2.dot(d, this.m_ax); // float

                // Frequency
                const omega = 2.0 * Math.PI * this.m_frequencyHz; // float

                // Damping coefficient
                const D = 2.0 * this.m_springMass * this.m_dampingRatio * omega; // float

                // Spring stiffness
                const k = this.m_springMass * omega * omega; // float

                // magic formulas
                const h = step.dt; // float
                this.m_gamma = h * (D + h * k);
                if (this.m_gamma > 0.0) {
                    this.m_gamma = 1.0 / this.m_gamma;
                }

                this.m_bias = C * h * k * this.m_gamma;

                this.m_springMass = invMass + this.m_gamma;
                if (this.m_springMass > 0.0) {
                    this.m_springMass = 1.0 / this.m_springMass;
                }
            }
        } else {
            this.m_springImpulse = 0.0;
        }

        // Rotational motor
        if (this.m_enableMotor) {
            this.m_motorMass = iA + iB;
            if (this.m_motorMass > 0.0) {
                this.m_motorMass = 1.0 / this.m_motorMass;
            }
        } else {
            this.m_motorMass = 0.0;
            this.m_motorImpulse = 0.0;
        }

        if (step.warmStarting) {
            // Account for variable time step.
            this.m_impulse *= step.dtRatio;
            this.m_springImpulse *= step.dtRatio;
            this.m_motorImpulse *= step.dtRatio;

            const P = Vec2.combine(this.m_impulse, this.m_ay, this.m_springImpulse, this.m_ax);
            const LA = this.m_impulse * this.m_sAy + this.m_springImpulse * this.m_sAx + this.m_motorImpulse;
            const LB = this.m_impulse * this.m_sBy + this.m_springImpulse * this.m_sBx + this.m_motorImpulse;

            vA.subMul(this.m_invMassA, P);
            wA -= this.m_invIA * LA;

            vB.addMul(this.m_invMassB, P);
            wB += this.m_invIB * LB;

        } else {
            this.m_impulse = 0.0;
            this.m_springImpulse = 0.0;
            this.m_motorImpulse = 0.0;
        }

        // this.m_bodyA.c_velocity.v.set(vA);
        this.m_bodyA.c_velocity.w = wA;
        // this.m_bodyB.c_velocity.v.set(vB);
        this.m_bodyB.c_velocity.w = wB;
    }

    solveVelocityConstraints(step: TimeStep) {
        const mA = this.m_invMassA;
        const mB = this.m_invMassB; // float
        const iA = this.m_invIA;
        const iB = this.m_invIB; // float

        const vA = this.m_bodyA.c_velocity.v;
        let wA = this.m_bodyA.c_velocity.w;
        const vB = this.m_bodyB.c_velocity.v;
        let wB = this.m_bodyB.c_velocity.w;

        // Solve spring constraint
        {
            const Cdot = Vec2.dot(this.m_ax, vB) - Vec2.dot(this.m_ax, vA) + this.m_sBx
                * wB - this.m_sAx * wA; // float
            const impulse = -this.m_springMass
                * (Cdot + this.m_bias + this.m_gamma * this.m_springImpulse); // float
            this.m_springImpulse += impulse;

            const P = Vec2.mul(impulse, this.m_ax); // Vec2
            const LA = impulse * this.m_sAx; // float
            const LB = impulse * this.m_sBx; // float

            vA.subMul(mA, P);
            wA -= iA * LA;

            vB.addMul(mB, P);
            wB += iB * LB;
        }

        // Solve rotational motor constraint
        {
            const Cdot = wB - wA - this.m_motorSpeed; // float
            let impulse = -this.m_motorMass * Cdot; // float

            const oldImpulse = this.m_motorImpulse; // float
            const maxImpulse = step.dt * this.m_maxMotorTorque; // float
            this.m_motorImpulse = MathUtil.clamp(this.m_motorImpulse + impulse,
                -maxImpulse, maxImpulse);
            impulse = this.m_motorImpulse - oldImpulse;

            wA -= iA * impulse;
            wB += iB * impulse;
        }

        // Solve point to line constraint
        {
            const Cdot = Vec2.dot(this.m_ay, vB) - Vec2.dot(this.m_ay, vA) + this.m_sBy
                * wB - this.m_sAy * wA; // float
            const impulse = -this.m_mass * Cdot; // float
            this.m_impulse += impulse;

            const P = Vec2.mul(impulse, this.m_ay); // Vec2
            const LA = impulse * this.m_sAy; // float
            const LB = impulse * this.m_sBy; // float

            vA.subMul(mA, P);
            wA -= iA * LA;

            vB.addMul(mB, P);
            wB += iB * LB;
        }

        // this.m_bodyA.c_velocity.v.set(vA);
        this.m_bodyA.c_velocity.w = wA;
        // this.m_bodyB.c_velocity.v.set(vB);
        this.m_bodyB.c_velocity.w = wB;
    }

    solvePositionConstraints(step: TimeStep) {
        const cA = this.m_bodyA.c_position.c;
        let aA = this.m_bodyA.c_position.a;
        const cB = this.m_bodyB.c_position.c;
        let aB = this.m_bodyB.c_position.a;

        const qA = Rot.forAngle(aA);
        const qB = Rot.forAngle(aB);

        const rA = Rot.mulVec2(qA, Vec2.sub(this.m_localAnchorA, this.m_localCenterA));
        const rB = Rot.mulVec2(qB, Vec2.sub(this.m_localAnchorB, this.m_localCenterB));
        const d = Vec2.zero();
        d.addCombine(1, cB, 1, rB);
        d.subCombine(1, cA, 1, rA);

        const ay = Rot.mulVec2(qA, this.m_localYAxisA);

        const sAy = Vec2.cross(Vec2.add(d, rA), ay); // float
        const sBy = Vec2.cross(rB, ay); // float

        const C = Vec2.dot(d, ay); // float

        const k = this.m_invMassA + this.m_invMassB + this.m_invIA * this.m_sAy
            * this.m_sAy + this.m_invIB * this.m_sBy * this.m_sBy; // float

        let impulse; // float
        if (k != 0.0) {
            impulse = -C / k;
        } else {
            impulse = 0.0;
        }

        const P = Vec2.mul(impulse, ay); // Vec2
        const LA = impulse * sAy; // float
        const LB = impulse * sBy; // float

        cA.subMul(this.m_invMassA, P);
        aA -= this.m_invIA * LA;
        cB.addMul(this.m_invMassB, P);
        aB += this.m_invIB * LB;

        // this.m_bodyA.c_position.c.set(cA);
        this.m_bodyA.c_position.a = aA;
        // this.m_bodyB.c_position.c.set(cB);
        this.m_bodyB.c_position.a = aB;

        return Math.abs(C) <= Settings.linearSlop;
    }
}

Joint.TYPES[WheelJoint.TYPE] = WheelJoint;