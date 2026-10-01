declare const brandKey: unique symbol;

export type Brand<T, B extends string> = T & { readonly [brandKey]: B };
