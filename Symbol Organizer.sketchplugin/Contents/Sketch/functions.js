var sketchVersion = (typeof BCSketchInfo !== 'undefined') ? BCSketchInfo.shared().metadata().appVersion : MSApplicationMetadata.metadata().appVersion

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

	if (textStyles.addSharedStyleWithName_firstInstance) {
		textStyles.addSharedStyleWithName_firstInstance(styleName,theStyle.style());
	} else if (sketchVersion < 52) {
		var textStyle = MSSharedStyle.alloc().initWithName_firstInstance(styleName,theStyle.style());

		textStyles.addSharedObject(textStyle);
	} else {
		var textStyle = MSSharedStyle.alloc().initWithName_style(styleName,theStyle.style());

		textStyles.addSharedObject(textStyle);
	}

	return getTextStyleByName(context,styleName);
}

function updateTextStyle(context,styleName,theStyle) {
	var textStyles = context.document.documentData().layerTextStyles(),
		currentStyle = getTextStyleByName(context,styleName);

	if (textStyles.updateValueOfSharedObject_byCopyingInstance) {
		textStyles.updateValueOfSharedObject_byCopyingInstance(currentStyle,theStyle.style());
	} else {
		currentStyle.updateToMatch(theStyle.style());
	}

	return getTextStyleByName(context,styleName);
}

function createTextStyle(styleData) {
	var textStyle = MSTextLayer.alloc().initWithFrame(nil);
	textStyle.setFontSize(styleData.fontSize);
	textStyle.setLineHeight(styleData.lineHeight);
	textStyle.setTextAlignment(styleData.textAlignment);
	textStyle.setFontPostscriptName(styleData.fontFace);
	textStyle.setTextColor(MSImmutableColor.colorWithSVGString("#" + styleData.fontColor));

	return textStyle;
}

function createSelect(items,selectedItemIndex,frame) {
	var comboBox = NSComboBox.alloc().initWithFrame(frame),
		selectedItemIndex = (selectedItemIndex > -1) ? selectedItemIndex : 0;

	comboBox.addItemsWithObjectValues(items);
	comboBox.selectItemAtIndex(selectedItemIndex);
	comboBox.setNumberOfVisibleItems(16);
	comboBox.setCompletes(1);

	return comboBox;
}

function createRadioButtons(options,selected,format,x,y) {
	var rows = options.length,
		columns = 1,
		buttonMatrixWidth = 300,
		buttonCellWidth = buttonMatrixWidth,
		x = (x) ? x : 0,
		y = (y) ? y : 0;

	if (format && format != 0) {
		rows = options.length / 2;
		columns = 2;
		buttonMatrixWidth = 300;
		buttonCellWidth = buttonMatrixWidth / columns;
	}

	var buttonCell = NSButtonCell.alloc().init();

	buttonCell.setButtonType(NSRadioButton);

	var buttonMatrix = NSMatrix.alloc().initWithFrame_mode_prototype_numberOfRows_numberOfColumns(
		NSMakeRect(x,y,buttonMatrixWidth,rows*20),
		NSRadioModeMatrix,
		buttonCell,
		rows,
		columns
	);

	buttonMatrix.setCellSize(NSMakeSize(buttonCellWidth,20));

	// Create a cell for each option
	for (i = 0; i < options.length; i++) {
		buttonMatrix.cells().objectAtIndex(i).setTitle(options[i]);
		buttonMatrix.cells().objectAtIndex(i).setTag(i);
	}

	// Select the default cell
	buttonMatrix.selectCellAtRow_column(selected,0);

	// Return the matrix
	return buttonMatrix;
}

function createField(value,frame) {
	var field = NSTextField.alloc().initWithFrame(frame);

	field.setStringValue(value);

	return field;
}

function createLabel(text,size,frame) {
	var label = NSTextField.alloc().initWithFrame(frame);

	label.setStringValue(text);
	label.setFont(NSFont.systemFontOfSize(size));
	label.setBezeled(false);
	label.setDrawsBackground(false);
	label.setEditable(false);
	label.setSelectable(false);

	return label;
}

