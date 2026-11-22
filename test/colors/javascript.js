// 한글 주석
import { join } from 'node:path';

/** Doc comment */
export class Runner {
  static LIMIT = 3;
  label = 'runner';

  run(input) {
    const pattern = /a+b/g;
    console.log(pattern, join('a', 'b'));
    return `${this.label}: ${input}`;
  }
}
