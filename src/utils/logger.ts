import chalk from "chalk";

export const logger = (...rest: [string, ...any[]]) =>
  console.log(chalk.magentaBright(rest[0]), ...rest.slice(1));
