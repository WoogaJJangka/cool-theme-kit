import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

let counter = 0;

/** Whether the file content is exactly this content */
const sameContent = (current: Buffer, content: Uint8Array | string) =>
  typeof content === 'string' ? current.toString('utf8') === content : current.equals(content);

/** Whether the file already holds exactly this content */
const hasContent = (path: string, content: Uint8Array | string): boolean => {
  try {
    return sameContent(readFileSync(path), content);
  } catch {
    return false;
  }
};

/** A name next to the file for its new content, unique in this process */
const temporaryName = (path: string) => `${path}.${process.pid}.${counter++}.tmp`;

/**
 * Write a file through a temporary sibling and a rename, so a reader never sees a half-written file.
 * Several editor windows regenerate the theme at the same time, and the editor reads the theme json while it is
 * being written: a plain write can expose a truncated or interleaved file ("End of file expected", #67).
 *
 * A file that already holds the content is left alone: the theme has thousands of icons, and writing them all again
 * blocks the extension host for seconds on Windows, where reading them back is about ten times faster (fork #28).
 * The icons themselves are written with {@link writeFileAtomicAsync}, which blocks nothing.
 * @returns whether the file was written
 */
export const writeFileAtomic = (path: string, content: Uint8Array | string): boolean => {
  if (hasContent(path, content)) return false;

  mkdirSync(dirname(path), { recursive: true });
  const temporary = temporaryName(path);

  try {
    writeFileSync(temporary, content, 'utf8');
    renameSync(temporary, path);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
  return true;
};

/**
 * {@link writeFileAtomic} without blocking the extension host while the file system works: the reads and writes of
 * thousands of icons kept every other extension waiting for tens of seconds on Windows.
 * @returns whether the file was written
 */
export const writeFileAtomicAsync = async (path: string, content: Uint8Array | string): Promise<boolean> => {
  try {
    if (sameContent(await readFile(path), content)) return false;
  } catch {
    // no file yet
  }

  await mkdir(dirname(path), { recursive: true });
  const temporary = temporaryName(path);

  try {
    await writeFile(temporary, content, 'utf8');
    await rename(temporary, path);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  return true;
};
