function actionWithType(context,type) {
	var controller = context.document.actionsController();

	if (controller.actionWithName) {
		return controller.actionWithName(type);
	} else if (controller.actionWithID) {
		return controller.actionWithID(type);
	} else {
		return controller.actionForID(type);
	}
}

function addTextStyle(context,styleName,fontName,fontSize,fontLineHeight,textAlignment) {
	getTextStyleByName(context,styleName,1);

	var textStyles = context.document.documentData().layerTextStyles();

	var textStyle = [[MSTextLayer alloc] initWithFrame:nil];
	textStyle.setFontSize(fontSize);
	textStyle.setLineHeight(fontLineHeight);
	textStyle.setTextAlignment(textAlignment);
	textStyle.setFontPostscriptName(fontName);

	textStyles.addSharedStyleWithName_firstInstance(styleName,textStyle.style());
}

function createSelect(items,selectedItemIndex,frame) {
	selectedItemIndex = (selectedItemIndex > -1) ? selectedItemIndex : 0;
	var comboBox = [[NSComboBox alloc] initWithFrame:frame];
	[comboBox addItemsWithObjectValues:items];
	[comboBox selectItemAtIndex:selectedItemIndex];

	return comboBox;
}

function createRadioButtons(options,selected,format,x,y) {
	// Set number of rows and columns
	if (!format || format == 0) {
		var rows = options.length;
		var columns = 1;
		var buttonMatrixWidth = 300;
		var buttonCellWidth = buttonMatrixWidth;
	} else {
		var rows = options.length / 2;
		var columns = 2;
		var buttonMatrixWidth = 300;
		var buttonCellWidth = buttonMatrixWidth / columns;
	}

	var x = (x) ? x : 0;
	var y = (y) ? y : 0;

	// Make a prototype cell
	var buttonCell = [[NSButtonCell alloc] init];
	[buttonCell setButtonType:NSRadioButton]

	// Make a matrix to contain the radio cells
	var buttonMatrix = [[NSMatrix alloc] initWithFrame: NSMakeRect(x,y,buttonMatrixWidth,rows*25) mode:NSRadioModeMatrix prototype:buttonCell numberOfRows:rows numberOfColumns:columns];
	[buttonMatrix setCellSize: NSMakeSize(buttonCellWidth,20)];

	// Create a cell for each option
	for (i = 0; i < options.length; i++) {
		[[[buttonMatrix cells] objectAtIndex: i] setTitle: options[i]];
		[[[buttonMatrix cells] objectAtIndex: i] setTag: i];
	}

	// Select the default cell
	[buttonMatrix selectCellAtRow:selected column:0]

	// Return the matrix
	return buttonMatrix;
}

function createField(value,frame) {
	var field = [[NSTextField alloc] initWithFrame:frame];
	[field setStringValue:value];

	return field;
}

function createLabel(text,size,frame) {
	var label = [[NSTextField alloc] initWithFrame:frame];
	[label setStringValue:text];
	[label setFont:[NSFont boldSystemFontOfSize:size]];
	[label setBezeled:false];
	[label setDrawsBackground:false];
	[label setEditable:false];
	[label setSelectable:false];

	return label;
}

function createDescription(text,size,frame) {
	var label = [[NSTextField alloc] initWithFrame:frame];
	[label setStringValue:text];
	[label setFont:[NSFont systemFontOfSize:size]];
	[label setTextColor:[NSColor colorWithCalibratedRed:(0/255) green:(0/255) blue:(0/255) alpha:0.6]];
	[label setBezeled:false];
	[label setDrawsBackground:false];
	[label setEditable:false];
	[label setSelectable:false];

	return label;
}

function createCheckbox(item,flag,frame) {
	flag = ( flag == false ) ? NSOffState : NSOnState;
	var checkbox = [[NSButton alloc] initWithFrame:frame];
	[checkbox setButtonType: NSSwitchButton];
	[checkbox setBezelStyle: 0];
	[checkbox setTitle: item.name];
	[checkbox setTag: item.value];
	[checkbox setState: flag];

	return checkbox;
}

function displayDialog(body,title) {
	var app = NSApplication.sharedApplication();
	app.displayDialog_withTitle(body,title);
}

function findLayerByName(scope,name,type) {
	var scope = scope.layers();

	if (scope) {
		for (var i = 0; i < scope.count(); i++) {
			var layerName = scope.objectAtIndex(i).name().trim();

			if ((!type && layerName == name) || (type && layerName == name && scope.objectAtIndex(i) instanceof type)) {
				return scope.objectAtIndex(i);
			}
		}
	}

	return false;
}

function getCharPosition(string,match,count) {
	var actualCount = string.split(match).length - 1;

	if (actualCount < count) {
		return string.split(match,actualCount).join(match).length;
	} else {
		return string.split(match,count).join(match).length;
	}
}

function getTextStyleByName(context,styleName,removeStyle) {
	var textStyles = context.document.documentData().layerTextStyles().objects();

	if (textStyles) {
		for (var i = 0; i < textStyles.count(); i++) {
			if (textStyles.objectAtIndex(i).name() == styleName) {
				if (removeStyle && removeStyle == 1) {
					context.document.documentData().layerTextStyles().removeSharedStyle(textStyles.objectAtIndex(i));
					return false;
				} else {
					return textStyles.objectAtIndex(i);
				}
			}
		}
	}

	return false;
}

function renameDuplicateSymbols(symbols) {
	var symbolLoop = symbols.objectEnumerator();
	var symbol;
	var lastSymbolName;
	var duplicateSymbolCount = 0;

	while (symbol = symbolLoop.nextObject()) {
		var thisSymbolName = String(symbol.name());

		if (thisSymbolName == lastSymbolName) {
			duplicateSymbolCount++;

			symbol.setName(thisSymbolName + " Copy " + duplicateSymbolCount);
		} else {
			duplicateSymbolCount = 0;
		}

		lastSymbolName = thisSymbolName;
	}

	return symbols;
}

function setKeyOrder(alert,order) {
	for (var i = 0; i < order.length; i++) {
		var thisItem = order[i];
		var nextItem = order[i+1];

		if (nextItem) thisItem.setNextKeyView(nextItem);
	}

	alert.alert().window().setInitialFirstResponder(order[0]);
}
