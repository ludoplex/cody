import * as vscode from 'vscode'

import { languagePromptMixin, PromptMixin } from '@sourcegraph/cody-shared/src/prompt/prompt-mixin'

import { ExtensionApi } from './extension-api'
import { start } from './main'

export function activate(context: vscode.ExtensionContext): ExtensionApi {
    const api = new ExtensionApi()
    PromptMixin.add(languagePromptMixin(vscode.env.language))

    if (process.env.CODY_FOCUS_ON_STARTUP) {
        setTimeout(() => {
            void vscode.commands.executeCommand('cody.chat.focus')
        }, 250)
    }

    start(context)
        .then(disposable => {
            if (!context.globalState.get('extension.hasActivatedPreviously')) {
                void context.globalState.update('extension.hasActivatedPreviously', 'true')
            }
            context.subscriptions.push(disposable)
        })
        .catch(error => console.error(error))

    return api
}
