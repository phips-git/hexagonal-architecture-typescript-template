export const createEnumValidator = <T extends Record<string, string>>(
  enumObj: T
) => {
  const validValues = Object.values(enumObj);
  return (value: unknown): value is T[keyof T] =>
    validValues.includes(value as string);
};
