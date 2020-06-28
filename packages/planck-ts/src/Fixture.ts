import {AABB} from "./collision/AABB";
import {Vec2} from "./common/Vec2";
import {Shape} from "./Shape";
import {Body} from "./Body";
import {assert} from "./util/common";
import {MathUtil} from "./common/Math";
import {RayCastInput, RayCastOutput} from "./collision/RayCastOptions";
import {BroadPhase} from "./collision/BroadPhase";
import {MassData} from "./MassData";
import {Transform} from "./common/Transform";

export interface FilterData {
    groupIndex: number;
    categoryBits: number;
    maskBits: number;
}

/**
 * @typedef {Object} FixtureDef
 *
 * A fixture definition is used to create a fixture. This class defines an
 * abstract fixture definition. You can reuse fixture definitions safely.
 *
 * @prop friction The friction coefficient, usually in the range [0,1]
 * @prop restitution The restitution (elasticity) usually in the range [0,1]
 * @prop density The density, usually in kg/m^2
 * @prop isSensor A sensor shape collects contact information but never
 *       generates a collision response
 * @prop userData
 * @prop filterGroupIndex Zero, positive or negative collision group. Fixtures with same positive groupIndex always collide and fixtures with same
 * negative groupIndex never collide.
 * @prop filterCategoryBits Collision category bit or bits that this fixture belongs
 *       to. If groupIndex is zero or not matching, then at least one bit in this fixture
 * categoryBits should match other fixture maskBits and vice versa.
 * @prop filterMaskBits Collision category bit or bits that this fixture accept for
 *       collision.
 */
export interface FixtureDef {
    userData?: any;
    friction?: number; // 0.2
    restitution?: number; // 0
    density?: number; // 0
    isSensor?: boolean; // false

    filterGroupIndex?: number; // 0
    filterCategoryBits?: number; // 1
    filterMaskBits?: number; // 0xFFFF
}

/**
 * This proxy is used internally to connect shape children to the broad-phase.
 */
export class FixtureProxy {
    readonly aabb = new AABB();
    proxyId = 0;

    constructor(readonly fixture: Fixture,
                readonly childIndex: number) {
    }
}

const TMP_AABB_0 = new AABB();
const TMP_AABB_1 = new AABB();

/**
 * A fixture is used to attach a shape to a body for collision detection. A
 * fixture inherits its transform from its parent. Fixtures hold additional
 * non-geometric data such as friction, collision filters, etc. Fixtures are
 * created via Body.createFixture.
 *
 * @param {Body} body
 * @param {Shape|FixtureDef} shape Shape of fixture definition.
 * @param {FixtureDef|number} def Fixture definition or number.
 */
export class Fixture {

    m_body: Body;
    m_userData: any;
    m_friction: number;
    m_restitution: number;
    m_density: number;
    m_isSensor: boolean;
    m_filterGroupIndex: number;
    m_filterCategoryBits: number;
    m_filterMaskBits: number;
    m_shape: Shape;

    m_next: Fixture | null = null;
    m_proxies: FixtureProxy[] = [];
    m_proxyCount = 0;

    constructor(body: Body, shape: Shape, def: FixtureDef) {
        this.m_body = body;

        this.m_friction = def.friction ?? 0.2;
        this.m_restitution = def.restitution ?? 0;
        this.m_density = def.density ?? 0;
        this.m_isSensor = !!def.isSensor;

        this.m_filterGroupIndex = def.filterGroupIndex ?? 0;
        this.m_filterCategoryBits = def.filterCategoryBits ?? 1;
        this.m_filterMaskBits = def.filterMaskBits ?? 0xFFFF;

        // TODO validate shape
        this.m_shape = shape; //.clone();

        const childCount = this.m_shape.getChildCount();
        for (let i = 0; i < childCount; ++i) {
            this.m_proxies[i] = new FixtureProxy(this, i);
        }

        this.m_userData = def.userData;
    }

    /**
     * Re-setup fixture.
     * @private
     */

    _reset() {
        const body = this.getBody();
        const broadPhase = body.m_world.m_broadPhase;
        this.destroyProxies(broadPhase);
        if (this.m_shape._reset) {
            this.m_shape._reset();
        }
        const childCount = this.m_shape.getChildCount();
        for (let i = 0; i < childCount; ++i) {
            this.m_proxies[i] = new FixtureProxy(this, i);
        }
        this.createProxies(broadPhase, body.m_xf);
        body.resetMassData();
    }


