import * as vscode from 'vscode';
import Render from './settings_page/settings_render';
import options from './config';

export class Settings {

    constructor(context: vscode.ExtensionContext) {
        context.subscriptions.push(vscode.commands.registerCommand('extension.openSettings', () => {
            SettingsPanel.createOrShow(context.extensionPath);
        }));

        context.subscriptions.push(vscode.commands.registerCommand('extension.doRefactor', () => {
            SettingsPanel.currentPanel && SettingsPanel.currentPanel.doRefactor();
        }));

        if (vscode.window.registerWebviewPanelSerializer) {
            vscode.window.registerWebviewPanelSerializer(SettingsPanel.viewType, {
                async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                    console.log(`Got state: ${state}`);
                    SettingsPanel.revive(webviewPanel, context.extensionPath);
                }
            });
        }
    }


}

class SettingsPanel {

    public static currentPanel: SettingsPanel | undefined;

    public static readonly viewType = 'settings';

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionPath: string;
    private disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionPath: string) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (this.currentPanel) {
            this.currentPanel.panel.reveal();
        }

        const panel = vscode.window.createWebviewPanel(this.viewType, 'settings', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(extensionPath)
            ],
        });

        this.currentPanel = new SettingsPanel(panel, extensionPath);
    }

    public static revive(panel: vscode.WebviewPanel, extensionPath: string) {

    }

    private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
        this.panel = panel;
        this.extensionPath = extensionPath;

        this.update();

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        this.panel.webview.onDidReceiveMessage(message => {
            switch (message.commend) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this.disposables);
    }

    public doRefactor() {
        // this.panel.webview.postMessage({ command: 'refactor' });
    }

    public dispose() {
        SettingsPanel.currentPanel = undefined;
        this.panel.dispose();

        while (this.disposables.length) {
            const x = this.disposables.pop();
            x && x.dispose();
        }
    }

    private async update() {
        this.panel.title = 'settings';
        this.panel.webview.html = this.getHtmlForWebview();
        this.panel.webview.postMessage(options);
    }

    private getHtmlForWebview() {
        return Render(this.extensionPath);
    }
}