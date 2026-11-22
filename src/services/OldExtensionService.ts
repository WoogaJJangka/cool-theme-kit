import i18next from 'i18next';
import { OLD_EXTENSION_ID } from 'src/helpers/constants';
import { isCancellation } from 'src/helpers/utils';
import { logger } from 'src/services/LoggingService';
import { commands, extensions, window } from 'vscode';

import type { MessageItem } from 'vscode';

// An installed old copy contributes the same settings and theme ids as this extension: VS Code then keeps only one of
// each, and the old copy writes its own themes.

/** When the old extension is still installed, offer to uninstall it (not awaited by the activation: it waits for the user) */
const offerToUninstallOldExtension = async (): Promise<void> => {
  const old = extensions.all.find((extension) => extension.id.toLowerCase() === OLD_EXTENSION_ID);
  if (!old) return;
  logger.info(`The old extension ${old.id} is installed`);
  const uninstall: MessageItem = { title: i18next.t('oldExtension.uninstall') };
  const action = await window.showWarningMessage(i18next.t('oldExtension.found'), uninstall);
  if (action !== uninstall) return;
  await commands.executeCommand('workbench.extensions.uninstallExtension', old.id);
  window.showInformationMessage(i18next.t('oldExtension.removed')).then(undefined, (error: unknown) => {
    if (!isCancellation(error)) logger.error(String(error));
  });
};

export { offerToUninstallOldExtension };