    // _serialize() {
    //     return {
    //         friction: this.m_friction,
    //         restitution: this.m_restitution,
    //         density: this.m_density,
    //         isSensor: this.m_isSensor,
    //
    //         filterGroupIndex: this.m_filterGroupIndex,
    //         filterCategoryBits: this.m_filterCategoryBits,
    //         filterMaskBits: this.m_filterMaskBits,
    //
    //         shape: this.m_shape,
    //     };
    // }
    //
    // static _deserialize(data, body, restore) {
    //     const shape = restore(Shape, data.shape);
    //     const fixture = shape && new Fixture(body, shape, data);
    //     return fixture;
    // }

    /**
     * Get the type of the child shape. You can use this to down cast to the
     * concrete shape.
     */
    getType() {
        return this.m_shape.getType();
    }

    /**
     * Get the child shape. You can modify the child shape, however you should not
     * change the number of vertices because this will crash some collision caching
     * mechanisms. Manipulating the shape may lead to non-physical behavior.
     */

    getShape(): Shape {
        return this.m_shape;
    }

    /**
     * A sensor shape collects contact information but never generates a collision
     * response.
     */

    isSensor() {
        return this.m_isSensor;
    }

    /**
     * Set if this fixture is a sensor.
     */

    setSensor(sensor: boolean) {
        if (sensor !== this.m_isSensor) {
            this.m_body.setAwake(true);
            this.m_isSensor = sensor;
        }
    }

    /**
     * Get the contact filtering data.
     */
// getFilterData() {
//   return this.m_filter;
// }

    /**
     * Get the user data that was assigned in the fixture definition. Use this to
     * store your application specific data.
     */
    getUserData() {
        return this.m_userData;
    }

    /**
     * Set the user data. Use this to store your application specific data.
     */
    setUserData(data: any) {
        this.m_userData = data;
    }

    /**
     * Get the parent body of this fixture. This is null if the fixture is not
     * attached.
     */

    getBody() {
        return this.m_body;
    }

    /**
     * Get the next fixture in the parent body's fixture list.
     */
    getNext() {
        return this.m_next;
    }

    /**
     * Get the density of this fixture.
     */
    getDensity() {
        return this.m_density;
    }

    /**
     * Set the density of this fixture. This will _not_ automatically adjust the
     * mass of the body. You must call Body.resetMassData to update the body's mass.
     */
    setDensity(density: number) {
        PLANCK_ASSERT && assert(MathUtil.isFinite(density) && density >= 0.0);
        this.m_density = density;
    }

    /**
     * Get the coefficient of friction, usually in the range [0,1].
     */
    getFriction() {
        return this.m_friction;
    }

    /**
     * Set the coefficient of friction. This will not change the friction of
     * existing contacts.
     */

    setFriction(friction: number) {
        this.m_friction = friction;
    }

    /**
     * Get the coefficient of restitution.
     */
    getRestitution() {
        return this.m_restitution;
    }

    /**
     * Set the coefficient of restitution. This will not change the restitution of
     * existing contacts.
     */
    setRestitution(restitution: number) {
        this.m_restitution = restitution;
    }

    /**
     * Test a point in world coordinates for containment in this fixture.
     */

    testPoint(p: Vec2) {
        return this.m_shape.testPoint(this.m_body.getTransform(), p);
    }

    /**
     * Cast a ray against this shape.
     */

    rayCast(output: RayCastOutput, input: RayCastInput, childIndex: number): boolean {
        return this.m_shape.rayCast(output, input, this.m_body.getTransform(), childIndex);
    }

    /**
     * Get the mass data for this fixture. The mass data is based on the density and
     * the shape. The rotational inertia is about the shape's origin. This operation
     * may be expensive.
     */
    getMassData(massData: MassData) {
        this.m_shape.computeMass(massData, this.m_density);
    }

    /**
     * Get the fixture's AABB. This AABB may be enlarge and/or stale. If you need a
     * more accurate AABB, compute it using the shape and the body transform.
     */
    getAABB(childIndex: number): AABB {
        PLANCK_ASSERT && assert(0 <= childIndex && childIndex < this.m_proxyCount);
        return this.m_proxies[childIndex].aabb;
    }

