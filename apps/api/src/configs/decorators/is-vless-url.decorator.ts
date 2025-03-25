import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsVlessUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsVlessUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const regex = /^vless:\/\/([a-f0-9-]{36})@([\w.-]+):(\d+)(\?.*)?$/;
          return regex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid VLESS URL`;
        }
      }
    });
  };
}
