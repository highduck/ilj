export function assert(statement: any, err?: any, log?: any) {
    if (!PLANCK_ASSERT) return;
    if (statement) return;
    log && console.log(log);
    throw new Error(err);
}