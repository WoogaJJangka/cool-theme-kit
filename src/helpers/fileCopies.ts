import { readFile } from 'node:fs/promises';
import { writeFileAtomicAsync } from 'src/helpers/fsUtils';

/** A file of the theme made from another svg file */
export type FileCopy = {
  /** the svg file read */
  source: string;
  /** the file written, only when its content differs */
  target: string;
  /** the content written for the content read: the filters of the icons */
  change: (content: string) => string;
  /**
   * a source that cannot be read is skipped (a file of another theme, removed while the theme is generated: its icon
   * is missing, the rest of the theme works); otherwise the error stops the generation
   */
  optional?: boolean;
};

/**
 * How many files are read and written at the same time. The reads are mostly waiting (on Windows the antivirus reads
 * each file of another extension the first time), so a few at a time are several times faster than one by one.
 */
export const COPY_CONCURRENCY = 16;

/**
 * The icon files a theme generation writes, collected while the theme json is made and then copied together without
 * blocking the extension host. One by one with the synchronous file system, the first generation next to other icon
 * themes (thousands of their icons, plus the ones of this theme) froze every other extension for tens of seconds on
 * Windows ("Extension host is unresponsive").
 */
export class FileCopies {
  /** by target: a later copy to the same file replaces an earlier one, as writing it twice did */
  private readonly copies = new Map<string, FileCopy>();

  get size() {
    return this.copies.size;
  }

  add(copy: FileCopy) {
    this.copies.set(copy.target, copy);
  }

  /**
   * Copy the files, {@link COPY_CONCURRENCY} at a time. The first error stops the copies not started yet.
   * @returns how many files were written (the others already had their content)
   */
  async run(concurrency = COPY_CONCURRENCY): Promise<number> {
    const pending = [...this.copies.values()];
    this.copies.clear();
    let written = 0;
    let failed = false;

    const work = async () => {
      for (let copy = pending.pop(); copy && !failed; copy = pending.pop()) {
        try {
          if (await FileCopies.copy(copy)) written++;
        } catch (error) {
          failed = true;
          throw error;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, work));
    return written;
  }

  private static async copy({ change, optional, source, target }: FileCopy): Promise<boolean> {
    let content: string;
    try {
      content = await readFile(source, 'utf8');
    } catch (error) {
      if (optional) return false;
      throw error;
    }
    return writeFileAtomicAsync(target, change(content));
  }
}
