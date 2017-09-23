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

function addTextStyle(context,styleName,theStyle) {
	var textStyles = context.document.documentData().layerTextStyles();
	textStyles.addSharedStyleWithName_firstInstance(styleName,theStyle.style());

	return getTextStyleByName(context,styleName);
}

function updateTextStyle(context,styleName,theStyle) {
	var textStyles = context.document.documentData().layerTextStyles();
	textStyles.updateValueOfSharedObject_byCopyingInstance(getTextStyleByName(context,styleName),theStyle.style());

	return getTextStyleByName(context,styleName);
}

function createTextStyle(styleData) {
	var textStyle = MSTextLayer.alloc().initWithFrame(nil);
	textStyle.setFontSize(styleData.fontSize);
	textStyle.setLineHeight(styleData.lineHeight);
	textStyle.setTextAlignment(styleData.textAlignment);
	textStyle.setFontPostscriptName(styleData.fontFace);

	return textStyle;
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

function createGroupObject(symbols,depth) {
	// Group variables
	var groupCount = 0;
	var groupLayout = [];
	var lastGroupPrefix;

	// Iterate through the symbols
	for (var i = 0; i < symbols.count(); i++) {
		// Symbol variables
		var symbol = symbols.objectAtIndex(i);
		var symbolName = symbol.name();

		// Determine a break point in the symbol name
		var breakPoint = (symbolName.indexOf("/") != -1) ? getCharPosition(symbolName,"/",depth+1) : 0;

		// Set a prefix for current group
		var thisGroupPrefix = (breakPoint > 0) ? symbolName.slice(0,breakPoint) : symbolName;

		// Trim leading/trailing white space from prefix
		thisGroupPrefix = thisGroupPrefix.trim();

		// If this group prefix is not the same as last group
		if (lastGroupPrefix != thisGroupPrefix) {
			// Increment the group counter
			groupCount++;
		}

		// Add an entry to the group object
		groupLayout.push({
			prefix: thisGroupPrefix,
			group: groupCount
		});

		// Set the last group prefix to current prefix
		lastGroupPrefix = thisGroupPrefix;
	}

	return groupLayout;
}

function sortLayerList(symbols,output) {
	var loop = symbols.objectEnumerator(), symbol;

	while (symbol = loop.nextObject()) {
		symbol.moveToLayer_beforeLayer(output,nil);
		symbol.select_byExpandingSelection(false,true);
	}
}

function removeUnusedSymbols(context,pluginDomain) {
	var symbols = context.document.documentData().allSymbols().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("isSafeToDelete == 1",pluginDomain));
	var loop = symbols.objectEnumerator(), symbol;

	var exemptSymbols = getExemptSymbols(context,pluginDomain);

	var count = 0;

	while (symbol = loop.nextObject()) {
		if (exemptSymbols.indexOf(String(symbol.symbolID())) == -1) {
			symbol.removeFromParent();
			log(symbol.name() + " was removed by Symbol Organizer");
			count++;
		}
	}

	return count;
}

function getExemptSymbols(context,pluginDomain) {
	var exemptSymbols = [];
	var overrideKey = 'symbolID';

	var pages = context.document.pages();
	var pageLoop = pages.objectEnumerator(), page;

	while (page = pageLoop.nextObject()) {
		var symbolInstancesWithOverrides = page.children().filteredArrayUsingPredicate(NSPredicate.predicateWithFormat("className == %@ && overrides != nil","MSSymbolInstance",pluginDomain));

		var symbolInstanceLoop = symbolInstancesWithOverrides.objectEnumerator(), instance;

		while (instance = symbolInstanceLoop.nextObject()) {
			var symbolInstanceOverrideValues = instance.overrides().allValues();

			for (var i = 0; i < symbolInstanceOverrideValues.count(); i++) {
				if (overrideKey in symbolInstanceOverrideValues[i]) {
					var instanceOverrideValue = symbolInstanceOverrideValues[i].valueForKey(overrideKey);

					if (instanceOverrideValue != "" && instanceOverrideValue != null) {
						exemptSymbols.push(String(instanceOverrideValue));
					}
				}
			}
		}
	}

	var exemptSymbols = exemptSymbols.filter(function(item,pos) {
		return exemptSymbols.indexOf(item) == pos;
	});

	return exemptSymbols;
}
