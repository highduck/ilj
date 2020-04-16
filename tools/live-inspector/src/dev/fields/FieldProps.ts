export interface FieldProps<T> {
    label?: string,
    tag?: string,
    target: object,
    field: string
}

export const fieldValue = <T>(props: FieldProps<T>, val?: T): T => {
    if (val !== undefined) {
        (props.target as any)[props.field] = val;
    } else {
        val = (props.target as any)[props.field] as T;
    }
    return val;
};

export const fieldLabel = <T>(props: FieldProps<T>): string => {
    return props.label ?? props.field;
};

export const fieldTag = <T>(props: FieldProps<T>): string => {
    return props.tag ?? "";
};