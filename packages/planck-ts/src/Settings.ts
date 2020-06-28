
// TODO merge with World options?

/**
 * Tuning constants based on meters-kilograms-seconds (MKS) units.
 */

// Collision
/**
 * The maximum number of contact points between two convex shapes. Do not change
 * this value.
 */
const maxManifoldPoints = 2;

/**
 * The maximum number of vertices on a convex polygon. You cannot increase this
 * too much because BlockAllocator has a maximum object size.
 */
const maxPolygonVertices = 12;

/**
 * This is used to fatten AABBs in the dynamic tree. This allows proxies to move
 * by a small amount without triggering a tree adjustment. This is in meters.
 */
const aabbExtension = 0.1;

/**
 * This is used to fatten AABBs in the dynamic tree. This is used to predict the
 * future position based on the current displacement. This is a dimensionless
 * multiplier.
 */
const aabbMultiplier = 2.0;

/**
 * A small length used as a collision and constraint tolerance. Usually it is
 * chosen to be numerically significant, but visually insignificant.
 */
const linearSlop = 0.005;
const linearSlopSquared = linearSlop * linearSlop;

/**
 * A small angle used as a collision and constraint tolerance. Usually it is
 * chosen to be numerically significant, but visually insignificant.
 */
const angularSlop = 2.0 / 180.0 * Math.PI;

/**
 * The radius of the polygon/edge shape skin. This should not be modified.
 * Making this smaller means polygons will have an insufficient buffer for
 * continuous collision. Making it larger may create artifacts for vertex
 * collision.
 */
const polygonRadius = 2.0 * linearSlop;

/**
 * Maximum number of sub-steps per contact in continuous physics simulation.
 */
const maxSubSteps = 8;

// Dynamics

/**
 * Maximum number of contacts to be handled to solve a TOI impact.
 */
const maxTOIContacts = 32;

/**
 * Maximum iterations to solve a TOI.
 */
const maxTOIIterations = 20;

/**
 * Maximum iterations to find Distance.
 */
const maxDistnceIterations = 20;

/**
 * A velocity threshold for elastic collisions. Any collision with a relative
 * linear velocity below this threshold will be treated as inelastic.
 */
const velocityThreshold = 1.0;

/**
 * The maximum linear position correction used when solving constraints. This
 * helps to prevent overshoot.
 */
const maxLinearCorrection = 0.2;

/**
 * The maximum angular position correction used when solving constraints. This
 * helps to prevent overshoot.
 */
const maxAngularCorrection = 8.0 / 180.0 * Math.PI;

/**
 * The maximum linear velocity of a body. This limit is very large and is used
 * to prevent numerical problems. You shouldn't need to adjust this.
 */
const maxTranslation = 2.0;
const maxTranslationSquared = maxTranslation * maxTranslation;

/**
 * The maximum angular velocity of a body. This limit is very large and is used
 * to prevent numerical problems. You shouldn't need to adjust this.
 */
const maxRotation = 0.5 * Math.PI;
const maxRotationSquared = maxRotation * maxRotation;

/**
 * This scale factor controls how fast overlap is resolved. Ideally this would
 * be 1 so that overlap is removed in one time step. However using values close
 * to 1 often lead to overshoot.
 */
const baumgarte = 0.2;
const toiBaugarte = 0.75;

// Sleep

/**
 * The time that a body must be still before it will go to sleep.
 */
const timeToSleep = 0.5;

/**
 * A body cannot sleep if its linear velocity is above this tolerance.
 */
const linearSleepTolerance = 0.01;

const linearSleepToleranceSqr = linearSleepTolerance * linearSleepTolerance;

/**
 * A body cannot sleep if its angular velocity is above this tolerance.
 */
const angularSleepTolerance = 2.0 / 180.0 * Math.PI;

const angularSleepToleranceSqr = angularSleepTolerance * angularSleepTolerance;

export let Settings = {
    maxManifoldPoints,
    maxPolygonVertices,
    aabbExtension,
    aabbMultiplier,

    linearSlop,
    linearSlopSquared,
    angularSlop,
    polygonRadius,

    maxSubSteps,
    maxTOIContacts,
    maxTOIIterations,
    maxDistnceIterations,
    velocityThreshold,
    maxLinearCorrection,
    maxAngularCorrection,
    maxTranslation,
    maxTranslationSquared,
    maxRotation,maxRotationSquared,
    baumgarte,
    toiBaugarte,

    timeToSleep,
    linearSleepTolerance,
    linearSleepToleranceSqr,
    angularSleepTolerance,
    angularSleepToleranceSqr
};


