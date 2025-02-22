import dedent from 'dedent'

export const CURSOR = '️🔥'

// TODO: add more code samples and context (recently opened files, etc.)
export const completionsDataset = [
    `
    import signale from 'signale'

    function logMessage(message: string) {
        ${CURSOR}
    }
`,
    `
    import path from 'path'

    function writeDateToDisk() {
        ${CURSOR}
    }
`,
    `
    class TextDocument implements vscode.TextDocument {
        private text: string

        constructor(public uri: vscode.Uri, text: string) {
            this.text = text.replace(/\r\n/gm, '\n') // normalize end of line
        }

        private get lines(): string[] {
            return this.text.split('\n')
        }

        lineAt(position: number | vscode.Position): vscode.TextLine {
            ${CURSOR}
        }
    }
`,
    `import { execFileSync } from 'child_process'

function getOSName(): string | null {
    if (typeof window === 'undefined') {
      ${CURSOR}
}
`,
    `
function isDarkColorScheme(): boolean {
    return window.match${CURSOR}
}
`,
    `
function isLocalhost(): boolean {
    return window.location.host${CURSOR}
}
`,
].map(code => dedent(code))