function createBoldLabel(text,size,frame) {
	var label = NSTextField.alloc().initWithFrame(frame);

	label.setStringValue(text);
	label.setFont(NSFont.boldSystemFontOfSize(size));
	label.setBezeled(false);
	label.setDrawsBackground(false);
	label.setEditable(false);
	label.setSelectable(false);

	return label;
}

function createDescription(text,size,frame) {
	var label = NSTextField.alloc().initWithFrame(frame),
		textColor = (isUsingDarkTheme()) ? NSColor.lightGrayColor() : NSColor.darkGrayColor();

	label.setStringValue(text);
	label.setFont(NSFont.systemFontOfSize(size));
	label.setTextColor(textColor);
	label.setBezeled(false);
	label.setDrawsBackground(false);
	label.setEditable(false);
	label.setSelectable(false);

	return label;
}

function createCheckbox(item,flag,frame) {
	var checkbox = NSButton.alloc().initWithFrame(frame),
		flag = (flag == false) ? NSOffState : NSOnState;

	checkbox.setButtonType(NSSwitchButton);
	checkbox.setBezelStyle(0);
	checkbox.setTitle(item.name);
	checkbox.setTag(item.value);
	checkbox.setState(flag);

	return checkbox;
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

function isUsingDarkTheme() {
	return (MSTheme.sharedTheme().isDark()) ? true : false;
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
		var thisItem = order[i],
			nextItem = order[i+1];

		if (nextItem) thisItem.setNextKeyView(nextItem);
	}

	alert.window().setInitialFirstResponder(order[0]);
}

function createGroupObject(symbols,depth) {
	// Group variables
	var groupCount = 0;
	var groupLayout = [];

	// Iterate through the symbols
	for (var i = 0; i < symbols.count(); i++) {
		// Symbol variables
		var symbol = symbols.objectAtIndex(i),
			symbolName = symbol.name(),
			symbolGroup = 0,
			breakPoint,
			groupPrefix;

		// Determine a break point in the symbol name
		breakPoint = (symbolName.indexOf("/") != -1) ? getCharPosition(symbolName,"/",depth+1) : 0;

		// Set a prefix for current group
		groupPrefix = (breakPoint > 0) ? symbolName.slice(0,breakPoint) : symbolName;

		// Trim leading/trailing white space from prefix
		groupPrefix = groupPrefix.trim();

		// Iterate through groupLayout to look for prefix matches...
		for (key in groupLayout) {
			// If no symbol group has been set yet...
			if (symbolGroup == 0) {
				// Set symbol group if a match was found
				if (groupLayout[key]['prefix'].toLowerCase() == groupPrefix.toLowerCase()) symbolGroup = groupLayout[key]['group'];
			}
		}

		// If still no symbol group...
		if (symbolGroup == 0) {
			// Iterate the groupCount
			groupCount++;

			// Set the symbol group to the new group number
			symbolGroup = groupCount;
		}

		// Add an entry to the group object
		groupLayout.push({
			prefix: groupPrefix,
			group: symbolGroup,
			index: i
		});
	}

	// Sort groupLayout by group number
	groupLayout.sort(function(a,b) {
		return a.group - b.group;
	});

	// Return the groupLayout object
	return groupLayout;
}

function sortLayerList(symbols,output) {
	symbols.forEach((symbol,i) => {
		symbol.moveToLayer_beforeLayer(output,nil);
		symbol.select_byExtendingSelection(0,1);
	});
}