    /**
     * These support body activation/deactivation.
     */
    createProxies(broadPhase: BroadPhase, xf: Transform) {
        PLANCK_ASSERT && assert(this.m_proxyCount === 0);

        // Create proxies in the broad-phase.
        this.m_proxyCount = this.m_shape.getChildCount();
        for (let i = 0; i < this.m_proxyCount; ++i) {
            const proxy = this.m_proxies[i];
            this.m_shape.computeAABB(proxy.aabb, xf, i);
            proxy.proxyId = broadPhase.createProxy(proxy.aabb, proxy);
        }
    }

    destroyProxies(broadPhase: BroadPhase) {
        // Destroy proxies in the broad-phase.
        for (let i = 0; i < this.m_proxyCount; ++i) {
            const proxy = this.m_proxies[i];
            broadPhase.destroyProxy(proxy.proxyId);
            proxy.proxyId = -1;
        }

        this.m_proxyCount = 0;
    }

    /**
     * Updates this fixture proxy in broad-phase (with combined AABB of current and
     * next transformation).
     */
    synchronize(broadPhase: BroadPhase, xf1: Transform, xf2: Transform) {
        for (let i = 0; i < this.m_proxyCount; ++i) {
            const proxy = this.m_proxies[i];
            // Compute an AABB that covers the swept shape (may miss some rotation
            // effect).
            this.m_shape.computeAABB(TMP_AABB_0, xf1, proxy.childIndex);
            this.m_shape.computeAABB(TMP_AABB_1, xf2, proxy.childIndex);

            proxy.aabb.combine(TMP_AABB_0, TMP_AABB_1);

            const displacement = Vec2.sub(xf2.p, xf1.p);

            broadPhase.moveProxy(proxy.proxyId, proxy.aabb, displacement);
        }
    }

    /**
     * Set the contact filtering data. This will not update contacts until the next
     * time step when either parent body is active and awake. This automatically
     * calls refilter.
     */
    setFilterData(filter: FilterData) {
        this.m_filterGroupIndex = filter.groupIndex;
        this.m_filterCategoryBits = filter.categoryBits;
        this.m_filterMaskBits = filter.maskBits;
        this.refilter();
    }


    getFilterGroupIndex() {
        return this.m_filterGroupIndex;
    }

    getFilterCategoryBits() {
        return this.m_filterCategoryBits;
    }

    getFilterMaskBits() {
        return this.m_filterMaskBits;
    }

    /**
     * Call this if you want to establish collision that was previously disabled by
     * ContactFilter.
     */
    refilter() {
        if (this.m_body == null) {
            return;
        }

        // Flag associated contacts for filtering.
        let edge = this.m_body.getContactList();
        while (edge) {
            const contact = edge.contact;
            const fixtureA = contact.getFixtureA();
            const fixtureB = contact.getFixtureB();
            if (fixtureA === this || fixtureB === this) {
                contact.flagForFiltering();
            }

            edge = edge.next;
        }

        const world = this.m_body.getWorld();

        if (world == null) {
            return;
        }

        // Touch each proxy so that new pairs may be created
        const broadPhase = world.m_broadPhase;
        for (let i = 0; i < this.m_proxyCount; ++i) {
            broadPhase.touchProxy(this.m_proxies[i].proxyId);
        }
    }

    /**
     * Implement this method to provide collision filtering, if you want finer
     * control over contact creation.
     *
     * Return true if contact calculations should be performed between these two
     * fixtures.
     *
     * Warning: for performance reasons this is only called when the AABBs begin to
     * overlap.
     *
     * @param {Fixture} fixtureA
     * @param {Fixture} fixtureB
     */
    shouldCollide(that: Fixture) {
        if (that.m_filterGroupIndex === this.m_filterGroupIndex && that.m_filterGroupIndex !== 0) {
            return that.m_filterGroupIndex > 0;
        }

        const collide = (that.m_filterMaskBits & this.m_filterCategoryBits) !== 0
            && (that.m_filterCategoryBits & this.m_filterMaskBits) !== 0;
        return collide;
    }
}
