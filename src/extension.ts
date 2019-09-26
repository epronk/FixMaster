import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as FIX from './fixRepository';
import { fixMessagePrefix, parseMessage, prettyPrintMessage } from './fixProtcol';

export function activate(context: vscode.ExtensionContext) {

	vscode.commands.registerCommand('extension.format', () => {

		const {activeTextEditor} = vscode.window;
		
		if (!activeTextEditor) {
			vscode.window.showErrorMessage('No document is open or the file is too large.');
			return;
		}

		const configuration = vscode.workspace.getConfiguration();

		var repositoryPath = configuration.get('fixmaster.repositoryPath') as string;
		
		if (!repositoryPath) {
			repositoryPath = "./repository";
		}
		
		if (!path.isAbsolute(repositoryPath)) {
			repositoryPath = path.join(context.extensionPath, repositoryPath);
		}
		
		if (!fs.existsSync(repositoryPath)) {
			vscode.window.showErrorMessage("The repository path '" + repositoryPath + "' cannot be found.");
			return;
		}
	
		const repository = new FIX.Repository(repositoryPath);

		const {document} = activeTextEditor;

		const edit = new vscode.WorkspaceEdit();

		for (var index = 0; index < document.lineCount; ++index) {

			const line = document.lineAt(index);
			
			const fixMessageIndex = line.text.indexOf(fixMessagePrefix); 

			if (fixMessageIndex < 0) {
				continue;
			}

			const fieldSeparator = configuration.get("fixmaster.fieldSeparator") as string;

			const message = parseMessage(line.text.substr(fixMessageIndex), fieldSeparator);	

			if (!message) {
				continue;
			}
			
			repository.nameLookup = FIX.NameLookup[configuration.get('fixmaster.nameLookup') as keyof typeof FIX.NameLookup];

			const pretty = prettyPrintMessage(message, repository);
			
			edit.replace(document.uri, line.range, pretty);
		}

		vscode.workspace.applyEdit(edit);
    });
}