function getExemptSymbols() {
	var exemptSymbols = [],
		overrideKey = "symbolID";

	var pages = MSDocument.currentDocument().pages(),
		pageLoop = pages.objectEnumerator(),
		page;

	while (page = pageLoop.nextObject()) {
		var predicate = NSPredicate.predicateWithFormat("className == %@ && overrides != nil","MSSymbolInstance"),
			instancesWithOverrides = page.children().filteredArrayUsingPredicate(predicate),
			loop = instancesWithOverrides.objectEnumerator(),
			instance;

		while (instance = loop.nextObject()) {
			var symbolInstanceOverrideValues = instance.overrides().allValues();

			for (var i = 0; i < symbolInstanceOverrideValues.count(); i++) {
				var thisObject = symbolInstanceOverrideValues[i];

				for (var key in thisObject) {
					if (thisObject[overrideKey]) {
						var instanceOverrideValue = thisObject.valueForKey(overrideKey);

						if (instanceOverrideValue != "" && instanceOverrideValue != null) {
							exemptSymbols.push(String(instanceOverrideValue));
						}
					}

					if (typeof(thisObject[key] == "object")) {
						var instanceOverrideValue = thisObject[key][overrideKey];

						if (instanceOverrideValue != "" && instanceOverrideValue != null) {
							exemptSymbols.push(String(instanceOverrideValue));
						}
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

function systemFontExists(fontName) {
	var systemFonts = NSFontManager.sharedFontManager().availableFonts(),
		loop = systemFonts.objectEnumerator(),
		font,
		fontExists = false;

	while (font = loop.nextObject()) {
		if (font == fontName) fontExists = true;
	}

	return fontExists;
}

function createDivider(frame) {
	var divider = NSView.alloc().initWithFrame(frame);

	divider.setWantsLayer(1);
	divider.layer().setBackgroundColor(CGColorCreateGenericRGB(204/255,204/255,204/255,1.0));

	return divider;
}

function sortSymbolsByName(a,b) {
	var match = /([^a-zA-Z0-9])|([0-9]+)|([a-zA-Z]+)/g,
		ax = [],
		bx = [];

		a.name().replace(match,function(_,$1,$2,$3) { ax.push([$1 || "", $2 || Infinity, $3 || "0"])});
		b.name().replace(match,function(_,$1,$2,$3) { bx.push([$1 || "", $2 || Infinity, $3 || "0"])});

		while (ax.length && bx.length) {
			var an = ax.shift(),
				bn = bx.shift(),
				nn = an[0].localeCompare(bn[0]) || (an[1] - bn[1]) || an[2].localeCompare(bn[2]);

			if (nn) return nn;
		}

		return ax.length - bx.length;
}

function openUrl(url) {
	NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
}

function googleAnalytics(context,category,action,label,value) {
	var trackingID = "UA-117515685-1",
		uuidKey = "google.analytics.uuid",
		uuid = NSUserDefaults.standardUserDefaults().objectForKey(uuidKey);

	if (!uuid) {
		uuid = NSUUID.UUID().UUIDString();
		NSUserDefaults.standardUserDefaults().setObject_forKey(uuid,uuidKey);
	}

	var url = "https://www.google-analytics.com/collect?v=1";
	// Tracking ID
	url += "&tid=" + trackingID;
	// Source
	url += "&ds=sketch" + sketchVersion;
	// Client ID
	url += "&cid=" + uuid;
	// pageview, screenview, event, transaction, item, social, exception, timing
	url += "&t=event";
	// App Name
	url += "&an=" + encodeURI(context.plugin.name());
	// App ID
	url += "&aid=" + context.plugin.identifier();
	// App Version
	url += "&av=" + context.plugin.version();
	// Event category
	url += "&ec=" + encodeURI(category);
	// Event action
	url += "&ea=" + encodeURI(action);
	// Event label
	if (label) {
		url += "&el=" + encodeURI(label);
	}
	// Event value
	if (value) {
		url += "&ev=" + encodeURI(value);
	}

	var session = NSURLSession.sharedSession(),
		task = session.dataTaskWithURL(NSURL.URLWithString(NSString.stringWithString(url)));

	task.resume();
}

function getUserDefaults(domain) {
	return NSUserDefaults.alloc().initWithSuiteName(domain);
}

function updateSettingsWithDocument(context,settings) {
	for (i in settings) {
		try {
			var value = sketch.Settings.layerSettingForKey(page,i);
		} catch (err) {
			log('Could not JSON.parse value, using old method…');

			var value = context.command.valueForKey_onLayer(i,page.sketchObject);
		}

		if (value != null) settings[i] = value;
	}

	return settings;
}

function updateSettingsWithGlobal(defaults,settings) {
	for (i in settings) {
		var value = defaults.objectForKey(i);

		if (value) settings[i] = value;
	}

	return settings;
}
